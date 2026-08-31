import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { db } from './firebaseAuth';
import { Expense } from '../types';
import { generateExpenseFingerprintResult } from './senderProvenance';

/**
 * Migration Service (Fix 3):
 * Scans all existing expense documents in Firestore that lack `schemaVersion` or `fingerprint`,
 * generates disambiguated fingerprints, populates users/{userId}/expense_fingerprints/{hash},
 * and updates expense documents with `schemaVersion: 1` and `fingerprint`.
 */
export async function backfillExpenseFingerprints(userId: string): Promise<{
  migratedCount: number;
  skippedCount: number;
}> {
  if (!db || !userId) return { migratedCount: 0, skippedCount: 0 };

  const storageKey = `app_backfill_completed_${userId}`;
  try {
    if (
      typeof localStorage !== 'undefined' &&
      localStorage.getItem(storageKey) === 'true'
    ) {
      return { migratedCount: 0, skippedCount: 0 };
    }
  } catch (e) {
    console.warn('[Migration Service Storage Notice]', e);
  }

  try {
    const expensesRef = collection(db, `users/${userId}/expenses`);
    const snap = await getDocs(expensesRef);
    if (snap.empty) return { migratedCount: 0, skippedCount: 0 };

    let migratedCount = 0;
    let skippedCount = 0;

    const ops: Array<{
      expenseRef: any;
      expenseData: any;
      fpRef: any;
      fpData: any;
    }> = [];

    for (const d of snap.docs) {
      const data = d.data() as Expense;
      if (data.schemaVersion === 1 && data.fingerprint) {
        skippedCount++;
        continue;
      }

      const fpResult = generateExpenseFingerprintResult(
        data.merchant || 'Unknown',
        data.amount || 0,
        data.currency || 'IDR',
        data.date || new Date().toISOString().split('T')[0],
        data.paymentMethod,
        data.notes || data.emailId || data.id
      );

      const fpHash = data.fingerprint || fpResult.fingerprint;
      const isWeak = data.isWeakFingerprint ?? fpResult.isWeakFingerprint;

      const expenseRef = doc(db, `users/${userId}/expenses`, d.id);
      const fpRef = doc(db, `users/${userId}/expense_fingerprints`, fpHash);

      ops.push({
        expenseRef,
        expenseData: {
          ...data,
          fingerprint: fpHash,
          isWeakFingerprint: isWeak,
          schemaVersion: 1,
        },
        fpRef,
        fpData: {
          hash: fpHash,
          expenseId: d.id,
          merchant: data.merchant || 'Unknown',
          amount: data.amount || 0,
          currency: data.currency || 'IDR',
          date: data.date || new Date().toISOString().split('T')[0],
          isWeakFingerprint: isWeak,
          createdAt: new Date().toISOString(),
        },
      });

      migratedCount++;
    }

    if (ops.length > 0) {
      const BATCH_LIMIT = 200; // 200 ops (400 writes total, under 500 limit)
      for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db);
        const chunk = ops.slice(i, i + BATCH_LIMIT);
        for (const item of chunk) {
          batch.set(item.expenseRef, item.expenseData, { merge: true });
          batch.set(item.fpRef, item.fpData, { merge: true });
        }
        await batch.commit();
      }
      console.info(
        `[Migration Service] Backfill complete for user ${userId}: ${migratedCount} expenses updated to schemaVersion: 1.`
      );
    }

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(storageKey, 'true');
      }
    } catch {}

    return { migratedCount, skippedCount };
  } catch (err) {
    console.warn('[Migration Service Error]', err);
    return { migratedCount: 0, skippedCount: 0 };
  }
}
