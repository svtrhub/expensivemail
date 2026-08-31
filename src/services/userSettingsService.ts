import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebaseAuth';
import {
  BudgetCategory,
  IngestionRule,
  UserTrustedDomainRule,
  UserUntrustedDomainRule,
} from '../types';

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
      return {
        budgets: Array.isArray(data.budgets) ? data.budgets : [],
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
    await setDoc(configDocRef, migratedConfig, { merge: true });
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

    await setDoc(configDocRef, updatedConfig, { merge: true });
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
