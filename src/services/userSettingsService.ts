import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebaseAuth';
import {
  BudgetCategory,
  IngestionRule,
  UserTrustedDomainRule,
  UserUntrustedDomainRule,
} from '../types';
import { sanitizeForFirestore } from './firestoreService';

export interface UserSettingsConfig {
  budgets: BudgetCategory[];
  ingestionRules: IngestionRule[];
  userTrustedRules: UserTrustedDomainRule[];
  userUntrustedRules: UserUntrustedDomainRule[];
  updatedAt: string;
}

export const DEFAULT_USER_SETTINGS_CONFIG: UserSettingsConfig = {
  budgets: [],
  ingestionRules: [],
  userTrustedRules: [],
  userUntrustedRules: [],
  updatedAt: new Date().toISOString(),
};

/**
 * Loads coalesced user settings config from users/{uid}/settings/config.
 * Performs automatic migration from legacy individual subcollections if config doc doesn't exist yet.
 */
export async function loadUserSettingsConfig(
  userId: string
): Promise<UserSettingsConfig> {
  if (!db || !userId) return DEFAULT_USER_SETTINGS_CONFIG;

  try {
    const configDocRef = doc(db, `users/${userId}/settings`, 'config');
    const snap = await getDoc(configDocRef);

    if (snap.exists()) {
      const data = snap.data() as UserSettingsConfig;
      let existingBudgets = Array.isArray(data.budgets) ? data.budgets : [];

      // If budgets array in config is empty, fallback to reading users/{userId}/budgets subcollection
      if (existingBudgets.length === 0) {
        try {
          const budgetsSnap = await getDocs(
            collection(db, `users/${userId}/budgets`)
          );
          if (!budgetsSnap.empty) {
            existingBudgets = budgetsSnap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as any),
            }));
            // Opportunistically backfill config with fetched budgets
            setDoc(
              configDocRef,
              { budgets: existingBudgets, updatedAt: new Date().toISOString() },
              { merge: true }
            ).catch(() => {});
          }
        } catch {
          // Ignore fallback error
        }
      }

      return {
        budgets: existingBudgets,
        ingestionRules: Array.isArray(data.ingestionRules)
          ? data.ingestionRules
          : [],
        userTrustedRules: Array.isArray(data.userTrustedRules)
          ? data.userTrustedRules
          : [],
        userUntrustedRules: Array.isArray(data.userUntrustedRules)
          ? data.userUntrustedRules
          : [],
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    }

    // Legacy Fallback & Automatic Migration (7 queries -> 2 queries transition)
    const [budgetsRes, rulesRes, trustedRes, untrustedRes] =
      await Promise.allSettled([
        getDocs(collection(db, `users/${userId}/budgets`)),
        getDocs(collection(db, `users/${userId}/ingestion_rules`)),
        getDocs(collection(db, `users/${userId}/user_trusted_domain_rules`)),
        getDocs(collection(db, `users/${userId}/user_untrusted_domain_rules`)),
      ]);

    const budgets: BudgetCategory[] = [];
    const ingestionRules: IngestionRule[] = [];
    const userTrustedRules: UserTrustedDomainRule[] = [];
    const userUntrustedRules: UserUntrustedDomainRule[] = [];

    if (budgetsRes.status === 'fulfilled') {
      budgetsRes.value.forEach((d) =>
        budgets.push({ id: d.id, ...(d.data() as any) })
      );
    }
    if (rulesRes.status === 'fulfilled') {
      rulesRes.value.forEach((d) =>
        ingestionRules.push({ id: d.id, ...(d.data() as any) })
      );
    }
    if (trustedRes.status === 'fulfilled') {
      trustedRes.value.forEach((d) =>
        userTrustedRules.push({ id: d.id, ...(d.data() as any) })
      );
    }
    if (untrustedRes.status === 'fulfilled') {
      untrustedRes.value.forEach((d) =>
        userUntrustedRules.push({ id: d.id, ...(d.data() as any) })
      );
    }

    const migratedConfig: UserSettingsConfig = {
      budgets,
      ingestionRules,
      userTrustedRules,
      userUntrustedRules,
      updatedAt: new Date().toISOString(),
    };

    // Save coalesced config document to Firestore
    await setDoc(configDocRef, sanitizeForFirestore(migratedConfig), {
      merge: true,
    });
    return migratedConfig;
  } catch (err) {
    handleFirestoreError(
      err,
      OperationType.GET,
      `users/${userId}/settings/config`
    );
    return DEFAULT_USER_SETTINGS_CONFIG;
  }
}

/**
 * Saves coalesced user settings config to users/{uid}/settings/config.
 */
export async function saveUserSettingsConfig(
  userId: string,
  config: Partial<UserSettingsConfig>
): Promise<boolean> {
  if (!db || !userId) return false;

  try {
    const configDocRef = doc(db, `users/${userId}/settings`, 'config');
    const current = await loadUserSettingsConfig(userId);
    const updatedConfig: UserSettingsConfig = {
      ...current,
      ...config,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(configDocRef, sanitizeForFirestore(updatedConfig), {
      merge: true,
    });
    return true;
  } catch (err) {
    handleFirestoreError(
      err,
      OperationType.WRITE,
      `users/${userId}/settings/config`
    );
    return false;
  }
}
