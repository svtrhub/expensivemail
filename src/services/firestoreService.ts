import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
  increment,
  writeBatch,
  runTransaction,
  onSnapshot,
  Unsubscribe,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebaseAuth';
import {
  UserProfile,
  BankAccount,
  Expense,
  BudgetCategory,
  SyncLog,
  IngestionRule,
  UserTrustedDomainRule,
  UserUntrustedDomainRule,
  MonthlySummaryDoc,
} from '../types';
import { loadUserSettingsConfig } from './userSettingsService';
import {
  generateExpenseFingerprint,
  generateExpenseFingerprintResult,
} from './senderProvenance';
import { enqueueOutboxItem, cacheExpensesLocally } from './db';

export interface UserFullData {
  profile: UserProfile | null;
  accounts: BankAccount[];
  expenses: Expense[];
  budgets: BudgetCategory[];
  syncLogs: SyncLog[];
  ingestionRules: IngestionRule[];
  userTrustedRules: UserTrustedDomainRule[];
  userUntrustedRules: UserUntrustedDomainRule[];
  hasMoreExpenses?: boolean;
  lastExpenseDoc?: QueryDocumentSnapshot<DocumentData> | null;
}

export interface MonthlySpendingSummary {
  monthKey: string; // 'YYYY-MM'
  totalDebit: number;
  totalCredit: number;
  transactionCount: number;
  categoryTotals: Record<string, number>;
  merchantTotals: Record<string, number>;
  lastUpdated: string;
}

/**
 * Loads all user data from Firestore for a given userId.
 * Returns null if user profile does not exist in Firestore.
 */
export async function loadUserDataFromFirestore(
  userId: string
): Promise<UserFullData | null> {
  if (!db || !userId) return null;

  try {
    const userDocRef = doc(db, 'users', userId);
    let userSnap;
    try {
      userSnap = await getDoc(userDocRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${userId}`);
      return null;
    }

    if (!userSnap.exists()) {
      return null;
    }

    const profile = userSnap.data() as UserProfile;

    // Coalesced queries (Phase 0 Task 2):
    // 1. Bank Accounts
    // 2. Paginated Expenses (limit 50 per cursor page)
    // 3. Sync Logs (limit 20)
    // 4. Coalesced Settings Config (users/{uid}/settings/config)
    const accounts: BankAccount[] = [];
    const expenses: Expense[] = [];
    const syncLogs: SyncLog[] = [];
    let lastExpenseDoc: QueryDocumentSnapshot<DocumentData> | null = null;
    let hasMoreExpenses = false;

    const [accountsRes, pagedExpensesRes, logsRes, configRes] =
      await Promise.allSettled([
        getDocs(collection(db, `users/${userId}/bank_accounts`)),
        loadExpensesPaged(userId, 50, null),
        getDocs(
          query(
            collection(db, `users/${userId}/sync_logs`),
            orderBy('timestamp', 'desc'),
            limit(20)
          )
        ),
        loadUserSettingsConfig(userId),
      ]);

    if (accountsRes.status === 'fulfilled') {
      accountsRes.value.forEach((d) => {
        accounts.push({ id: d.id, ...(d.data() as any) });
      });
    }

    if (pagedExpensesRes.status === 'fulfilled') {
      const paged = pagedExpensesRes.value;
      expenses.push(...paged.expenses);
      hasMoreExpenses = paged.hasMore;
      lastExpenseDoc = paged.lastDoc;
    }

    if (logsRes.status === 'fulfilled') {
      logsRes.value.forEach((d) => {
        syncLogs.push({ id: d.id, ...(d.data() as any) });
      });
    }

    const configData =
      configRes.status === 'fulfilled'
        ? configRes.value
        : {
            budgets: [],
            ingestionRules: [],
            userTrustedRules: [],
            userUntrustedRules: [],
            updatedAt: new Date().toISOString(),
          };

    // Cache expenses locally in IndexedDB for fast offline access
    if (expenses.length > 0) {
      cacheExpensesLocally(expenses).catch((e) =>
        console.warn('[IndexedDB Cache]', e)
      );
    }

    return {
      profile,
      accounts,
      expenses,
      budgets: configData.budgets,
      syncLogs,
      ingestionRules: configData.ingestionRules,
      userTrustedRules: configData.userTrustedRules,
      userUntrustedRules: configData.userUntrustedRules,
      hasMoreExpenses,
      lastExpenseDoc,
    };
  } catch (error: any) {
    const msg = error?.message || String(error);
    if (
      msg.includes('offline') ||
      msg.includes('client is offline') ||
      error?.code === 'unavailable'
    ) {
      // Graceful offline fallback
      return null;
    }
    console.warn('Notice loading user data from Firestore:', error);
    return null;
  }
}

/**
 * Initializes or saves the full user dataset into Firestore upon registration or onboarding.
 */
export async function saveInitialUserDataToFirestore(
  userId: string,
  profile: UserProfile,
  accounts: BankAccount[],
  expenses: Expense[],
  budgets: BudgetCategory[],
  syncLogs: SyncLog[],
  ingestionRules: IngestionRule[]
): Promise<boolean> {
  if (!db || !userId) return false;

  try {
    // 1. Save Profile
    const profilePath = `users/${userId}`;
    try {
      await setDoc(doc(db, 'users', userId), {
        ...profile,
        id: userId,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, profilePath);
    }

    // Collect document operations to commit in batches of max 450
    const ops: Array<{ docRef: any; data: any }> = [];

    // 2. Save Accounts
    for (const acc of accounts) {
      const safeId = acc.id.replace(/[^a-zA-Z0-9_-]/g, '_');
      ops.push({
        docRef: doc(db, `users/${userId}/bank_accounts`, safeId),
        data: { ...acc, id: safeId, userId },
      });
    }

    // 3. Save Expenses
    for (const exp of expenses) {
      const safeId = exp.id.replace(/[^a-zA-Z0-9_-]/g, '_');
      ops.push({
        docRef: doc(db, `users/${userId}/expenses`, safeId),
        data: { ...exp, id: safeId, userId },
      });
    }

    // 4. Save Budgets
    for (const b of budgets) {
      const safeId = (
        b.id || `budget_${b.category.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
      ).replace(/[^a-zA-Z0-9_-]/g, '_');
      ops.push({
        docRef: doc(db, `users/${userId}/budgets`, safeId),
        data: { ...b, id: safeId, userId },
      });
    }

    // 5. Save Ingestion Rules
    for (const rule of ingestionRules) {
      const safeId = rule.id.replace(/[^a-zA-Z0-9_-]/g, '_');
      ops.push({
        docRef: doc(db, `users/${userId}/ingestion_rules`, safeId),
        data: { ...rule, id: safeId, userId },
      });
    }

    // 6. Save Initial Sync Log
    if (syncLogs.length > 0) {
      const log = syncLogs[0];
      const safeId = log.id.replace(/[^a-zA-Z0-9_-]/g, '_');
      ops.push({
        docRef: doc(db, `users/${userId}/sync_logs`, safeId),
        data: { ...log, id: safeId, userId },
      });
    }

    const BATCH_LIMIT = 450;
    for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      const chunk = ops.slice(i, i + BATCH_LIMIT);
      for (const op of chunk) {
        batch.set(op.docRef, op.data);
      }
      await batch.commit();
    }
    return true;
  } catch (error) {
    console.error('Error saving initial user data to Firestore:', error);
    return false;
  }
}

/**
 * Checks if an expense fingerprint hash already exists in Firestore.
 * Performs direct doc lookup on users/{userId}/expense_fingerprints/{fingerprintHash} for O(1) check.
 */
export async function checkFingerprintExistsInFirestore(
  userId: string,
  fingerprintHash: string
): Promise<boolean> {
  if (!db || !userId || !fingerprintHash) return false;
  try {
    const fpRef = doc(
      db,
      `users/${userId}/expense_fingerprints`,
      fingerprintHash
    );
    const snap = await getDoc(fpRef);
    return snap.exists();
  } catch (err) {
    console.warn('[Fingerprint O(1) Check Warning]', err);
    return false;
  }
}

/**
 * Saves a fingerprint hash doc to users/{userId}/expense_fingerprints/{fingerprintHash}.
 */
export async function saveFingerprintToFirestore(
  userId: string,
  fingerprintHash: string,
  expenseId: string,
  merchant: string,
  amount: number,
  currency: string,
  date: string
): Promise<boolean> {
  if (!db || !userId || !fingerprintHash) return false;
  try {
    const fpRef = doc(
      db,
      `users/${userId}/expense_fingerprints`,
      fingerprintHash
    );
    await setDoc(fpRef, {
      hash: fingerprintHash,
      expenseId,
      merchant,
      amount,
      currency,
      date,
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.warn('[Save Fingerprint Warning]', err);
    return false;
  }
}

/**
 * Updates atomic monthly summary rollup doc users/{userId}/monthly_summaries/{YYYY-MM}
 * using FieldValue.increment() for zero-conflict aggregated financial reporting.
 */
export async function updateMonthlySummaryRollup(
  userId: string,
  expense: Expense,
  operation: 'add' | 'delete' = 'add'
): Promise<boolean> {
  if (!db || !userId || !expense.date) return false;

  const monthKey = expense.date.slice(0, 7); // 'YYYY-MM'
  const summaryRef = doc(db, `users/${userId}/monthly_summaries`, monthKey);
  const factor = operation === 'add' ? 1 : -1;
  const amount = Math.abs(expense.amount || 0) * factor;

  const sanitizeKey = (key: string) =>
    (key || 'Other').replace(/[^a-zA-Z0-9_-]/g, '_');

  try {
    const updateData: any = {
      monthKey,
      lastUpdated: new Date().toISOString(),
      transactionCount: increment(factor),
    };

    if (expense.type === 'debit') {
      updateData.totalDebit = increment(amount);
      updateData[`categoryTotals.${sanitizeKey(expense.category)}`] =
        increment(amount);
      updateData[`merchantTotals.${sanitizeKey(expense.merchant)}`] =
        increment(amount);
    } else {
      updateData.totalCredit = increment(amount);
    }

    await setDoc(summaryRef, updateData, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Monthly Rollup Error]', err);
    return false;
  }
}

/**
 * Reads monthly summary rollup doc for a given monthKey ('YYYY-MM').
 */
export async function getMonthlySummaryRollup(
  userId: string,
  monthKey: string
): Promise<MonthlySummaryDoc | null> {
  if (!db || !userId || !monthKey) return null;
  try {
    const summaryRef = doc(db, `users/${userId}/monthly_summaries`, monthKey);
    const snap = await getDoc(summaryRef);
    if (snap.exists()) {
      return snap.data() as MonthlySummaryDoc;
    }
    return null;
  } catch (err) {
    console.warn('[Get Monthly Rollup Warning]', err);
    return null;
  }
}

/**
 * Loads next page of expenses using Firestore startAfter cursor pagination.
 */
export async function loadExpensesPaged(
  userId: string,
  pageSize: number = 50,
  startAfterDocSnap: QueryDocumentSnapshot<DocumentData> | null = null,
  categoryFilter?: string
): Promise<{
  expenses: Expense[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}> {
  if (!db || !userId) return { expenses: [], lastDoc: null, hasMore: false };

  try {
    let q = query(
      collection(db, `users/${userId}/expenses`),
      orderBy('date', 'desc')
    );

    if (categoryFilter && categoryFilter !== 'ALL') {
      q = query(
        collection(db, `users/${userId}/expenses`),
        orderBy('category'),
        orderBy('date', 'desc')
      );
    }

    if (startAfterDocSnap) {
      q = query(q, startAfter(startAfterDocSnap));
    }

    q = query(q, limit(pageSize));

    const snap = await getDocs(q);
    const docs = snap.docs;
    const hasMore = docs.length === pageSize;
    const lastDoc = docs.length > 0 ? docs[docs.length - 1] : null;

    const expenses: Expense[] = docs.map((d) => ({
      id: d.id,
      schemaVersion: 1,
      ...(d.data() as any),
    }));

    return { expenses, lastDoc, hasMore };
  } catch (err) {
    console.warn('[Load Expenses Paged Warning]', err);
    return { expenses: [], lastDoc: null, hasMore: false };
  }
}

/**
 * Upsert individual Expense in Firestore using a single atomic runTransaction block (Fix 2 & Fix 5).
 * Combines O(1) fingerprint read, expense doc write, fingerprint doc write, and monthly rollup increment().
 * Guarantees zero partial failures and blocks parallel sync races across tabs/sessions.
 */
export async function syncExpenseToFirestore(
  userId: string,
  expense: Expense
): Promise<boolean> {
  if (!userId) return false;

  const fpResult = generateExpenseFingerprintResult(
    expense.merchant,
    expense.amount,
    expense.currency,
    expense.date,
    expense.paymentMethod,
    expense.notes || expense.emailId || expense.id
  );

  const fpHash = expense.fingerprint || fpResult.fingerprint;
  const isWeak = expense.isWeakFingerprint ?? fpResult.isWeakFingerprint;

  const expenseWithVersion: Expense = {
    ...expense,
    fingerprint: fpHash,
    isWeakFingerprint: isWeak,
    schemaVersion: 1,
  };

  const safeId = expenseWithVersion.id.replace(/[^a-zA-Z0-9_-]/g, '_');

  if (!db) {
    await enqueueOutboxItem('CREATE_EXPENSE', safeId, {
      userId,
      expense: expenseWithVersion,
    });
    return false;
  }

  const activeDb = db;

  try {
    const isSuccess = await runTransaction(activeDb, async (transaction) => {
      const fpRef = doc(
        activeDb,
        `users/${userId}/expense_fingerprints`,
        fpHash
      );
      const fpSnap = await transaction.get(fpRef);

      // 1. Atomic Fingerprint Check: Abort if fingerprint doc already exists
      if (fpSnap.exists()) {
        console.info(
          `[Atomic Dedup Transaction] Fingerprint ${fpHash} already exists. Skipping duplicate.`
        );
        return true; // Return true as duplicate is handled safely
      }

      const expenseRef = doc(activeDb, `users/${userId}/expenses`, safeId);
      const monthKey = (
        expenseWithVersion.date || new Date().toISOString()
      ).slice(0, 7);
      const summaryRef = doc(
        activeDb,
        `users/${userId}/monthly_summaries`,
        monthKey
      );

      const sanitizeKey = (key: string) =>
        (key || 'Other').replace(/[^a-zA-Z0-9_-]/g, '_');
      const amount = Math.abs(expenseWithVersion.amount || 0);

      const summaryUpdate: any = {
        monthKey,
        lastUpdated: new Date().toISOString(),
        transactionCount: increment(1),
      };

      if (expenseWithVersion.type === 'debit') {
        summaryUpdate.totalDebit = increment(amount);
        summaryUpdate[
          `categoryTotals.${sanitizeKey(expenseWithVersion.category)}`
        ] = increment(amount);
        summaryUpdate[
          `merchantTotals.${sanitizeKey(expenseWithVersion.merchant)}`
        ] = increment(amount);
      } else {
        summaryUpdate.totalCredit = increment(amount);
      }

      // 2. Execute ALL 3 writes atomically together inside transaction
      transaction.set(expenseRef, {
        ...expenseWithVersion,
        id: safeId,
        userId,
      });

      transaction.set(fpRef, {
        hash: fpHash,
        expenseId: safeId,
        merchant: expenseWithVersion.merchant,
        amount: expenseWithVersion.amount,
        currency: expenseWithVersion.currency,
        date: expenseWithVersion.date,
        isWeakFingerprint: isWeak,
        createdAt: new Date().toISOString(),
      });

      transaction.set(summaryRef, summaryUpdate, { merge: true });

      return true;
    });

    return isSuccess;
  } catch (error) {
    console.warn(
      '[Sync Expense Transaction Error] Queuing outbox fallback:',
      error
    );
    await enqueueOutboxItem('CREATE_EXPENSE', safeId, {
      userId,
      expense: expenseWithVersion,
    });
    return false;
  }
}

/**
 * Delete individual Expense from Firestore with Monthly Rollup update and outbox fallback
 */
export async function deleteExpenseFromFirestore(
  userId: string,
  expenseId: string,
  expenseObj?: Expense
) {
  if (!userId) return;
  const safeId = expenseId.replace(/[^a-zA-Z0-9_-]/g, '_');

  if (!db) {
    await enqueueOutboxItem('DELETE_EXPENSE', safeId, {
      userId,
      expenseId: safeId,
    });
    return;
  }

  try {
    await deleteDoc(doc(db, `users/${userId}/expenses`, safeId));
    if (expenseObj) {
      await updateMonthlySummaryRollup(userId, expenseObj, 'delete');
    }
  } catch (error) {
    console.warn('[Delete Expense Warning] Queuing outbox fallback:', error);
    await enqueueOutboxItem('DELETE_EXPENSE', safeId, {
      userId,
      expenseId: safeId,
    });
  }
}

/**
 * Upsert User Profile
 */
export async function syncProfileToFirestore(
  userId: string,
  profile: UserProfile
) {
  if (!db || !userId) return;
  try {
    await setDoc(
      doc(db, 'users', userId),
      {
        ...profile,
        id: userId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Sync profile warning:', error);
  }
}

/**
 * Sync Budgets
 */
export async function syncBudgetsToFirestore(
  userId: string,
  budgets: BudgetCategory[]
) {
  if (!db || !userId) return;
  for (const b of budgets) {
    const safeId = (
      b.id || `budget_${b.category.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
    ).replace(/[^a-zA-Z0-9_-]/g, '_');
    try {
      await setDoc(doc(db, `users/${userId}/budgets`, safeId), {
        ...b,
        id: safeId,
        userId,
      });
    } catch (error) {
      console.warn('Sync budget warning:', error);
    }
  }
}

/**
 * Sync Bank Accounts
 */
export async function syncAccountsToFirestore(
  userId: string,
  accounts: BankAccount[]
) {
  if (!db || !userId) return;
  for (const acc of accounts) {
    const safeId = acc.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    try {
      await setDoc(doc(db, `users/${userId}/bank_accounts`, safeId), {
        ...acc,
        id: safeId,
        userId,
      });
    } catch (error) {
      console.warn('Sync account warning:', error);
    }
  }
}

/**
 * Sync Rules
 */
export async function syncRulesToFirestore(
  userId: string,
  rules: IngestionRule[]
) {
  if (!db || !userId) return;
  for (const rule of rules) {
    const safeId = rule.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    try {
      await setDoc(doc(db, `users/${userId}/ingestion_rules`, safeId), {
        ...rule,
        id: safeId,
        userId,
      });
    } catch (error) {
      console.warn('Sync rule warning:', error);
    }
  }
}

/**
 * Delete individual Bank Account from Firestore
 */
export async function deleteAccountFromFirestore(
  userId: string,
  accountId: string
) {
  if (!db || !userId) return;
  const safeId = accountId.replace(/[^a-zA-Z0-9_-]/g, '_');
  try {
    await deleteDoc(doc(db, `users/${userId}/bank_accounts`, safeId));
  } catch (error) {
    console.warn('Delete account warning:', error);
  }
}

/**
 * Delete individual Ingestion Rule from Firestore
 */
export async function deleteRuleFromFirestore(userId: string, ruleId: string) {
  if (!db || !userId) return;
  const safeId = ruleId.replace(/[^a-zA-Z0-9_-]/g, '_');
  try {
    await deleteDoc(doc(db, `users/${userId}/ingestion_rules`, safeId));
  } catch (error) {
    console.warn('Delete rule warning:', error);
  }
}

/**
 * Append or upsert single SyncLog to Firestore
 */
export async function syncLogToFirestore(userId: string, log: SyncLog) {
  if (!db || !userId) return;
  const safeId = log.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  try {
    await setDoc(doc(db, `users/${userId}/sync_logs`, safeId), {
      ...log,
      id: safeId,
      userId,
    });
  } catch (error) {
    console.warn('Sync log warning:', error);
  }
}

/**
 * Batch synchronize newly parsed expenses in a single atomic batch
 */
export async function batchSyncExpensesToFirestore(
  userId: string,
  expenses: Expense[]
): Promise<boolean> {
  if (!db || !userId || expenses.length === 0) return false;
  try {
    // Fix Test 18: Intra-batch deduplication before sync
    const seenFingerprints = new Set<string>();
    const uniqueExpenses: Expense[] = [];

    for (const exp of expenses) {
      const fpResult = generateExpenseFingerprintResult(
        exp.merchant || 'Unknown',
        exp.amount || 0,
        exp.currency || 'IDR',
        exp.date || new Date().toISOString().split('T')[0],
        exp.paymentMethod,
        exp.notes || exp.emailId || exp.id
      );
      if (!seenFingerprints.has(fpResult.fingerprint)) {
        seenFingerprints.add(fpResult.fingerprint);
        uniqueExpenses.push(exp);
      }
    }

    const BATCH_SIZE = 10;
    for (let i = 0; i < uniqueExpenses.length; i += BATCH_SIZE) {
      const chunk = uniqueExpenses.slice(i, i + BATCH_SIZE);
      await Promise.all(
        chunk.map((exp) => syncExpenseToFirestore(userId, exp))
      );
    }
    return true;
  } catch (error) {
    console.warn('[Batch Sync Expenses Error]', error);
    return false;
  }
}

/**
 * Real-time subscription to user expenses
 */
export function subscribeToUserExpenses(
  userId: string,
  onUpdate: (expenses: Expense[]) => void,
  limitCount: number = 300
): Unsubscribe | null {
  if (!db || !userId) return null;
  try {
    const expQuery = query(
      collection(db, `users/${userId}/expenses`),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    return onSnapshot(
      expQuery,
      (snapshot) => {
        const expenses: Expense[] = [];
        snapshot.forEach((d) => {
          expenses.push({ id: d.id, ...(d.data() as any) });
        });
        onUpdate(expenses);
      },
      (error) => {
        console.warn('Real-time expenses subscription notice:', error);
      }
    );
  } catch (err) {
    console.warn('Failed to attach expenses listener:', err);
    return null;
  }
}

/**
 * Real-time subscription to user bank accounts
 */
export function subscribeToUserAccounts(
  userId: string,
  onUpdate: (accounts: BankAccount[]) => void
): Unsubscribe | null {
  if (!db || !userId) return null;
  try {
    const accQuery = collection(db, `users/${userId}/bank_accounts`);
    return onSnapshot(
      accQuery,
      (snapshot) => {
        const accounts: BankAccount[] = [];
        snapshot.forEach((d) => {
          accounts.push({ id: d.id, ...(d.data() as any) });
        });
        onUpdate(accounts);
      },
      (error) => {
        console.warn('Real-time accounts subscription notice:', error);
      }
    );
  } catch (err) {
    console.warn('Failed to attach accounts listener:', err);
    return null;
  }
}

/**
 * Fast in-memory Monthly Spending Rollup Calculator for instantaneous analytics & reporting
 */
export function calculateMonthlySpendingSummary(
  expenses: Expense[],
  targetMonthKey: string // format: 'YYYY-MM'
): MonthlySpendingSummary {
  const summary: MonthlySpendingSummary = {
    monthKey: targetMonthKey,
    totalDebit: 0,
    totalCredit: 0,
    transactionCount: 0,
    categoryTotals: {},
    merchantTotals: {},
    lastUpdated: new Date().toISOString(),
  };

  for (const exp of expenses) {
    if (!exp.date.startsWith(targetMonthKey)) continue;

    summary.transactionCount += 1;
    if (exp.type === 'debit') {
      summary.totalDebit += exp.amount;
      summary.categoryTotals[exp.category] =
        (summary.categoryTotals[exp.category] || 0) + exp.amount;
      summary.merchantTotals[exp.merchant] =
        (summary.merchantTotals[exp.merchant] || 0) + exp.amount;
    } else {
      summary.totalCredit += exp.amount;
    }
  }

  return summary;
}

/**
 * Persists a user-approved domain provenance rule to Firestore
 */
export async function syncUserTrustedRuleToFirestore(
  userId: string,
  rule: UserTrustedDomainRule
): Promise<boolean> {
  if (!db || !userId || !rule.domain) return false;
  try {
    const safeId =
      rule.id || `rule_${rule.domain.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    await setDoc(doc(db, `users/${userId}/user_trusted_domain_rules`, safeId), {
      ...rule,
      id: safeId,
      userId,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.warn('Sync user trusted rule error:', error);
    return false;
  }
}

/**
 * Deletes a user-approved domain rule from Firestore
 */
export async function deleteUserTrustedRuleFromFirestore(
  userId: string,
  ruleId: string
): Promise<boolean> {
  if (!db || !userId || !ruleId) return false;
  try {
    await deleteDoc(
      doc(db, `users/${userId}/user_trusted_domain_rules`, ruleId)
    );
    return true;
  } catch (error) {
    console.warn('Delete user trusted rule error:', error);
    return false;
  }
}

/**
 * Batch saves user-approved domain rules to Firestore
 */
export async function batchSyncUserTrustedRulesToFirestore(
  userId: string,
  rules: UserTrustedDomainRule[]
): Promise<boolean> {
  if (!db || !userId || rules.length === 0) return false;
  try {
    const batch = writeBatch(db);
    for (const r of rules) {
      const safeId = r.id || `rule_${r.domain.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      batch.set(doc(db, `users/${userId}/user_trusted_domain_rules`, safeId), {
        ...r,
        id: safeId,
        userId,
        updatedAt: new Date().toISOString(),
      });
    }
    await batch.commit();
    return true;
  } catch (error) {
    console.warn('Batch sync user trusted rules error:', error);
    return false;
  }
}

/**
 * Persists a user-flagged untrusted/blocked domain rule to Firestore
 */
export async function syncUserUntrustedRuleToFirestore(
  userId: string,
  rule: UserUntrustedDomainRule
): Promise<boolean> {
  if (!db || !userId || !rule.domain) return false;
  try {
    const safeId =
      rule.id || `untrusted_${rule.domain.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    await setDoc(
      doc(db, `users/${userId}/user_untrusted_domain_rules`, safeId),
      {
        ...rule,
        id: safeId,
        userId,
        updatedAt: new Date().toISOString(),
      }
    );
    return true;
  } catch (error) {
    console.warn('Sync user untrusted rule error:', error);
    return false;
  }
}

/**
 * Deletes an untrusted domain rule from Firestore (unblocking it)
 */
export async function deleteUserUntrustedRuleFromFirestore(
  userId: string,
  ruleId: string
): Promise<boolean> {
  if (!db || !userId || !ruleId) return false;
  try {
    await deleteDoc(
      doc(db, `users/${userId}/user_untrusted_domain_rules`, ruleId)
    );
    return true;
  } catch (error) {
    console.warn('Delete user untrusted rule error:', error);
    return false;
  }
}

/**
 * Batch saves user-flagged untrusted domain rules to Firestore
 */
export async function batchSyncUserUntrustedRulesToFirestore(
  userId: string,
  rules: UserUntrustedDomainRule[]
): Promise<boolean> {
  if (!db || !userId || rules.length === 0) return false;
  try {
    const batch = writeBatch(db);
    for (const r of rules) {
      const safeId =
        r.id || `untrusted_${r.domain.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      batch.set(
        doc(db, `users/${userId}/user_untrusted_domain_rules`, safeId),
        {
          ...r,
          id: safeId,
          userId,
          updatedAt: new Date().toISOString(),
        }
      );
    }
    await batch.commit();
    return true;
  } catch (error) {
    console.warn('Batch sync user untrusted rules error:', error);
    return false;
  }
}
