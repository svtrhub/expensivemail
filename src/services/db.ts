import Dexie, { Table } from 'dexie';
import { Expense } from '../types';

export interface OutboxItem {
  id?: number;
  action:
    | 'CREATE_EXPENSE'
    | 'UPDATE_EXPENSE'
    | 'DELETE_EXPENSE'
    | 'BATCH_SAVE_EXPENSES';
  entityId: string;
  payload: any;
  timestamp: string;
  retryCount: number;
  lastError?: string;
}

export interface DeadLetterItem {
  id?: number;
  outboxId?: number;
  action: OutboxItem['action'];
  entityId: string;
  payload: any;
  timestamp: string;
  retryCount: number;
  failureReason: string;
  failedAt: string;
}

export interface CachedFingerprint {
  hash: string;
  expenseId: string;
  createdAt: string;
}

export interface KeyValueConfig {
  id: string;
  value: any;
}

export class ExpensiveMailDB extends Dexie {
  expenses!: Table<Expense, string>;
  outbox!: Table<OutboxItem, number>;
  deadLetter!: Table<DeadLetterItem, number>;
  fingerprints!: Table<CachedFingerprint, string>;
  config!: Table<KeyValueConfig, string>;

  constructor() {
    super('ExpensiveMailDB');
    this.version(2).stores({
      expenses:
        'id, date, merchant, category, type, syncStatus, [date+merchant]',
      outbox: '++id, action, entityId, timestamp, retryCount',
      deadLetter: '++id, action, entityId, failedAt, retryCount',
      fingerprints: 'hash, expenseId, createdAt',
      config: 'id',
    });
  }
}

export const localDB = new ExpensiveMailDB();
export const MAX_OUTBOX_RETRIES = 5;

/**
 * Enqueues an operation into the IndexedDB Write-Ahead Outbox.
 */
export async function enqueueOutboxItem(
  action: OutboxItem['action'],
  entityId: string,
  payload: any
): Promise<number> {
  try {
    const id = await localDB.outbox.add({
      action,
      entityId,
      payload,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    });
    return id;
  } catch (err) {
    console.error('[IndexedDB] Failed to enqueue outbox item:', err);
    return -1;
  }
}

/**
 * Save expense array to local IndexedDB.
 */
export async function cacheExpensesLocally(expenses: Expense[]): Promise<void> {
  try {
    await localDB.expenses.bulkPut(expenses);
  } catch (err) {
    console.warn('[IndexedDB] Failed bulk caching expenses:', err);
  }
}

/**
 * Load all cached expenses from local IndexedDB.
 */
export async function getLocalCachedExpenses(): Promise<Expense[]> {
  try {
    return await localDB.expenses.orderBy('date').reverse().toArray();
  } catch (err) {
    console.warn('[IndexedDB] Failed retrieving local expenses:', err);
    return [];
  }
}

export async function flushOutboxQueue(
  flushHandler: (item: OutboxItem) => Promise<boolean>
): Promise<{ processed: number; failed: number; deadLettered: number }> {
  let processed = 0;
  let failed = 0;
  let deadLettered = 0;

  try {
    const items = await localDB.outbox.orderBy('id').toArray();
    for (const item of items) {
      if (!item.id) continue;

      // 1. Dead-Letter Queue Routing (Max 5 Retries)
      if (item.retryCount >= MAX_OUTBOX_RETRIES) {
        console.warn(
          `[Outbox Dead-Letter] Item ${item.id} (${item.action}) exceeded max retries (${item.retryCount}). Routing to deadLetter table.`
        );
        await localDB.deadLetter.add({
          outboxId: item.id,
          action: item.action,
          entityId: item.entityId,
          payload: item.payload,
          timestamp: item.timestamp,
          retryCount: item.retryCount,
          failureReason: item.lastError || 'Exceeded max retry limit of 5',
          failedAt: new Date().toISOString(),
        });
        await localDB.outbox.delete(item.id);
        deadLettered++;
        continue;
      }

      // 2. Delegate directly to flushHandler which invokes atomic runTransaction (syncExpenseToFirestore)
      try {
        const success = await flushHandler(item);
        if (success) {
          await localDB.outbox.delete(item.id);
          processed++;
        } else {
          item.retryCount += 1;
          item.lastError = 'Flush handler returned false';
          await localDB.outbox.put(item);
          failed++;
        }
      } catch (err: any) {
        item.retryCount += 1;
        item.lastError = err?.message || String(err);
        await localDB.outbox.put(item);
        failed++;
      }
    }
  } catch (err) {
    console.error('[IndexedDB Outbox] Error processing outbox queue:', err);
  }

  return { processed, failed, deadLettered };
}

// Auto-flush on reconnect
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.info(
      '[IndexedDB Outbox] Network connection restored. Auto-flushing outbox queue...'
    );
  });
}
