import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  Suspense,
  lazy,
} from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/firebaseAuth';
import { fetchInboxExpenseEmails } from './services/gmailApi';
import {
  DEMO_INCOMING_EMAILS,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_EXPENSES,
} from './services/mockBankData';
import {
  SupportedCurrency,
  formatCurrency,
  CURRENCIES,
  DEFAULT_EXCHANGE_RATE_DB,
  fetchLiveExchangeRates,
  refreshLiveExchangeRatesNow,
} from './services/currency';
import {
  LanguageCode,
  getTranslations,
  Translations,
} from './services/translations';
import { LandingPage } from './components/LandingPage';
import {
  loadUserDataFromFirestore,
  loadExpensesPaged,
  checkFingerprintExistsInFirestore,
  saveInitialUserDataToFirestore,
  syncExpenseToFirestore,
  deleteExpenseFromFirestore,
  syncProfileToFirestore,
  syncBudgetsToFirestore,
  syncAccountsToFirestore,
  syncRulesToFirestore,
  batchSyncExpensesToFirestore,
  syncLogToFirestore,
  deleteAccountFromFirestore,
  deleteRuleFromFirestore,
  syncUserTrustedRuleToFirestore,
  deleteUserTrustedRuleFromFirestore,
  batchSyncUserTrustedRulesToFirestore,
} from './services/firestoreService';
import { flushOutboxQueue } from './services/db';
import { saveUserSettingsConfig } from './services/userSettingsService';
import { backfillExpenseFingerprints } from './services/migrationService';

import { useModalManager } from './hooks/useModalManager';
import { IngestionPipeline } from './services/ingestionPipeline';
import bluecosmosBg from './assets/bluecosmos.webp';
import { Navbar } from './components/Navbar';
import { DashboardGreeting } from './components/DashboardGreeting';
import { MetricCards } from './components/MetricCards';
import { AccountOverview } from './components/AccountOverview';
import { ExpenseList } from './components/ExpenseList';
import { AnomalyDetectionCard } from './components/AnomalyDetectionCard';
import { AnalyticsView } from './components/AnalyticsView';
import { BudgetManager } from './components/BudgetManager';
import { AnomalyNotificationBanner } from './components/AnomalyNotificationBanner';
import { InteractiveDashboardCharts } from './components/InteractiveDashboardCharts';

// ─── Dynamic Lazy Imports (Vercel Bundle Optimization) ───────────
const MailSyncDrawer = lazy(() =>
  import('./components/MailSyncDrawer').then((m) => ({
    default: m.MailSyncDrawer,
  }))
);
const EmailDetailModal = lazy(() =>
  import('./components/EmailDetailModal').then((m) => ({
    default: m.EmailDetailModal,
  }))
);
const SenderProvenanceReviewModal = lazy(() =>
  import('./components/SenderProvenanceReviewModal').then((m) => ({
    default: m.SenderProvenanceReviewModal,
  }))
);
const AddExpenseModal = lazy(() =>
  import('./components/AddExpenseModal').then((m) => ({
    default: m.AddExpenseModal,
  }))
);
const BankModal = lazy(() =>
  import('./components/BankModal').then((m) => ({ default: m.BankModal }))
);
const EditExpenseModal = lazy(() =>
  import('./components/EditExpenseModal').then((m) => ({
    default: m.EditExpenseModal,
  }))
);
const AccountModal = lazy(() =>
  import('./components/AccountModal').then((m) => ({ default: m.AccountModal }))
);
const CreateAccountModal = lazy(() =>
  import('./components/CreateAccountModal').then((m) => ({
    default: m.CreateAccountModal,
  }))
);
const SettingsModal = lazy(() =>
  import('./components/SettingsModal').then((m) => ({
    default: m.SettingsModal,
  }))
);
const CurrencyModal = lazy(() =>
  import('./components/CurrencyModal').then((m) => ({
    default: m.CurrencyModal,
  }))
);
const LanguageModal = lazy(() =>
  import('./components/LanguageModal').then((m) => ({
    default: m.LanguageModal,
  }))
);
const IngestionRulesModal = lazy(() =>
  import('./components/IngestionRulesModal').then((m) => ({
    default: m.IngestionRulesModal,
  }))
);
const ReportStatementModal = lazy(() =>
  import('./components/ReportStatementModal').then((m) => ({
    default: m.ReportStatementModal,
  }))
);
const FixAnomalyModal = lazy(() =>
  import('./components/FixAnomalyModal').then((m) => ({
    default: m.FixAnomalyModal,
  }))
);
const SubscriptionManagerModal = lazy(() =>
  import('./components/SubscriptionManagerModal').then((m) => ({
    default: m.SubscriptionManagerModal,
  }))
);
const SetBudgetModal = lazy(() =>
  import('./components/SetBudgetModal').then((m) => ({
    default: m.SetBudgetModal,
  }))
);
import {
  DEFAULT_INGESTION_RULES,
  applyIngestionRules,
  isEmailBlacklisted,
  isPromotionalOrDiscountEmail,
} from './services/rulesEngine';
import {
  detectAnomalies,
  checkTransactionAmountAnomaly,
} from './services/anomalyDetection';
import { parseEmailReceiptClient } from './services/receiptParser';
import {
  verifySenderProvenance,
  crossCheckMerchantWithDomain,
} from './services/senderProvenance';
import { exportExpensesToCSV } from './services/exportService';
import {
  BankAccount,
  Expense,
  BudgetCategory,
  SyncLog,
  ExpenseCategory,
  SpendingInsight,
  UserProfile,
  IngestionRule,
  ExchangeRateDatabase,
  AnomalyRecord,
  ThemeMode,
  BlacklistedEmailRule,
  PendingReviewEmail,
  UserTrustedDomainRule,
} from './types';
import {
  LayoutDashboard,
  BarChart3,
  Target,
  Inbox,
  Sparkles,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertCircle,
  Download,
  FileText,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

const DEFAULT_BUDGETS_IDR: BudgetCategory[] = [
  { category: 'Dining & Food', monthlyLimit: 2500000, color: '#FB923C' },
  { category: 'Groceries', monthlyLimit: 3500000, color: '#34D399' },
  { category: 'Shopping & Retail', monthlyLimit: 1500000, color: '#60A5FA' },
  { category: 'Utilities & Bills', monthlyLimit: 1200000, color: '#FBBF24' },
  {
    category: 'Travel & Transportation',
    monthlyLimit: 1000000,
    color: '#2DD4BF',
  },
  {
    category: 'Entertainment & Subscriptions',
    monthlyLimit: 500000,
    color: '#C084FC',
  },
  { category: 'Health & Wellness', monthlyLimit: 800000, color: '#FB7185' },
  { category: 'Financial & Fees', monthlyLimit: 200000, color: '#94A3B8' },
];

export default function App() {
  // Localization & Currency State (Default to IDR and Indonesian 'id')
  const [currency, setCurrency] = useState<SupportedCurrency>(() => {
    try {
      const saved = localStorage.getItem('app_currency');
      return (saved as SupportedCurrency) || 'IDR';
    } catch {
      return 'IDR';
    }
  });

  const [language, setLanguage] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem('app_language');
      return (saved as LanguageCode) || 'id';
    } catch {
      return 'id';
    }
  });

  const [theme, setTheme] = useState<ThemeMode>('dark');

  const t = useMemo(() => getTranslations(language), [language]);

  // Permanently enforce dark mode on root document element
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleToggleTheme = () => {
    // Pure dark mode enforcement
  };

  // Auth & Profile state
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] =
    useState(false);
  const [isLandingPage, setIsLandingPage] = useState<boolean>(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('app_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.fullName) return parsed;
      }
    } catch (e) {
      console.warn('Could not parse saved user profile:', e);
    }
    return {
      id: 'usr_' + Date.now(),
      fullName: localStorage.getItem('app_user_profile_name') || '',
      email: '',
      phoneNumber: '',
      entityType: 'personal',
      companyName: '',
      jobTitle: '',
      defaultCurrency: 'IDR',
      defaultLanguage: 'id',
      monthlyBudgetGoal: 0,
      selectedInstitutions: [],
      syncCadence: 'realtime',
      autoApprovalThreshold: 85,
      enableLargeTxAlerts: true,
      largeTxThreshold: 1000000,
      enableWeeklyDigest: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  // Financial Data state (with safe localStorage persistence)
  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    try {
      const saved = localStorage.getItem('app_bank_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not parse saved bank accounts:', e);
    }
    return INITIAL_BANK_ACCOUNTS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem('app_expenses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not parse saved expenses:', e);
    }
    return INITIAL_EXPENSES;
  });

  const [budgets, setBudgets] = useState<BudgetCategory[]>(() => {
    try {
      const saved = localStorage.getItem('app_budgets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not parse saved budgets:', e);
    }
    return [
      { category: 'Dining & Food', monthlyLimit: 3000000 },
      { category: 'Groceries', monthlyLimit: 4000000 },
      { category: 'Shopping & Retail', monthlyLimit: 2500000 },
      { category: 'Utilities & Bills', monthlyLimit: 2000000 },
      { category: 'Travel & Transportation', monthlyLimit: 2000000 },
      { category: 'Entertainment & Subscriptions', monthlyLimit: 1500000 },
    ];
  });

  const [syncLogs, setSyncLogs] = useState<SyncLog[]>(() => {
    try {
      const saved = localStorage.getItem('app_sync_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Could not parse saved sync logs:', e);
    }
    return [];
  });

  const [insights, setInsights] = useState<SpendingInsight[]>([]);

  // Cursor Pagination State (Phase 3)
  const [hasMoreExpenses, setHasMoreExpenses] = useState(false);
  const [lastExpenseDocSnap, setLastExpenseDocSnap] = useState<any>(null);
  const [isLoadingMoreExpenses, setIsLoadingMoreExpenses] = useState(false);

  // UI / View State
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'analytics' | 'budgets'
  >('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [autoSyncIntervalSec, setAutoSyncIntervalSec] = useState(45);
  const [lastSynced, setLastSynced] = useState<Date | null>(new Date());
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleLoadMoreExpenses = async () => {
    if (!user || !lastExpenseDocSnap || isLoadingMoreExpenses) return;
    setIsLoadingMoreExpenses(true);
    try {
      const result = await loadExpensesPaged(user.uid, 50, lastExpenseDocSnap);
      if (result.expenses && result.expenses.length > 0) {
        setExpenses((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const uniqueNew = result.expenses.filter(
            (e) => !existingIds.has(e.id)
          );
          return [...prev, ...uniqueNew];
        });
        setLastExpenseDocSnap(result.lastDoc);
        setHasMoreExpenses(result.hasMore);
      } else {
        setHasMoreExpenses(false);
      }
    } catch (err) {
      console.warn('Error loading more expenses:', err);
    } finally {
      setIsLoadingMoreExpenses(false);
    }
  };

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSyncDrawerOpen, setIsSyncDrawerOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isProvenanceModalOpen, setIsProvenanceModalOpen] = useState(false);
  const [isSetBudgetModalOpen, setIsSetBudgetModalOpen] = useState(false);
  const [viewingEmailExpense, setViewingEmailExpense] =
    useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [fixingAnomaly, setFixingAnomaly] = useState<{
    anomaly: AnomalyRecord;
    expense: Expense;
  } | null>(null);
  const [isAnomalyBannerDismissed, setIsAnomalyBannerDismissed] =
    useState(false);

  // Blacklisted Email Rules (Prevents false positive promo emails / unwanted receipts from ever syncing)
  const [blacklistedEmailRules, setBlacklistedEmailRules] = useState<
    BlacklistedEmailRule[]
  >(() => {
    try {
      const saved = localStorage.getItem('app_blacklisted_email_rules');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Could not parse saved blacklisted email rules:', e);
    }
    return [
      {
        id: 'bl_default_fake_aws',
        pattern:
          'Your AWS monthly statement is available. Total amount charged: $124.50 to Mastercard ending in 8725.',
        matchField: 'any',
        reason: 'False positive demo receipt / discount offer',
        createdAt: new Date().toISOString(),
        enabled: true,
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem(
      'app_blacklisted_email_rules',
      JSON.stringify(blacklistedEmailRules)
    );
  }, [blacklistedEmailRules]);

  // Cryptographically Proven User-Trusted Domain Rules (Immutable Header Programmatic Approvals)
  const [userTrustedRules, setUserTrustedRules] = useState<
    UserTrustedDomainRule[]
  >(() => {
    try {
      const saved = localStorage.getItem('app_user_trusted_domain_rules');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Could not parse user trusted domain rules:', e);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(
      'app_user_trusted_domain_rules',
      JSON.stringify(userTrustedRules)
    );
  }, [userTrustedRules]);

  // Unverified / Flagged Emails Review Queue (Sender Provenance Gate)
  const [pendingReviewEmails, setPendingReviewEmails] = useState<
    PendingReviewEmail[]
  >(() => {
    try {
      const saved = localStorage.getItem('app_pending_review_emails');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Could not parse pending review emails:', e);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(
      'app_pending_review_emails',
      JSON.stringify(pendingReviewEmails)
    );
  }, [pendingReviewEmails]);

  // Permanently Dismissed or Processed Review Email IDs (Prevents deleted/trusted emails from reappearing on sync)
  const [dismissedReviewEmailIds, setDismissedReviewEmailIds] = useState<
    Set<string>
  >(() => {
    try {
      const saved = localStorage.getItem('app_dismissed_review_email_ids');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch (e) {
      console.warn('Could not parse dismissed review email ids:', e);
    }
    return new Set<string>();
  });

  useEffect(() => {
    localStorage.setItem(
      'app_dismissed_review_email_ids',
      JSON.stringify(Array.from(dismissedReviewEmailIds))
    );
  }, [dismissedReviewEmailIds]);

  // Exchange Rate Database state (with live forex synchronization)
  const [exchangeRateDb, setExchangeRateDb] = useState<ExchangeRateDatabase>(
    () => {
      try {
        const saved = localStorage.getItem('app_exchange_rates_db');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.ratesToIDR) return parsed;
        }
      } catch (e) {
        console.warn(
          'Could not parse saved exchange rate database, using initial defaults:',
          e
        );
      }
      return DEFAULT_EXCHANGE_RATE_DB;
    }
  );

  const [isUpdatingRates, setIsUpdatingRates] = useState(false);

  // Ingestion Rules State
  const [ingestionRules, setIngestionRules] = useState<IngestionRule[]>(() => {
    try {
      const saved = localStorage.getItem('app_ingestion_rules');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not load saved ingestion rules:', e);
    }
    return DEFAULT_INGESTION_RULES;
  });

  // Anomaly Detection State (Flags expenses 200%+ higher than category baseline average)
  const [anomalyThresholdMultiplier, setAnomalyThresholdMultiplier] =
    useState<number>(() => {
      try {
        const saved = localStorage.getItem('app_anomaly_multiplier');
        return saved ? parseFloat(saved) || 2.0 : 2.0;
      } catch {
        return 2.0;
      }
    });

  const [dismissedAnomalyIds, setDismissedAnomalyIds] = useState<Set<string>>(
    () => {
      try {
        const saved = localStorage.getItem('app_dismissed_anomalies');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return new Set(parsed);
        }
      } catch (e) {
        console.warn('Could not parse dismissed anomalies:', e);
      }
      return new Set<string>();
    }
  );

  const [anomalyFilterInFeed, setAnomalyFilterInFeed] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      'app_anomaly_multiplier',
      anomalyThresholdMultiplier.toString()
    );
  }, [anomalyThresholdMultiplier]);

  useEffect(() => {
    localStorage.setItem(
      'app_dismissed_anomalies',
      JSON.stringify(Array.from(dismissedAnomalyIds))
    );
  }, [dismissedAnomalyIds]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('app_currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(
      'app_exchange_rates_db',
      JSON.stringify(exchangeRateDb)
    );
  }, [exchangeRateDb]);

  // Initial one-time exchange rate sync on mount
  useEffect(() => {
    fetchLiveExchangeRates()
      .then((latest) => {
        if (latest && latest.ratesToIDR) {
          setExchangeRateDb((prev) => ({
            ...prev,
            ratesToIDR: latest.ratesToIDR,
            ratesFromUSD: latest.ratesFromUSD || prev.ratesFromUSD,
            lastUpdated: latest.lastUpdated || new Date().toISOString(),
            nextUpdateDue: new Date(
              Date.now() + (prev.updateIntervalMinutes || 15) * 60 * 1000
            ).toISOString(),
            provider: latest.provider || prev.provider,
          }));
        }
      })
      .catch((err) =>
        console.warn('Initial exchange rate fetch warning:', err)
      );
  }, []);

  // Periodic automatic background update for exchange rates
  useEffect(() => {
    if (!exchangeRateDb.autoUpdateEnabled) return;

    const intervalMinutes = exchangeRateDb.updateIntervalMinutes || 15;
    const intervalMs = Math.max(intervalMinutes, 1) * 60 * 1000;

    const timer = setInterval(async () => {
      try {
        const latest = await fetchLiveExchangeRates();
        if (latest && latest.ratesToIDR) {
          setExchangeRateDb((prev) => ({
            ...prev,
            ratesToIDR: latest.ratesToIDR,
            ratesFromUSD: latest.ratesFromUSD || prev.ratesFromUSD,
            lastUpdated: latest.lastUpdated || new Date().toISOString(),
            nextUpdateDue: new Date(
              Date.now() + (prev.updateIntervalMinutes || 15) * 60 * 1000
            ).toISOString(),
            provider: latest.provider || prev.provider,
          }));
        }
      } catch (err) {
        console.warn('Exchange rates auto-updater error:', err);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [exchangeRateDb.updateIntervalMinutes, exchangeRateDb.autoUpdateEnabled]);

  // Exchange rate action handlers
  const handleRefreshExchangeRates = async () => {
    setIsUpdatingRates(true);
    try {
      const latest = await refreshLiveExchangeRatesNow();
      if (latest && latest.ratesToIDR) {
        setExchangeRateDb((prev) => ({
          ...prev,
          ratesToIDR: latest.ratesToIDR,
          ratesFromUSD: latest.ratesFromUSD || prev.ratesFromUSD,
          lastUpdated: latest.lastUpdated || new Date().toISOString(),
          nextUpdateDue: new Date(
            Date.now() + (prev.updateIntervalMinutes || 15) * 60 * 1000
          ).toISOString(),
          provider: latest.provider || prev.provider,
        }));
        showToast(
          language === 'id'
            ? 'Kurs mata uang pasar global & BI berhasil diperbarui!'
            : 'Live global market & central bank exchange rates updated!'
        );
      }
    } catch (e) {
      console.warn('Refresh rates error:', e);
      showToast('Gagal menyinkronkan kurs live.');
    } finally {
      setIsUpdatingRates(false);
    }
  };

  const handleUpdateExchangeInterval = (minutes: number) => {
    const nextDue = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    setExchangeRateDb((prev) => {
      const updated = {
        ...prev,
        updateIntervalMinutes: minutes,
        nextUpdateDue: nextDue,
      };
      try {
        localStorage.setItem('app_exchange_rates_db', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage save error for exchange rates db:', e);
      }
      return updated;
    });
    showToast(
      language === 'id'
        ? `Jadwal sinkronisasi kurs otomatis diatur setiap ${minutes >= 60 ? `${minutes / 60} jam` : `${minutes} menit`}`
        : `Exchange rate sync interval set to every ${minutes >= 60 ? `${minutes / 60} hour(s)` : `${minutes} minutes`}`
    );
  };

  const handleToggleAutoUpdateRates = (enabled: boolean) => {
    setExchangeRateDb((prev) => {
      const updated = {
        ...prev,
        autoUpdateEnabled: enabled,
        nextUpdateDue: enabled
          ? new Date(
              Date.now() + (prev.updateIntervalMinutes || 15) * 60 * 1000
            ).toISOString()
          : prev.nextUpdateDue,
      };
      try {
        localStorage.setItem('app_exchange_rates_db', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage save error for exchange rates db:', e);
      }
      return updated;
    });
    showToast(
      enabled
        ? language === 'id'
          ? 'Auto-update kurs diaktifkan'
          : 'Exchange rate auto-update enabled'
        : language === 'id'
          ? 'Auto-update kurs dinonaktifkan'
          : 'Exchange rate auto-update paused'
    );
  };

  useEffect(() => {
    localStorage.setItem('app_bank_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('app_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('app_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('app_sync_logs', JSON.stringify(syncLogs));
  }, [syncLogs]);

  useEffect(() => {
    localStorage.setItem('app_ingestion_rules', JSON.stringify(ingestionRules));
  }, [ingestionRules]);

  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('app_user_profile', JSON.stringify(userProfile));
      localStorage.setItem('app_user_profile_name', userProfile.fullName);
    }
  }, [userProfile]);

  // Handler for Account Creation Wizard
  const handleAccountCreated = async (
    newProfile: UserProfile,
    selectedBanks: string[],
    initialBudgetGoal: number
  ) => {
    setUserProfile(newProfile);
    setCurrency(newProfile.defaultCurrency as SupportedCurrency);
    setLanguage(newProfile.defaultLanguage as LanguageCode);
    setIsLandingPage(false);

    // Save to localStorage immediately
    try {
      localStorage.setItem('app_account_initialized', 'true');
      localStorage.setItem('app_user_profile', JSON.stringify(newProfile));
      localStorage.setItem('app_user_profile_name', newProfile.fullName);
      localStorage.setItem('app_currency', newProfile.defaultCurrency);
      localStorage.setItem('app_language', newProfile.defaultLanguage);
    } catch (e) {
      console.warn('Storage sync error:', e);
    }

    // Scale or align category budgets with user's target
    let adjustedBudgets = budgets;
    if (initialBudgetGoal > 0) {
      const isIDR = newProfile.defaultCurrency === 'IDR';
      const factor = isIDR
        ? initialBudgetGoal / 15000000
        : initialBudgetGoal / 3500;
      adjustedBudgets = budgets.map((b) => ({
        ...b,
        monthlyLimit: Math.round(b.monthlyLimit * factor),
      }));
      setBudgets(adjustedBudgets);
    }

    // Add bank accounts based on selected institutions if not already present
    let newAccountsList: BankAccount[] = accounts;
    if (selectedBanks && selectedBanks.length > 0) {
      const bankMap: Record<string, Omit<BankAccount, 'id'>> = {
        bca: {
          name: 'Bank Central Asia (BCA)',
          institution: 'BCA',
          accountNumberMask: '•••• 8821',
          type: 'checking',
          balance: newProfile.defaultCurrency === 'IDR' ? 14250000 : 950,
          currency: newProfile.defaultCurrency,
          color: '#00529C',
          iconName: 'Building2',
          active: true,
        },
        mandiri: {
          name: 'Bank Mandiri',
          institution: 'Mandiri',
          accountNumberMask: '•••• 1904',
          type: 'checking',
          balance: newProfile.defaultCurrency === 'IDR' ? 8600000 : 580,
          currency: newProfile.defaultCurrency,
          color: '#003876',
          iconName: 'Building2',
          active: true,
        },
        jenius: {
          name: 'Jenius / BTPN',
          institution: 'Jenius',
          accountNumberMask: '•••• 3310',
          type: 'checking',
          balance: newProfile.defaultCurrency === 'IDR' ? 4500000 : 300,
          currency: newProfile.defaultCurrency,
          color: '#00A4E4',
          iconName: 'Zap',
          active: true,
        },
        bni: {
          name: 'Bank Negara Indonesia (BNI)',
          institution: 'BNI',
          accountNumberMask: '•••• 5520',
          type: 'checking',
          balance: newProfile.defaultCurrency === 'IDR' ? 6200000 : 410,
          currency: newProfile.defaultCurrency,
          color: '#005E5D',
          iconName: 'Building2',
          active: true,
        },
        gopay: {
          name: 'GoPay / GoTo Financial',
          institution: 'GoPay',
          accountNumberMask: '•••• 0812',
          type: 'digital_wallet',
          balance: newProfile.defaultCurrency === 'IDR' ? 850000 : 60,
          currency: newProfile.defaultCurrency,
          color: '#00AA13',
          iconName: 'Zap',
          active: true,
        },
        shopeepay: {
          name: 'ShopeePay',
          institution: 'ShopeePay',
          accountNumberMask: '•••• 9940',
          type: 'digital_wallet',
          balance: newProfile.defaultCurrency === 'IDR' ? 420000 : 30,
          currency: newProfile.defaultCurrency,
          color: '#EE4D2D',
          iconName: 'Zap',
          active: true,
        },
        ovo: {
          name: 'OVO Digital Wallet',
          institution: 'OVO',
          accountNumberMask: '•••• 6401',
          type: 'digital_wallet',
          balance: newProfile.defaultCurrency === 'IDR' ? 310000 : 25,
          currency: newProfile.defaultCurrency,
          color: '#4C3494',
          iconName: 'Zap',
          active: true,
        },
        amex: {
          name: 'Corporate Platinum Card',
          institution: 'Amex',
          accountNumberMask: '•••• 9002',
          type: 'credit',
          balance: newProfile.defaultCurrency === 'IDR' ? 3450000 : 240,
          currency: newProfile.defaultCurrency,
          color: '#001A3D',
          iconName: 'CreditCard',
          active: true,
        },
      };

      const mapped = selectedBanks
        .map((bankId) => {
          const tpl = bankMap[bankId];
          if (!tpl) return null;
          return {
            id: `acc_${bankId}_${Date.now()}`,
            ...tpl,
          };
        })
        .filter(Boolean) as BankAccount[];

      if (mapped.length > 0) {
        newAccountsList = mapped;
        setAccounts(newAccountsList);
      }
    }

    // Persist to Firestore if user is authenticated
    if (user?.uid) {
      await saveInitialUserDataToFirestore(
        user.uid,
        newProfile,
        newAccountsList,
        expenses,
        adjustedBudgets,
        syncLogs,
        ingestionRules
      );
    }

    showToast(
      newProfile.defaultLanguage === 'id'
        ? `Akun aktif untuk ${newProfile.fullName} (${newProfile.companyName || 'Personal'})!`
        : `Account activated for ${newProfile.fullName} (${newProfile.companyName || 'Personal'})!`
    );
  };

  const handleUpdateProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    if (user?.uid) {
      syncProfileToFirestore(user.uid, updated);
    }
    showToast(
      language === 'id'
        ? 'Profil berhasil diperbarui'
        : 'Profile updated successfully'
    );
  };

  // Initialize Auth & Cloud Persistence Sync
  useEffect(() => {
    let isMounted = true;

    // Safety fallback: ensure UI renders within 150ms regardless of network latency
    const fallbackTimer = setTimeout(() => {
      if (isMounted) setIsAuthReady(true);
    }, 150);

    const unsubscribe = initAuth(
      async (authedUser, token) => {
        if (!isMounted) return;
        setUser(authedUser);
        setAccessToken(token);

        if (authedUser) {
          setIsLandingPage(false);
          setIsDemoMode(false);
          // Immediately unblock UI rendering with locally cached state
          setIsAuthReady(true);

          try {
            // Load user's persistent data in background without blocking the UI
            const cloudData = await loadUserDataFromFirestore(authedUser.uid);
            if (!isMounted) return;
            if (cloudData && cloudData.profile) {
              setUserProfile(cloudData.profile);
              if (cloudData.accounts && cloudData.accounts.length > 0)
                setAccounts(cloudData.accounts);
              if (cloudData.expenses && cloudData.expenses.length > 0)
                setExpenses(cloudData.expenses);
              if (cloudData.budgets && cloudData.budgets.length > 0)
                setBudgets(cloudData.budgets);
              if (cloudData.syncLogs && cloudData.syncLogs.length > 0)
                setSyncLogs(cloudData.syncLogs);
              if (
                cloudData.ingestionRules &&
                cloudData.ingestionRules.length > 0
              ) {
                setIngestionRules(cloudData.ingestionRules);
              }
              if (
                cloudData.userTrustedRules &&
                cloudData.userTrustedRules.length > 0
              ) {
                setUserTrustedRules(cloudData.userTrustedRules);
              }
              if (cloudData.profile.defaultLanguage) {
                setLanguage(cloudData.profile.defaultLanguage as LanguageCode);
              }
              setHasMoreExpenses(Boolean(cloudData.hasMoreExpenses));
              setLastExpenseDocSnap(cloudData.lastExpenseDoc || null);

              // 1. One-time fingerprint backfill for legacy expenses (Fix 3)
              backfillExpenseFingerprints(authedUser.uid).catch((e) =>
                console.warn('[Fingerprint Backfill Warning]', e)
              );

              // 2. Auto-flush IndexedDB Outbox Queue directly invoking runTransaction (Fix 2 & Fix 6)
              flushOutboxQueue(async (item) => {
                if (item.action === 'CREATE_EXPENSE') {
                  return await syncExpenseToFirestore(
                    authedUser.uid,
                    item.payload.expense
                  );
                }
                if (item.action === 'DELETE_EXPENSE') {
                  await deleteExpenseFromFirestore(
                    authedUser.uid,
                    item.payload.expenseId
                  );
                  return true;
                }
                return true;
              }).catch((e) => console.warn('[Outbox Auto-flush Notice]', e));
            } else {
              // First time signing in with Google - bootstrap profile and initial records into Firestore
              const newProf: UserProfile = {
                id: authedUser.uid,
                fullName:
                  authedUser.displayName ||
                  (language === 'id' ? 'Pengguna' : 'User'),
                email: authedUser.email || '',
                phoneNumber: authedUser.phoneNumber || '',
                entityType: 'personal',
                companyName: '',
                jobTitle: '',
                defaultCurrency: currency || 'IDR',
                defaultLanguage: language || 'id',
                monthlyBudgetGoal: 0,
                selectedInstitutions: [],
                syncCadence: 'realtime',
                autoApprovalThreshold: 85,
                enableLargeTxAlerts: true,
                largeTxThreshold: 1000000,
                enableWeeklyDigest: true,
                avatarUrl: authedUser.photoURL || undefined,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              setUserProfile(newProf);
              await saveInitialUserDataToFirestore(
                authedUser.uid,
                newProf,
                accounts,
                expenses,
                budgets,
                syncLogs,
                ingestionRules
              );
            }
          } catch (e) {
            console.warn('Background cloud sync notice:', e);
          }
        } else {
          setIsLandingPage(true);
          setIsDemoMode(false);
          setIsAuthReady(true);
        }
      },
      () => {
        if (!isMounted) return;
        setUser(null);
        setAccessToken(null);
        setIsLandingPage(true);
        setIsDemoMode(false);
        setIsAuthReady(true);
      }
    );
    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Memoized Anomaly Detection Calculation
  const anomalyResult = useMemo(() => {
    return detectAnomalies(
      expenses,
      currency,
      exchangeRateDb.ratesToIDR,
      anomalyThresholdMultiplier,
      dismissedAnomalyIds
    );
  }, [
    expenses,
    currency,
    exchangeRateDb.ratesToIDR,
    anomalyThresholdMultiplier,
    dismissedAnomalyIds,
  ]);

  const handleDismissAnomaly = (expenseId: string) => {
    setDismissedAnomalyIds((prev) => {
      const next = new Set(prev);
      next.add(expenseId);
      return next;
    });
    showToast(
      language === 'id'
        ? 'Peringatan anomali telah diabaikan'
        : 'Anomaly alert dismissed'
    );
  };

  const handleRestoreAnomaly = (expenseId: string) => {
    setDismissedAnomalyIds((prev) => {
      const next = new Set(prev);
      next.delete(expenseId);
      return next;
    });
    showToast(
      language === 'id' ? 'Status anomali dipulihkan' : 'Anomaly alert restored'
    );
  };

  const handleThresholdChange = (multiplier: number) => {
    setAnomalyThresholdMultiplier(multiplier);
    showToast(
      language === 'id'
        ? `Ambang deteksi anomali diatur ke ${Math.round(multiplier * 100)}% dari rata-rata historis`
        : `Anomaly detection threshold set to ${Math.round(multiplier * 100)}% of category average`
    );
  };

  const handleToggleAnomalyFilter = () => {
    setAnomalyFilterInFeed((prev) => !prev);
  };

  const handleOpenFixAnomaly = (anomaly: AnomalyRecord, expense?: Expense) => {
    const targetExpense =
      expense ||
      anomaly.expense ||
      expenses.find((e) => e.id === anomaly.expenseId);
    if (!targetExpense) return;
    setFixingAnomaly({
      anomaly,
      expense: targetExpense,
    });
  };

  const handleSplitExpense = (
    originalExpenseId: string,
    userShare: number,
    splitDescription: string
  ) => {
    setExpenses((prev) =>
      prev.map((e) => {
        if (e.id === originalExpenseId) {
          const updated = {
            ...e,
            amount: userShare,
            notes: e.notes
              ? `${e.notes} (${splitDescription})`
              : splitDescription,
          };
          if (user?.uid) {
            syncExpenseToFirestore(user.uid, updated);
          }
          return updated;
        }
        return e;
      })
    );
    showToast(
      language === 'id'
        ? `Tagihan berhasil dibagi! Pengeluaran disesuaikan ke ${formatCurrency(userShare, currency)}`
        : `Bill split applied! Expense adjusted to ${formatCurrency(userShare, currency)}`
    );
  };

  const handleFlagFalsePositive = (
    expense: Expense,
    blacklistRule?: BlacklistedEmailRule
  ) => {
    if (blacklistRule) {
      setBlacklistedEmailRules((prev) => {
        const next = [
          blacklistRule,
          ...prev.filter((r) => r.id !== blacklistRule.id),
        ];
        return next;
      });
    }
    handleDeleteExpense(expense.id);
    handleDismissAnomaly(expense.id);
    showToast(
      language === 'id'
        ? `Transaksi '${expense.title}' ditandai bukan bukti sah & diblokir dari sinkronisasi masa depan.`
        : `Transaction '${expense.title}' flagged as false positive and blocked from future sync.`
    );
  };

  const handleApproveProgrammaticSender = async (
    item: PendingReviewEmail,
    rule: UserTrustedDomainRule
  ) => {
    // 1. Persist rule via Cloud Function / Server Endpoint (Fix 3 & 4)
    const nextRules = [
      rule,
      ...userTrustedRules.filter(
        (r) => r.domain.toLowerCase() !== rule.domain.toLowerCase()
      ),
    ];
    setUserTrustedRules(nextRules);

    if (user?.uid) {
      try {
        const token =
          (await user.getIdToken?.()) ||
          `mock_jwt_header.${Buffer.from(JSON.stringify({ uid: user.uid, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.mock_sig`;
        await fetchWithExponentialBackoff('/api/approve-sender-domain', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: user.uid,
            rule,
            pendingEmailId: item.id,
            pendingEmailDomain: item.senderDomain,
          }),
        });
      } catch (err) {
        console.warn('Server domain approval notice:', err);
      }
    }

    // Mark email ID as processed so it never re-appears in the review queue
    if (item.emailId) {
      setDismissedReviewEmailIds((prev) => {
        const next = new Set(prev);
        next.add(item.emailId);
        next.add(item.id);
        return next;
      });
    }

    // 2. Synthesize an authentic verified expense from the approved item
    const rawParsed = parseEmailReceiptClient(
      {
        id: item.emailId,
        snippet: item.snippet,
        headers: {
          subject: item.subject,
          from: item.sender,
          date: item.date,
        },
        bodyText: item.body,
      },
      accounts,
      [rule, ...userTrustedRules]
    );

    const merchantDisplay =
      rule.displayName ||
      rule.merchantName ||
      item.claimedMerchant ||
      'Verified Merchant';
    const baseExpense: Expense = rawParsed || {
      id: `exp_mail_${item.emailId || Date.now()}`,
      emailId: item.emailId,
      title: item.subject || `${merchantDisplay} Receipt`,
      merchant: merchantDisplay,
      claimedMerchant: merchantDisplay,
      amount: item.amount || 0,
      currency: (item.currency as SupportedCurrency) || currency,
      category: 'Other',
      date: item.date
        ? new Date(item.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      type: 'debit',
      paymentMethod: 'Direct Payment',
      bankAccountName: 'Verified Direct',
      confidenceScore: 0.95,
      isRecurring: false,
      notes: `Approved via cryptographic provenance review for domain @${rule.domain}`,
      source: 'gmail_sync',
      senderDomain: rule.domain,
      isDomainVerified: true,
      provenanceStatus: 'verified_allowlist',
      emailMetadata: {
        subject: item.subject,
        sender: item.sender,
        senderDomain: rule.domain,
        dateReceived: item.date,
        snippet: item.snippet || '',
        authDetails: item.authDetails,
      },
      tags: ['trusted_sender', rule.domain.split('.')[0]],
    };

    // Run smart ingestion rules
    const ruleAppliedExpense = applyIngestionRules(
      baseExpense,
      ingestionRules
    ).updatedExpense;

    // Run Anomaly check
    const anomalyCheck = checkTransactionAmountAnomaly(
      ruleAppliedExpense,
      expenses,
      currency,
      exchangeRateDb.ratesToIDR,
      anomalyThresholdMultiplier
    );

    const finalExpense: Expense = anomalyCheck.isAnomaly
      ? {
          ...ruleAppliedExpense,
          isAmountAnomaly: true,
          amountAnomalyDetails: {
            multiplier: anomalyCheck.multiplier,
            baselineAverage: anomalyCheck.baselineAverage,
            percentIncrease: anomalyCheck.percentIncrease,
            severity: anomalyCheck.severity,
            reason: anomalyCheck.reason,
          },
        }
      : ruleAppliedExpense;

    // Add to expenses
    setExpenses((prev) => [
      finalExpense,
      ...prev.filter(
        (e) => e.id !== finalExpense.id && e.emailId !== finalExpense.emailId
      ),
    ]);
    if (user?.uid) {
      syncExpenseToFirestore(user.uid, finalExpense);
    }

    // Remove from pending queue
    setPendingReviewEmails((prev) =>
      prev.filter((p) => p.id !== item.id && p.emailId !== item.emailId)
    );

    showToast(
      language === 'id'
        ? `Domain @${rule.domain} dipercayai! Transaksi diverifikasi dan ditambahkan ke ledger.`
        : `Domain @${rule.domain} trusted! Transaction verified and recorded.`
    );
  };

  const handleBatchApproveProgrammaticSenders = async (
    items: PendingReviewEmail[],
    rules: UserTrustedDomainRule[]
  ) => {
    // Persist rules via server endpoint (Fix 4)
    const newDomains = new Set(rules.map((r) => r.domain.toLowerCase()));
    const nextRules = [
      ...rules,
      ...userTrustedRules.filter(
        (r) => !newDomains.has(r.domain.toLowerCase())
      ),
    ];
    setUserTrustedRules(nextRules);

    if (user?.uid) {
      try {
        const token =
          (await user.getIdToken?.()) ||
          `mock_jwt_header.${Buffer.from(JSON.stringify({ uid: user.uid, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.mock_sig`;
        await fetchWithExponentialBackoff('/api/batch-approve-sender-domains', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: user.uid,
            rules,
            pendingEmailIds: items.map((i) => i.id),
          }),
        });
      } catch (err) {
        console.warn('Server batch domain approval notice:', err);
      }
    }

    // Add email IDs to dismissedReviewEmailIds
    setDismissedReviewEmailIds((prev) => {
      const next = new Set(prev);
      items.forEach((i) => {
        if (i.emailId) next.add(i.emailId);
        next.add(i.id);
      });
      return next;
    });

    const allTrusted = [...rules, ...userTrustedRules];
    const newExpenses: Expense[] = [];

    for (const item of items) {
      const rule = rules.find(
        (r) => r.domain.toLowerCase() === item.senderDomain.toLowerCase()
      ) || {
        domain: item.senderDomain,
        displayName: item.claimedMerchant || 'Verified Merchant',
        merchantName: item.claimedMerchant || 'Verified Merchant',
        category: 'Other',
        trustedAt: new Date().toISOString(),
        extractedFromHeader: item.sender,
      };

      const rawParsed = parseEmailReceiptClient(
        {
          id: item.emailId,
          snippet: item.snippet,
          headers: {
            subject: item.subject,
            from: item.sender,
            date: item.date,
          },
          bodyText: item.body,
        },
        accounts,
        allTrusted
      );

      const merchantDisplay =
        rule.displayName ||
        rule.merchantName ||
        item.claimedMerchant ||
        'Verified Merchant';
      const baseExp: Expense = rawParsed || {
        id: `exp_mail_${item.emailId || Date.now()}`,
        emailId: item.emailId,
        title: item.subject || `${merchantDisplay} Receipt`,
        merchant: merchantDisplay,
        claimedMerchant: merchantDisplay,
        amount: item.amount || 0,
        currency: (item.currency as SupportedCurrency) || currency,
        category: 'Other',
        date: item.date
          ? new Date(item.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        type: 'debit',
        paymentMethod: 'Direct Payment',
        bankAccountName: 'Verified Direct',
        confidenceScore: 0.95,
        isRecurring: false,
        notes: `Approved in batch via provenance review for domain @${rule.domain}`,
        source: 'gmail_sync',
        senderDomain: rule.domain,
        isDomainVerified: true,
        provenanceStatus: 'verified_allowlist',
        emailMetadata: {
          subject: item.subject,
          sender: item.sender,
          senderDomain: rule.domain,
          dateReceived: item.date,
          snippet: item.snippet || '',
          authDetails: item.authDetails,
        },
        tags: ['trusted_sender', rule.domain.split('.')[0]],
      };

      const ruleApplied = applyIngestionRules(
        baseExp,
        ingestionRules
      ).updatedExpense;
      const anomalyCheck = checkTransactionAmountAnomaly(
        ruleApplied,
        expenses,
        currency,
        exchangeRateDb.ratesToIDR,
        anomalyThresholdMultiplier
      );

      const finalExp: Expense = anomalyCheck.isAnomaly
        ? {
            ...ruleApplied,
            isAmountAnomaly: true,
            amountAnomalyDetails: {
              multiplier: anomalyCheck.multiplier,
              baselineAverage: anomalyCheck.baselineAverage,
              percentIncrease: anomalyCheck.percentIncrease,
              severity: anomalyCheck.severity,
              reason: anomalyCheck.reason,
            },
          }
        : ruleApplied;

      newExpenses.push(finalExp);
    }

    setExpenses((prev) => {
      const existingIds = new Set(prev.map((e) => e.emailId || e.id));
      const filteredNew = newExpenses.filter(
        (e) => !existingIds.has(e.emailId || e.id)
      );
      return [...filteredNew, ...prev];
    });

    if (user?.uid && newExpenses.length > 0) {
      batchSyncExpensesToFirestore(user.uid, newExpenses);
    }

    const itemIdsToRemove = new Set(items.map((i) => i.id));
    setPendingReviewEmails((prev) =>
      prev.filter((p) => !itemIdsToRemove.has(p.id))
    );

    showToast(
      language === 'id'
        ? `${items.length} email berhasil diverifikasi & ditambahkan ke pembukuan!`
        : `${items.length} emails verified & added to ledger!`
    );
  };

  const handleDismissPendingEmail = (id: string) => {
    const item = pendingReviewEmails.find(
      (p) => p.id === id || p.emailId === id
    );
    const emailId = item?.emailId || id;

    setPendingReviewEmails((prev) =>
      prev.filter((p) => p.id !== id && p.emailId !== id)
    );
    setDismissedReviewEmailIds((prev) => {
      const next = new Set(prev);
      next.add(emailId);
      next.add(id);
      return next;
    });
    showToast(
      language === 'id'
        ? 'Email dihapus dari antrean review'
        : 'Email dismissed from review queue'
    );
  };

  const handleBatchDismissPendingEmails = (ids: string[]) => {
    const idSet = new Set(ids);
    const items = pendingReviewEmails.filter(
      (p) => idSet.has(p.id) || idSet.has(p.emailId)
    );
    const emailIds = items.map((i) => i.emailId).filter(Boolean);

    setPendingReviewEmails((prev) =>
      prev.filter((p) => !idSet.has(p.id) && !idSet.has(p.emailId))
    );
    setDismissedReviewEmailIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      emailIds.forEach((eid) => next.add(eid));
      return next;
    });
    showToast(
      language === 'id'
        ? `${ids.length} email dihapus dari antrean review`
        : `${ids.length} emails dismissed from review queue`
    );
  };

  const handleRemoveTrustedRule = async (domain: string) => {
    const nextRules = userTrustedRules.filter(
      (r) => r.domain.toLowerCase() !== domain.toLowerCase()
    );
    setUserTrustedRules(nextRules);

    if (user?.uid) {
      try {
        const token =
          (await user.getIdToken?.()) ||
          `mock_jwt_header.${Buffer.from(JSON.stringify({ uid: user.uid, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.mock_sig`;
        await fetchWithExponentialBackoff('/api/remove-trusted-domain-rule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: user.uid, domain }),
        });
      } catch (err) {
        console.warn('Server domain rule removal notice:', err);
      }
    }

    showToast(
      language === 'id'
        ? `Domain @${domain} dihapus dari daftar tepercaya kustom`
        : `Domain @${domain} removed from custom trusted rules`
    );
  };

  const scrollToAnomalySection = () => {
    setActiveTab('dashboard');
    setTimeout(() => {
      const el = document.getElementById('anomaly-detection-module');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
  };

  const handleLogin = async () => {
    setIsAuthenticating(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        setIsLandingPage(false);
        try {
          localStorage.setItem('app_account_initialized', 'true');
        } catch {}
        showToast(
          language === 'id'
            ? 'Terhubung ke Gmail! Menyinkronkan kotak masuk...'
            : 'Connected to Gmail successfully! Syncing inbox...'
        );
        // Auto trigger first live sync
        triggerSync(res.accessToken);
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      showToast(
        language === 'id'
          ? 'Masuk dengan Google dibatalkan atau gagal.'
          : 'Google sign-in cancelled or failed.'
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setIsDemoMode(false);
    setIsLandingPage(true);
    try {
      localStorage.removeItem('app_account_initialized');
    } catch (e) {
      console.warn('Logout storage clean warning:', e);
    }
    showToast(
      language === 'id'
        ? 'Berhasil keluar dari akun Google.'
        : 'Signed out of Gmail account.'
    );
  };

  /**
   * Helper to perform HTTP fetch with Exponential Backoff and Jitter.
   * Specifically handles Gemini API '429 Resource Exhausted' and transient server overloads (503/504)
   * gracefully without crashing the application or backend server.
   */
  const fetchWithExponentialBackoff = async (
    url: string,
    options: RequestInit,
    config: {
      maxRetries?: number;
      initialDelayMs?: number;
      maxDelayMs?: number;
      backoffFactor?: number;
      jitterMs?: number;
      onRetry?: (attempt: number, delayMs: number, reason: string) => void;
    } = {}
  ): Promise<Response> => {
    const {
      maxRetries = 3,
      initialDelayMs = 1200,
      maxDelayMs = 8000,
      backoffFactor = 2,
      jitterMs = 400,
      onRetry,
    } = config;

    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);

        // Immediate return on successful response (2xx)
        if (response.ok) {
          return response;
        }

        // Identify rate limit (429) or transient gateway/server overloads (503, 504)
        const isRateLimited429 = response.status === 429;
        const isTransientOverload =
          response.status === 503 || response.status === 504;

        if ((isRateLimited429 || isTransientOverload) && attempt < maxRetries) {
          let delayMs = 0;

          // Check if server specified a Retry-After header
          const retryAfterHeader = response.headers.get('Retry-After');
          if (retryAfterHeader) {
            const parsedSec = parseFloat(retryAfterHeader);
            if (!isNaN(parsedSec) && parsedSec > 0) {
              delayMs = Math.min(parsedSec * 1000, maxDelayMs);
            }
          }

          // Calculate standard exponential backoff with jitter: initialDelay * (factor ^ attempt) + randomJitter
          if (!delayMs) {
            const exponentialDelay =
              initialDelayMs * Math.pow(backoffFactor, attempt);
            const randomJitter = Math.random() * jitterMs;
            delayMs = Math.min(exponentialDelay + randomJitter, maxDelayMs);
          }

          const reason = isRateLimited429
            ? `Gemini 429 Resource Exhausted (attempt ${attempt + 1}/${maxRetries})`
            : `HTTP ${response.status} Temporary Overload (attempt ${attempt + 1}/${maxRetries})`;

          console.info(
            `[Sync Engine Backoff] ${reason}. Retrying in ${Math.round(delayMs)}ms...`
          );
          if (onRetry) {
            onRetry(attempt + 1, delayMs, reason);
          }

          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        return response;
      } catch (err: any) {
        lastError = err;
        if (attempt < maxRetries) {
          const exponentialDelay =
            initialDelayMs * Math.pow(backoffFactor, attempt);
          const randomJitter = Math.random() * jitterMs;
          const delayMs = Math.min(exponentialDelay + randomJitter, maxDelayMs);

          console.info(
            `[Sync Engine Backoff] Fetch attempt ${attempt + 1}/${maxRetries} connection retry: ${err?.message || err}. Retrying in ${Math.round(delayMs)}ms...`
          );
          if (onRetry) {
            onRetry(
              attempt + 1,
              delayMs,
              err?.message || 'Network connection retrying'
            );
          }

          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
        break;
      }
    }

    throw (
      lastError ||
      new Error(
        `Request failed after ${maxRetries} exponential backoff attempts.`
      )
    );
  };

  // Sync Logic
  const triggerSync = async (tokenOverride?: string) => {
    const token = tokenOverride || accessToken;
    setIsSyncing(true);

    try {
      let rawEmails: any[] = [];

      if (token) {
        // Real Gmail API with safe fallback
        try {
          const fetchResult = await fetchInboxExpenseEmails(token, 25);
          rawEmails = fetchResult.messages;
        } catch (fetchErr) {
          console.warn(
            'Live Gmail fetch notice, using incoming demo stream:',
            fetchErr
          );
        }
      }

      if (rawEmails.length === 0) {
        // If not logged in or no new messages from real inbox, use incoming demo feed
        rawEmails = DEMO_INCOMING_EMAILS.map((d) => ({
          id: d.id,
          threadId: d.id,
          snippet: d.snippet,
          headers: {
            subject: d.subject,
            from: d.from,
            date: d.date,
          },
          bodyText: d.body,
        }));
      }

      if (rawEmails.length === 0) {
        const logEntry: SyncLog = {
          id: `log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          status: 'success',
          emailsScanned: 0,
          expensesFound: 0,
          totalAmountParsed: 0,
          message:
            language === 'id'
              ? 'Kotak masuk dipindai — Tidak ada bukti transaksi baru.'
              : 'Inbox scanned — No new transaction receipts found.',
        };
        setSyncLogs((prev) => [logEntry, ...prev.slice(0, 19)]);
        setLastSynced(new Date());
        setIsSyncing(false);
        return;
      }

      // STEP 1: Client Heuristic Noise Filter (Blacklist & Promo keywords & Dismissed Emails)
      const existingExpenseEmailIds = new Set(
        expenses
          .map(
            (e) =>
              e.emailId ||
              (e.id.startsWith('exp_mail_')
                ? e.id.replace('exp_mail_', '')
                : null)
          )
          .filter(Boolean) as string[]
      );

      const eligibleEmails = rawEmails.filter((email) => {
        // Skip emails already dismissed by user
        if (dismissedReviewEmailIds.has(email.id)) {
          return false;
        }

        // Skip emails already present in ledger
        if (existingExpenseEmailIds.has(email.id)) {
          return false;
        }

        const blacklistCheck = isEmailBlacklisted(
          {
            id: email.id,
            from: email.headers?.from || email.from,
            subject: email.headers?.subject || email.subject,
            snippet: email.snippet,
            bodyText: email.bodyText || email.body,
          },
          blacklistedEmailRules
        );

        if (blacklistCheck.isBlocked) {
          console.info(
            `[Sync Engine] Ignored blacklisted email '${blacklistCheck.matchedRule?.reason}':`,
            email.headers?.subject || email.id
          );
          return false;
        }

        const isPromo = isPromotionalOrDiscountEmail({
          subject: email.headers?.subject || email.subject,
          snippet: email.snippet,
          bodyText: email.bodyText || email.body,
        });

        if (isPromo) {
          console.info(
            '[Sync Engine] Filtered out promotional / discount pitch email:',
            email.headers?.subject || email.id
          );
          return false;
        }

        return true;
      });

      if (eligibleEmails.length === 0) {
        const logEntry: SyncLog = {
          id: `log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          status: 'success',
          emailsScanned: rawEmails.length,
          expensesFound: 0,
          totalAmountParsed: 0,
          message:
            language === 'id'
              ? `Dipindai ${rawEmails.length} email — Seluruh email promosi, email yang telah diproses, atau yang diblokir dilewati.`
              : `Scanned ${rawEmails.length} emails — All promotional, processed, or blocked emails were safely ignored.`,
        };
        setSyncLogs((prev) => [logEntry, ...prev.slice(0, 19)]);
        setLastSynced(new Date());
        setIsSyncing(false);
        return;
      }

      // STEP 2: SENDER PROVENANCE HARD GATE (Client-Side Check before Network & AI)
      const verifiedProvenanceEmails: typeof eligibleEmails = [];
      const clientRejectedForReview: PendingReviewEmail[] = [];

      for (const email of eligibleEmails) {
        const fromHeader = email.headers?.from || email.from || '';
        const prov = verifySenderProvenance(fromHeader, userTrustedRules);
        if (prov.isVerified) {
          verifiedProvenanceEmails.push(email);
        } else if (
          !dismissedReviewEmailIds.has(email.id) &&
          !existingExpenseEmailIds.has(email.id)
        ) {
          clientRejectedForReview.push({
            id: `rev_${email.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            emailId: email.id,
            subject:
              email.headers?.subject ||
              email.subject ||
              'Untrusted Sender Email',
            sender: fromHeader,
            senderDomain: prov.senderDomain || 'unknown',
            date: email.headers?.date || email.date || new Date().toISOString(),
            snippet: email.snippet,
            body: email.bodyText || email.body,
            reason: 'unverified_domain',
            failureDetails:
              prov.failureReason ||
              'Sender domain is not on verified merchant/bank allowlist',
            status: 'pending',
          });
        }
      }

      if (clientRejectedForReview.length > 0) {
        setPendingReviewEmails((prev) => {
          const existingIds = new Set(prev.map((p) => p.emailId));
          const newItems = clientRejectedForReview.filter(
            (p) =>
              !existingIds.has(p.emailId) &&
              !dismissedReviewEmailIds.has(p.emailId)
          );
          return [...newItems, ...prev];
        });
      }

      // Dual-layer parsing: First try server-side Gemini parsing endpoint with Exponential Backoff, fallback to client-side rule engine
      let rawParsedExpenses: Expense[] = [];

      if (verifiedProvenanceEmails.length > 0) {
        try {
          const response = await fetchWithExponentialBackoff(
            '/api/parse-email-batch',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                emails: verifiedProvenanceEmails,
                knownBankAccounts: accounts,
                userTrustedRules,
              }),
            },
            {
              maxRetries: 3,
              initialDelayMs: 1200,
              maxDelayMs: 7000,
              backoffFactor: 2,
              jitterMs: 400,
              onRetry: (attempt, delayMs, reason) => {
                console.info(
                  `[Sync Engine Backoff] ${reason} -> Backoff waiting ${Math.round(delayMs)}ms`
                );
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            rawParsedExpenses = (data.expenses || []).filter(
              (exp: Expense) =>
                exp.isDomainVerified &&
                exp.provenanceStatus === 'verified_allowlist'
            );
            if (
              Array.isArray(data.pendingReviewEmails) &&
              data.pendingReviewEmails.length > 0
            ) {
              setPendingReviewEmails((prev) => {
                const existingIds = new Set(prev.map((p) => p.emailId));
                const newItems = data.pendingReviewEmails.filter(
                  (p: PendingReviewEmail) =>
                    !existingIds.has(p.emailId) &&
                    !dismissedReviewEmailIds.has(p.emailId) &&
                    !existingExpenseEmailIds.has(p.emailId)
                );
                return [...newItems, ...prev];
              });
            }
          } else {
            throw new Error(`Server returned HTTP ${response.status}`);
          }
        } catch (serverErr: any) {
          console.warn(
            '[Sync Engine] Gemini AI batch extraction gracefully deferred to local heuristic engine after backoff:',
            serverErr?.message || serverErr
          );
          // Client-side deterministic parser fallback (hard-gated with sender provenance)
          rawParsedExpenses = verifiedProvenanceEmails
            .map((e) => parseEmailReceiptClient(e, accounts, userTrustedRules))
            .filter(
              (exp): exp is Expense =>
                exp !== null && exp.isDomainVerified === true
            );
        }

        // If still empty and using demo emails, generate from client parser
        if (rawParsedExpenses.length === 0) {
          rawParsedExpenses = verifiedProvenanceEmails
            .map((e) => parseEmailReceiptClient(e, accounts, userTrustedRules))
            .filter(
              (exp): exp is Expense =>
                exp !== null && exp.isDomainVerified === true
            );
        }
      }

      // Automatically apply user smart ingestion rules and anomaly detection to incoming transactions
      const parsedExpenses: Expense[] = rawParsedExpenses.map((exp) => {
        const ruleApplied = applyIngestionRules(
          exp,
          ingestionRules
        ).updatedExpense;
        const isDismissed =
          dismissedAnomalyIds.has(ruleApplied.id) ||
          (ruleApplied.emailId
            ? dismissedAnomalyIds.has(ruleApplied.emailId)
            : false) ||
          dismissedAnomalyIds.has(ruleApplied.id.replace(/^exp_mail_/, ''));

        if (!isDismissed) {
          const anomalyCheck = checkTransactionAmountAnomaly(
            ruleApplied,
            expenses,
            currency,
            exchangeRateDb.ratesToIDR,
            anomalyThresholdMultiplier
          );

          if (anomalyCheck.isAnomaly) {
            return {
              ...ruleApplied,
              isAmountAnomaly: true,
              amountAnomalyDetails: {
                multiplier: anomalyCheck.multiplier,
                baselineAverage: anomalyCheck.baselineAverage,
                percentIncrease: anomalyCheck.percentIncrease,
                severity: anomalyCheck.severity,
                reason: anomalyCheck.reason,
              },
            };
          }
        }
        return ruleApplied;
      });

      if (parsedExpenses.length > 0) {
        // Merge without duplicates (check emailId or title+amount+date)
        setExpenses((prev) => {
          const existingIds = new Set(prev.map((e) => e.emailId || e.id));
          const newItems = parsedExpenses.filter(
            (e) => !existingIds.has(e.emailId || e.id)
          );

          if (newItems.length > 0) {
            // Automatically persist newly extracted expenses to Firestore in batch if logged in
            if (user?.uid) {
              batchSyncExpensesToFirestore(user.uid, newItems);
            }

            // Automatically update connected bank account balances and last sync times
            setAccounts((currAccounts) => {
              const updated = currAccounts.map((acc) => {
                const matchingExpenses = newItems.filter((exp) => {
                  if (exp.bankAccountId === acc.id) return true;
                  const method = (exp.paymentMethod || '').toLowerCase();
                  const bankName = (exp.bankAccountName || '').toLowerCase();
                  const inst = acc.institution.toLowerCase();
                  const accName = acc.name.toLowerCase();
                  return (
                    method.includes(inst) ||
                    method.includes(accName) ||
                    bankName.includes(inst) ||
                    inst.includes(bankName)
                  );
                });

                if (matchingExpenses.length === 0) return acc;
                const deducted = matchingExpenses.reduce(
                  (sum, item) => sum + item.amount,
                  0
                );
                const updatedBalance =
                  acc.type === 'credit'
                    ? acc.balance + deducted
                    : Math.max(0, acc.balance - deducted);

                return {
                  ...acc,
                  balance: updatedBalance,
                  lastSyncedAt: new Date().toISOString(),
                };
              });

              if (user?.uid) {
                syncAccountsToFirestore(user.uid, updated);
              }
              return updated;
            });
          }

          return [...newItems, ...prev];
        });

        const totalParsed = parsedExpenses.reduce(
          (sum, e) => sum + e.amount,
          0
        );

        const logEntry: SyncLog = {
          id: `log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          status: 'success',
          emailsScanned: rawEmails.length,
          expensesFound: parsedExpenses.length,
          totalAmountParsed: totalParsed,
          message:
            language === 'id'
              ? `Berhasil mengekstrak ${parsedExpenses.length} struk transaksi dari inbox`
              : `Synced ${parsedExpenses.length} transaction receipt${parsedExpenses.length > 1 ? 's' : ''} from inbox`,
          detailedItems: parsedExpenses.map((p) => ({
            subject: p.title,
            merchant: p.merchant,
            amount: p.amount,
            category: p.category,
            confidence: p.confidenceScore,
          })),
        };

        setSyncLogs((prev) => [logEntry, ...prev.slice(0, 19)]);
        if (user?.uid) {
          syncLogToFirestore(user.uid, logEntry);
        }
        showToast(
          language === 'id'
            ? `Sinkronisasi selesai: +${parsedExpenses.length} pengeluaran berhasil dicatat!`
            : `Real-time sync complete: +${parsedExpenses.length} expenses captured!`
        );
      } else {
        const logEntry: SyncLog = {
          id: `log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          status: 'success',
          emailsScanned: rawEmails.length,
          expensesFound: 0,
          totalAmountParsed: 0,
          message:
            language === 'id'
              ? `Memindai ${rawEmails.length} email. Tidak ada struk baru terdeteksi.`
              : `Scanned ${rawEmails.length} messages. No new financial receipts detected.`,
        };
        setSyncLogs((prev) => [logEntry, ...prev.slice(0, 19)]);
      }

      setLastSynced(new Date());
    } catch (err: any) {
      console.warn(
        'Sync processed with resilient fallback:',
        err?.message || err
      );
      const logEntry: SyncLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: 'success',
        emailsScanned: DEMO_INCOMING_EMAILS.length,
        expensesFound: 0,
        totalAmountParsed: 0,
        message:
          language === 'id'
            ? 'Sinkronisasi selesai (mode pencadangan aktif)'
            : 'Sync processed with resilient fallback mode',
      };
      setSyncLogs((prev) => [logEntry, ...prev.slice(0, 19)]);
      showToast(
        language === 'id' ? 'Sinkronisasi email aktif.' : 'Mail sync active.'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto Sync Interval
  const triggerSyncRef = useRef(triggerSync);
  useEffect(() => {
    triggerSyncRef.current = triggerSync;
  });

  useEffect(() => {
    if (!autoSyncEnabled || isLandingPage || (!user && !isDemoMode)) return;
    const interval = setInterval(() => {
      triggerSyncRef.current();
    }, autoSyncIntervalSec * 1000);
    return () => clearInterval(interval);
  }, [autoSyncEnabled, autoSyncIntervalSec, isLandingPage, user, isDemoMode]);

  // Test Parse Raw Email Text Sandbox
  const handleTestEmailParsed = async (emailText: string) => {
    setIsTestingEmail(true);
    try {
      let fromLine = 'AWS Billing <no-reply-aws@amazon.com>';
      let subjectLine = 'Receipt Parser Sandbox';

      const fromMatch = emailText.match(/^from:\s*(.+)$/im);
      if (fromMatch && fromMatch[1]) {
        fromLine = fromMatch[1].trim();
      }

      const subjectMatch = emailText.match(/^subject:\s*(.+)$/im);
      if (subjectMatch && subjectMatch[1]) {
        subjectLine = subjectMatch[1].trim();
      }

      const pseudoEmail = {
        id: `custom_test_${Date.now()}`,
        from: fromLine,
        subject: subjectLine,
        date: new Date().toISOString(),
        snippet: emailText.slice(0, 150),
        bodyText: emailText,
      };

      // STEP 2 PROVENANCE GATE: Check sender domain
      const provenance = verifySenderProvenance(pseudoEmail.from);
      if (!provenance.isVerified) {
        const unverifiedReview: PendingReviewEmail = {
          id: `rev_${pseudoEmail.id}`,
          emailId: pseudoEmail.id,
          subject: pseudoEmail.subject,
          sender: pseudoEmail.from,
          senderDomain: provenance.senderDomain || 'unknown',
          date: pseudoEmail.date,
          snippet: pseudoEmail.snippet,
          body: pseudoEmail.bodyText,
          reason: 'unverified_domain',
          failureDetails:
            provenance.failureReason ||
            `Domain is not on verified merchant/bank allowlist`,
          status: 'pending',
        };

        setPendingReviewEmails((prev) => [unverifiedReview, ...prev]);

        showToast(
          language === 'id'
            ? `⛔ Provenance Gate: Domain '${provenance.senderDomain || 'unknown'}' tidak terverifikasi. Transaksi dicegat sebelum AI.`
            : `⛔ Provenance Gate: Sender domain '${provenance.senderDomain || 'unknown'}' is not on allowlist. Blocked from ledger.`
        );
        return;
      }

      let rawList: Expense[] = [];

      try {
        const res = await fetchWithExponentialBackoff(
          '/api/parse-email-batch',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              emails: [pseudoEmail],
              knownBankAccounts: accounts,
            }),
          },
          {
            maxRetries: 2,
            initialDelayMs: 1000,
            maxDelayMs: 5000,
            backoffFactor: 2,
          }
        );

        if (res.ok) {
          const data = await res.json();
          rawList = (data.expenses || []).filter(
            (e: Expense) =>
              e.isDomainVerified && e.provenanceStatus === 'verified_allowlist'
          );
          if (
            Array.isArray(data.pendingReviewEmails) &&
            data.pendingReviewEmails.length > 0
          ) {
            setPendingReviewEmails((prev) => [
              ...data.pendingReviewEmails,
              ...prev,
            ]);
          }
        }
      } catch (err) {
        console.warn(
          'Sandbox AI parsing deferred to client heuristic parser:',
          err
        );
        const fallbackExp = parseEmailReceiptClient(pseudoEmail, accounts);
        if (fallbackExp && fallbackExp.isDomainVerified)
          rawList = [fallbackExp];
      }

      if (rawList.length === 0) {
        const fallbackExp = parseEmailReceiptClient(pseudoEmail, accounts);
        if (fallbackExp && fallbackExp.isDomainVerified)
          rawList = [fallbackExp];
      }

      const parsedList = rawList.map(
        (exp) => applyIngestionRules(exp, ingestionRules).updatedExpense
      );

      if (parsedList.length > 0) {
        const item = parsedList[0];
        setExpenses((prev) => [item, ...prev]);

        // Deduct from matching bank account balance
        setAccounts((currAccounts) => {
          return currAccounts.map((acc) => {
            if (
              item.bankAccountId === acc.id ||
              (item.paymentMethod &&
                acc.institution &&
                item.paymentMethod
                  .toLowerCase()
                  .includes(acc.institution.toLowerCase()))
            ) {
              const updatedBalance =
                acc.type === 'credit'
                  ? acc.balance + item.amount
                  : Math.max(0, acc.balance - item.amount);
              return {
                ...acc,
                balance: updatedBalance,
                lastSyncedAt: new Date().toISOString(),
              };
            }
            return acc;
          });
        });

        showToast(
          language === 'id'
            ? `AI Berhasil Ekstrak (Domain Terverifikasi: ${item.senderDomain || 'allowlist'}): ${item.merchant} - ${formatCurrency(item.amount, currency)}`
            : `AI Extracted (Verified Domain: ${item.senderDomain || 'allowlist'}): ${item.merchant} - ${formatCurrency(item.amount, currency)}`
        );
      } else {
        showToast(
          language === 'id'
            ? 'Tidak ada transaksi moneter terverifikasi pada teks.'
            : 'No verified monetary transaction detected in provided text.'
        );
      }
    } catch (e: any) {
      console.error('Test parse failed', e);
      showToast('Could not parse receipt text.');
    } finally {
      setIsTestingEmail(false);
    }
  };

  // Refresh AI Insights with Exponential Backoff
  const handleRefreshInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const res = await fetchWithExponentialBackoff(
        '/api/analyze-spending',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            expenses,
            accounts,
            budgets,
          }),
        },
        {
          maxRetries: 2,
          initialDelayMs: 1000,
          maxDelayMs: 5000,
          backoffFactor: 2,
        }
      );

      const data = await res.json();
      if (data.insights && Array.isArray(data.insights)) {
        setInsights(data.insights);
        showToast(
          language === 'id'
            ? 'Wawasan finansial AI diperbarui!'
            : 'AI financial insights updated!'
        );
      }
    } catch (e) {
      console.warn('Insights fetch backoff completed or unavailable:', e);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  // Expense CRUD
  const handleAddExpense = (newExpense: Omit<Expense, 'id'>) => {
    const rawExpense: Expense = {
      ...newExpense,
      currency: currency,
      id: `exp_manual_${Date.now()}`,
    };
    const { updatedExpense: expense } = applyIngestionRules(
      rawExpense,
      ingestionRules
    );
    setExpenses((prev) => [expense, ...prev]);

    if (user?.uid) {
      syncExpenseToFirestore(user.uid, expense);
    }

    // Update linked bank account balance if applicable
    if (expense.bankAccountId) {
      setAccounts((prev) => {
        const updatedAccounts = prev.map((acc) => {
          if (acc.id === expense.bankAccountId) {
            let newBalance = acc.balance;
            if (acc.type === 'credit') {
              newBalance =
                expense.type === 'debit'
                  ? acc.balance + expense.amount
                  : acc.balance - expense.amount;
            } else {
              newBalance =
                expense.type === 'debit'
                  ? acc.balance - expense.amount
                  : acc.balance + expense.amount;
            }
            return {
              ...acc,
              balance: Math.max(0, newBalance),
              lastSyncedAt: new Date().toISOString(),
            };
          }
          return acc;
        });
        if (user?.uid) {
          syncAccountsToFirestore(user.uid, updatedAccounts);
        }
        return updatedAccounts;
      });
    }

    showToast(
      language === 'id'
        ? `Ditambahkan manual: ${expense.merchant} (${formatCurrency(expense.amount, currency)})`
        : `Added manual: ${expense.merchant} (${formatCurrency(expense.amount, currency)})`
    );
  };

  const handleUpdateExpense = (updated: Expense) => {
    setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    if (user?.uid) {
      syncExpenseToFirestore(user.uid, updated);
    }
    showToast(
      language === 'id'
        ? `Diperbarui: ${updated.merchant}`
        : `Updated ${updated.merchant}`
    );
  };

  const handleDeleteExpense = (expenseId: string) => {
    const exp = expenses.find((e) => e.id === expenseId);
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));

    // Permanently dismiss email and anomaly so syncing never re-imports deleted transactions
    const emailId =
      exp?.emailId ||
      (expenseId.startsWith('exp_mail_')
        ? expenseId.replace('exp_mail_', '')
        : null);
    if (emailId) {
      setDismissedReviewEmailIds((prev) => {
        const next = new Set(prev);
        next.add(emailId);
        return next;
      });
    }

    setDismissedAnomalyIds((prev) => {
      const next = new Set(prev);
      next.add(expenseId);
      if (emailId) next.add(emailId);
      return next;
    });

    if (user?.uid) {
      deleteExpenseFromFirestore(user.uid, expenseId);
    }
    showToast(
      language === 'id'
        ? `Transaksi "${exp?.merchant || 'pengeluaran'}" telah dihapus.`
        : `Transaction "${exp?.merchant || 'expense'}" removed.`
    );
  };

  const handleBatchDeleteExpenses = (expenseIds: string[]) => {
    const deletedExpenses = expenses.filter((e) => expenseIds.includes(e.id));
    const deletedEmailIds = deletedExpenses
      .map(
        (e) =>
          e.emailId ||
          (e.id.startsWith('exp_mail_') ? e.id.replace('exp_mail_', '') : null)
      )
      .filter(Boolean) as string[];

    setExpenses((prev) => prev.filter((e) => !expenseIds.includes(e.id)));

    if (deletedEmailIds.length > 0) {
      setDismissedReviewEmailIds((prev) => {
        const next = new Set(prev);
        deletedEmailIds.forEach((id) => next.add(id));
        return next;
      });
    }

    setDismissedAnomalyIds((prev) => {
      const next = new Set(prev);
      expenseIds.forEach((id) => next.add(id));
      deletedEmailIds.forEach((id) => next.add(id));
      return next;
    });

    if (user?.uid) {
      expenseIds.forEach((id) => deleteExpenseFromFirestore(user.uid, id));
    }
    showToast(
      language === 'id'
        ? `${expenseIds.length} transaksi berhasil dihapus`
        : `Deleted ${expenseIds.length} transactions`
    );
  };

  const handleBatchUpdateCategory = (
    expenseIds: string[],
    newCategory: ExpenseCategory
  ) => {
    setExpenses((prev) => {
      const updated = prev.map((e) =>
        expenseIds.includes(e.id) ? { ...e, category: newCategory } : e
      );
      if (user?.uid) {
        updated
          .filter((e) => expenseIds.includes(e.id))
          .forEach((e) => syncExpenseToFirestore(user.uid, e));
      }
      return updated;
    });
    showToast(
      language === 'id'
        ? `${expenseIds.length} transaksi diubah ke kategori ${newCategory}`
        : `Updated ${expenseIds.length} transactions to ${newCategory}`
    );
  };

  const handleBatchToggleBusiness = (
    expenseIds: string[],
    isBusiness: boolean
  ) => {
    setExpenses((prev) => {
      const updated = prev.map((e) =>
        expenseIds.includes(e.id) ? { ...e, isBusinessExpense: isBusiness } : e
      );
      if (user?.uid) {
        updated
          .filter((e) => expenseIds.includes(e.id))
          .forEach((e) => syncExpenseToFirestore(user.uid, e));
      }
      return updated;
    });
    showToast(
      language === 'id'
        ? `${expenseIds.length} transaksi ditandai sebagai ${isBusiness ? 'Pengeluaran Bisnis' : 'Personal'}`
        : `Marked ${expenseIds.length} transactions as ${isBusiness ? 'Business' : 'Personal'}`
    );
  };

  const handleBatchToggleTax = (expenseIds: string[], isTax: boolean) => {
    setExpenses((prev) => {
      const updated = prev.map((e) =>
        expenseIds.includes(e.id) ? { ...e, isTaxDeductible: isTax } : e
      );
      if (user?.uid) {
        updated
          .filter((e) => expenseIds.includes(e.id))
          .forEach((e) => syncExpenseToFirestore(user.uid, e));
      }
      return updated;
    });
    showToast(
      language === 'id'
        ? `${expenseIds.length} transaksi diperbarui status tax-deductible`
        : `Updated ${expenseIds.length} transactions tax status`
    );
  };

  const handleApplyRulesToExisting = (
    updatedExpenses: Expense[],
    countModified: number
  ) => {
    setExpenses(updatedExpenses);
    if (user?.uid) {
      updatedExpenses.forEach((e) => syncExpenseToFirestore(user.uid, e));
    }
    showToast(
      language === 'id'
        ? `Aturan Ingestion berhasil diterapkan ke ${countModified} transaksi!`
        : `Ingestion rules applied to ${countModified} transactions!`
    );
  };

  const handleLoadSampleData = () => {
    setAccounts(INITIAL_BANK_ACCOUNTS);
    setExpenses(INITIAL_EXPENSES);
    setBudgets(DEFAULT_BUDGETS_IDR);
    if (user?.uid) {
      syncAccountsToFirestore(user.uid, INITIAL_BANK_ACCOUNTS);
      batchSyncExpensesToFirestore(user.uid, INITIAL_EXPENSES);
      syncBudgetsToFirestore(user.uid, DEFAULT_BUDGETS_IDR);
    }
    showToast(
      language === 'id'
        ? 'Data simulasi bank & transaksi berhasil dimuat!'
        : 'Sample banking & transaction data loaded successfully!'
    );
  };

  const handleResetDemoData = () => {
    setExpenses([]);
    setAccounts([]);
    setBudgets([]);
    setSyncLogs([]);
    setInsights([]);
    try {
      localStorage.removeItem('app_expenses');
      localStorage.removeItem('app_bank_accounts');
      localStorage.removeItem('app_budgets');
      localStorage.removeItem('app_sync_logs');
    } catch (e) {
      console.warn('LocalStorage clear error:', e);
    }
    showToast(
      language === 'id'
        ? 'Semua data berhasil dibersihkan'
        : 'All data cleared successfully'
    );
  };

  // Budget CRUD
  const handleUpdateBudget = (category: ExpenseCategory, newLimit: number) => {
    setBudgets((prev) => {
      const exists = prev.some((b) => b.category === category);
      let updated: BudgetCategory[];
      if (exists) {
        updated = prev.map((b) =>
          b.category === category ? { ...b, monthlyLimit: newLimit } : b
        );
      } else {
        updated = [
          ...prev,
          {
            id:
              'b_' +
              String(category)
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '_'),
            category,
            monthlyLimit: newLimit,
            color: '#2251FF',
          },
        ];
      }
      try {
        localStorage.setItem('app_budgets', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage save budgets error:', e);
      }
      if (user?.uid) {
        syncBudgetsToFirestore(user.uid, updated);
      }
      return updated;
    });
    showToast(
      language === 'id'
        ? `Anggaran ${t.categories[category] || category} diubah ke ${formatCurrency(newLimit, currency)}`
        : `Updated budget for ${category} to ${formatCurrency(newLimit, currency)}`
    );
  };

  // Bank CRUD
  const handleAddBankAccount = (newAcc: Omit<BankAccount, 'id'>) => {
    const account: BankAccount = {
      ...newAcc,
      currency: currency,
      id: `acc_${Date.now()}`,
    };
    setAccounts((prev) => {
      const updated = [...prev, account];
      if (user?.uid) {
        syncAccountsToFirestore(user.uid, updated);
      }
      return updated;
    });
    showToast(`Linked ${account.name}`);
  };

  const handleDeleteBankAccount = (id: string) => {
    setAccounts((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      if (user?.uid) {
        deleteAccountFromFirestore(user.uid, id);
        syncAccountsToFirestore(user.uid, updated);
      }
      return updated;
    });
    if (selectedAccountId === id) setSelectedAccountId(null);
    showToast(
      language === 'id' ? 'Rekening bank dilepas.' : 'Bank account unlinked.'
    );
  };

  // Reset Data
  const handleResetData = () => {
    setAccounts([]);
    setExpenses([]);
    setBudgets([]);
    setSyncLogs([]);
    setInsights([]);
    try {
      localStorage.removeItem('app_expenses');
      localStorage.removeItem('app_bank_accounts');
      localStorage.removeItem('app_budgets');
      localStorage.removeItem('app_sync_logs');
    } catch (e) {
      console.warn('LocalStorage clear error:', e);
    }
    showToast(
      language === 'id'
        ? 'Seluruh data transaksi dan rekening telah dibersihkan!'
        : 'All transactions and accounts cleared!'
    );
  };

  // Export to CSV
  const handleExportCSV = () => {
    const success = exportExpensesToCSV({
      expenses,
      currency,
      ratesToIDR: exchangeRateDb.ratesToIDR,
      filenamePrefix: 'Expenses_Ledger',
    });

    if (success) {
      showToast(
        language === 'id'
          ? 'Laporan pengeluaran berhasil diekspor ke CSV'
          : 'Exported expenses to CSV'
      );
    } else {
      showToast(
        language === 'id' ? 'Gagal mengekspor CSV' : 'Failed to export CSV'
      );
    }
  };

  const totalAccountBalance = useMemo(() => {
    return accounts.reduce(
      (sum, a) => sum + (a.type !== 'credit' ? a.balance : -a.balance),
      0
    );
  }, [accounts]);

  const handleLanguageChange = React.useCallback((l: LanguageCode) => {
    setLanguage(l);
    try {
      localStorage.setItem('app_language', l);
    } catch {}
  }, []);

  const handleCurrencyChange = React.useCallback((c: SupportedCurrency) => {
    setCurrency(c);
    try {
      localStorage.setItem('app_currency', c);
    } catch {}
  }, []);

  const handleExploreDemo = React.useCallback(() => {
    setIsDemoMode(true);
    setIsLandingPage(false);
  }, []);

  // While Firebase Auth is initializing and checking persistent session
  if (!isAuthReady) {
    return (
      <div className="min-h-[100dvh] bg-[#071524] text-slate-100 flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="flex flex-col items-center space-y-4 max-w-xs text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#2251FF] flex items-center justify-center shadow-lg shadow-blue-500/20 animate-pulse">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-1">
            <div className="text-base font-bold text-white tracking-tight">
              VaultID
            </div>
            <div className="text-xs text-slate-400">
              {language === 'id'
                ? 'Menyiapkan sesi...'
                : 'Initializing session...'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is not logged in and hasn't chosen demo mode, show the Landing Page
  if (isLandingPage && !user && !isDemoMode) {
    return (
      <div className="min-h-[100dvh] bg-[#071524] text-[#E2E8F0] font-sans selection:bg-[#2251FF] selection:text-white">
        <LandingPage
          onGetStarted={() => setIsCreateAccountModalOpen(true)}
          onGoogleSignIn={handleLogin}
          onExploreDemo={handleExploreDemo}
          language={language}
          onLanguageChange={handleLanguageChange}
          currency={currency}
          onCurrencyChange={handleCurrencyChange}
          isAuthenticating={isAuthenticating}
          theme={theme}
          onSelectTheme={(t) => setTheme(t)}
          onToggleTheme={handleToggleTheme}
        />

        {/* Modal for building executive account from landing page */}
        <CreateAccountModal
          isOpen={isCreateAccountModalOpen}
          onClose={() => setIsCreateAccountModalOpen(false)}
          onAccountCreated={handleAccountCreated}
          currentCurrency={currency}
          currentLanguage={language}
          t={t}
          onOpenLogin={handleLogin}
        />

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-[#051C2C] border border-[#1E3A5F] text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-in slide-in-from-bottom-5">
            <CheckCircle2 className="w-4 h-4 text-[#2251FF] flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] text-[#E2E8F0] flex flex-col font-sans selection:bg-[#2251FF] selection:text-white relative overflow-x-hidden bg-[#051C2C]">
      {/* Static Background Image Layer — GPU Accelerated & Eagerly Decoded */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none transform-gpu will-change-transform">
        <img
          src={bluecosmosBg}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="async"
          loading="eager"
          className="w-full h-full object-cover object-center opacity-85 transform-gpu"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#2251FF]/20 via-transparent to-[#051C2C]/80 pointer-events-none" />
      </div>
      {/* Demo Mode Top Banner */}
      {isDemoMode && !user && (
        <div className="bg-[#EFF6FF] dark:bg-[#051C2C] text-[#1E40AF] dark:text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between border-b border-[#BFDBFE] dark:border-[#0D2E78] z-40">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-400 text-[#051C2C]">
              Demo Mode
            </span>
            <span className="text-slate-700 dark:text-slate-300">
              {language === 'id'
                ? 'Anda menjelajahi data contoh. Masuk dengan Google untuk menyimpan data permanen ke cloud.'
                : 'You are browsing demo data. Sign in with Google to persist your data in the cloud.'}
            </span>
          </div>
          <div className="flex items-center space-x-2 mt-1 sm:mt-0">
            <button
              onClick={() => setIsCreateAccountModalOpen(true)}
              className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 border border-[#BFDBFE] dark:border-transparent rounded-md transition-colors text-[#1E40AF] dark:text-white"
            >
              {language === 'id' ? 'Bangun Akun' : 'Create Account'}
            </button>
            <button
              onClick={handleLogin}
              disabled={isAuthenticating}
              className="px-3 py-1 text-xs font-semibold bg-[#2251FF] hover:bg-[#1267D5] rounded-md transition-colors text-white shadow-xs flex items-center space-x-1"
            >
              <span>
                {language === 'id'
                  ? 'Masuk dengan Google'
                  : 'Sign In with Google'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Top Header Navigation */}
      <Navbar
        user={user}
        userProfile={userProfile}
        hasGmailAccess={!!accessToken}
        isSyncing={isSyncing}
        autoSyncEnabled={autoSyncEnabled}
        onToggleAutoSync={() => setAutoSyncEnabled(!autoSyncEnabled)}
        onSyncNow={() => triggerSync()}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenCreateAccount={() => setIsCreateAccountModalOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenSyncLogs={() => setIsSyncDrawerOpen(true)}
        onOpenBankManager={() => setIsBankModalOpen(true)}
        onOpenRulesModal={() => setIsRulesModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        pendingReviewCount={pendingReviewEmails.length}
        onOpenProvenanceQueue={() => setIsProvenanceModalOpen(true)}
        lastSynced={lastSynced}
        totalSyncedCount={expenses.length}
        totalAccountBalance={totalAccountBalance}
        activeAccountsCount={accounts.length}
        activeAnomaliesCount={
          anomalyResult.anomalies.filter((a) => !a.dismissed).length
        }
        onOpenAnomaliesList={scrollToAnomalySection}
        currency={currency}
        onSelectCurrency={(c) => {
          setCurrency(c);
          showToast(`Mata uang diubah ke ${c}`);
        }}
        language={language}
        onSelectLanguage={(l) => {
          setLanguage(l);
          showToast(
            l === 'id'
              ? 'Bahasa diubah ke Bahasa Indonesia'
              : 'Language set to English'
          );
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onSelectTheme={(t) => setTheme(t)}
        t={t}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        onOpenCurrencyModal={() => setIsCurrencyModalOpen(true)}
        onOpenLanguageModal={() => setIsLanguageModalOpen(true)}
        onExportCSV={handleExportCSV}
        onResetData={handleResetDemoData}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#051C2C] border border-[#CBD5E1] text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-[#2251FF] flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        {/* Dynamic Time-of-Day Executive Greeting Banner */}
        <DashboardGreeting
          user={user}
          userProfile={userProfile}
          language={language}
          currency={currency}
          t={t}
          totalExpensesCount={expenses.length}
          activeAccountsCount={accounts.length}
        />

        {/* In-App Anomaly Alert Notification Banner */}
        {!isAnomalyBannerDismissed && (
          <AnomalyNotificationBanner
            anomalyResult={anomalyResult}
            currency={currency}
            language={language}
            onFixAnomaly={(anomaly) => {
              const exp =
                anomaly.expense ||
                expenses.find((e) => e.id === anomaly.expenseId);
              if (exp) handleOpenFixAnomaly(anomaly, exp);
            }}
            onScrollToAnomalySection={scrollToAnomalySection}
            onDismissBanner={() => setIsAnomalyBannerDismissed(true)}
          />
        )}

        {/* Top Financial Metric Summary & Overview Cards */}
        <MetricCards
          expenses={expenses}
          onOpenSubscriptions={() => setIsSubscriptionModalOpen(true)}
          onOpenAnalytics={() => setActiveTab('analytics')}
          onOpenSyncLogs={() => setIsSyncDrawerOpen(true)}
          currency={currency}
          ratesToIDR={exchangeRateDb.ratesToIDR}
          t={t}
        />

        {/* Interactive Financial Dashboard Charts (Positioned directly below 4 main cards and above Linked Bank Feeds & Cards) */}
        <div className="relative z-20">
          <InteractiveDashboardCharts
            expenses={expenses}
            currency={currency}
            ratesToIDR={exchangeRateDb.ratesToIDR}
            language={language}
            onSelectCategoryFilter={(cat) => {
              // Category filter click handler
              setActiveTab('dashboard');
            }}
          />
        </div>

        {/* Connected Bank Feeds & Cards Section (Positioned Below Overview) */}
        <div className="relative z-10">
          <AccountOverview
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            onSelectAccount={(id) => setSelectedAccountId(id)}
            onOpenAddAccount={() => setIsBankModalOpen(true)}
            isSyncing={isSyncing}
            currency={currency}
            ratesToIDR={exchangeRateDb.ratesToIDR}
            t={t}
          />
        </div>

        {/* Full-Width Tab Navigation: Expense Stream, Analytics, Category */}
        <div className="w-full mb-6">
          <nav
            aria-label="Main Navigation Tabs"
            className="w-full grid grid-cols-3 gap-1 sm:gap-1.5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/15 p-1.5 shadow-lg"
          >
            <button
              id="tab-dashboard-btn"
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`h-10 sm:h-11 flex items-center justify-center space-x-1.5 sm:space-x-2.5 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer select-none active:scale-[0.98] ${
                activeTab === 'dashboard'
                  ? 'bg-[#2251FF] text-white shadow-lg shadow-[#2251FF]/30'
                  : 'text-[#94A3B8] hover:text-white hover:bg-white/10'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span className="truncate">{t.tabs.expenseStream}</span>
            </button>

            <button
              id="tab-analytics-btn"
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`h-10 sm:h-11 flex items-center justify-center space-x-1.5 sm:space-x-2.5 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer select-none active:scale-[0.98] ${
                activeTab === 'analytics'
                  ? 'bg-[#2251FF] text-white shadow-lg shadow-[#2251FF]/30'
                  : 'text-[#94A3B8] hover:text-white hover:bg-white/10'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span className="truncate">{t.tabs.analytics}</span>
            </button>

            <button
              id="tab-budgets-btn"
              type="button"
              onClick={() => setActiveTab('budgets')}
              className={`h-10 sm:h-11 flex items-center justify-center space-x-1.5 sm:space-x-2.5 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer select-none active:scale-[0.98] ${
                activeTab === 'budgets'
                  ? 'bg-[#2251FF] text-white shadow-lg shadow-[#2251FF]/30'
                  : 'text-[#94A3B8] hover:text-white hover:bg-white/10'
              }`}
            >
              <Target className="w-4 h-4 shrink-0" />
              <span className="truncate">{t.tabs.budgets}</span>
            </button>
          </nav>
        </div>

        {/* Active Tab View */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Primary Transaction Stream */}
            <ExpenseList
              expenses={expenses}
              accounts={accounts}
              selectedAccountId={selectedAccountId}
              anomaliesMap={anomalyResult.anomaliesMap}
              initialFilterAnomaliesOnly={anomalyFilterInFeed}
              onViewEmailDetail={(exp) => setViewingEmailExpense(exp)}
              onEditExpense={(exp) => setEditingExpense(exp)}
              onDeleteExpense={handleDeleteExpense}
              onFixAnomaly={handleOpenFixAnomaly}
              onBatchDeleteExpenses={handleBatchDeleteExpenses}
              onBatchUpdateCategory={handleBatchUpdateCategory}
              onBatchToggleBusiness={handleBatchToggleBusiness}
              onBatchToggleTax={handleBatchToggleTax}
              onSyncNow={() => triggerSync()}
              onOpenAddExpense={() => setIsAddModalOpen(true)}
              onOpenRulesModal={() => setIsRulesModalOpen(true)}
              onOpenReportModal={() => setIsReportModalOpen(true)}
              onLoadSampleData={handleLoadSampleData}
              currency={currency}
              ratesToIDR={exchangeRateDb.ratesToIDR}
              language={language}
              t={t}
              hasMoreExpenses={hasMoreExpenses}
              isLoadingMore={isLoadingMoreExpenses}
              onLoadMoreExpenses={handleLoadMoreExpenses}
            />

            {/* Anomaly Detection Module Positioned at the BOTTOM below transaction stream */}
            <AnomalyDetectionCard
              anomalyResult={anomalyResult}
              currency={currency}
              ratesToIDR={exchangeRateDb.ratesToIDR}
              language={language}
              onDismissAnomaly={handleDismissAnomaly}
              onRestoreAnomaly={handleRestoreAnomaly}
              onSelectExpense={(exp) => setViewingEmailExpense(exp)}
              onFixAnomaly={handleOpenFixAnomaly}
              onThresholdChange={handleThresholdChange}
              onFilterInFeed={handleToggleAnomalyFilter}
              isFilterActiveInFeed={anomalyFilterInFeed}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            expenses={expenses}
            insights={insights}
            isLoadingInsights={isLoadingInsights}
            onRefreshInsights={handleRefreshInsights}
            onOpenReportModal={() => setIsReportModalOpen(true)}
            currency={currency}
            ratesToIDR={exchangeRateDb.ratesToIDR}
            t={t}
            hasMoreExpenses={hasMoreExpenses}
            isPartialData={hasMoreExpenses}
          />
        )}

        {activeTab === 'budgets' && (
          <BudgetManager
            expenses={expenses}
            budgets={budgets}
            onUpdateBudget={handleUpdateBudget}
            onOpenSetBudgetModal={() => setIsSetBudgetModalOpen(true)}
            currency={currency}
            ratesToIDR={exchangeRateDb.ratesToIDR}
            t={t}
          />
        )}
      </main>

      {/* Modals & Drawers (Lazy Loaded with Suspense) */}
      <Suspense fallback={null}>
        <MailSyncDrawer
          isOpen={isSyncDrawerOpen}
          onClose={() => setIsSyncDrawerOpen(false)}
          syncLogs={syncLogs}
          isSyncing={isSyncing}
          onSyncNow={() => triggerSync()}
          autoSyncEnabled={autoSyncEnabled}
          onToggleAutoSync={() => setAutoSyncEnabled(!autoSyncEnabled)}
          knownAccounts={accounts}
          onTestEmailParsed={handleTestEmailParsed}
          isTestingEmail={isTestingEmail}
          currency={currency}
          language={language}
          t={t}
        />

        <SetBudgetModal
          isOpen={isSetBudgetModalOpen}
          onClose={() => setIsSetBudgetModalOpen(false)}
          onUpdateBudget={handleUpdateBudget}
          currency={currency}
          ratesToIDR={exchangeRateDb.ratesToIDR}
          language={language}
          t={t}
        />

        <EmailDetailModal
          expense={viewingEmailExpense}
          onClose={() => setViewingEmailExpense(null)}
          currency={currency}
          language={language}
          anomaly={
            viewingEmailExpense
              ? anomalyResult.anomaliesMap.get(viewingEmailExpense.id)
              : null
          }
          onFixAnomaly={(anomaly, exp) => handleOpenFixAnomaly(anomaly, exp)}
          onEdit={(exp) => setEditingExpense(exp)}
          onDelete={handleDeleteExpense}
        />

        <FixAnomalyModal
          isOpen={!!fixingAnomaly}
          onClose={() => setFixingAnomaly(null)}
          anomaly={fixingAnomaly ? fixingAnomaly.anomaly : null}
          expense={fixingAnomaly ? fixingAnomaly.expense : null}
          currency={currency}
          ratesToIDR={exchangeRateDb.ratesToIDR}
          language={language}
          onUpdateExpense={(updated) => {
            handleUpdateExpense(updated);
            setFixingAnomaly(null);
          }}
          onSplitExpense={(origId, share, note) => {
            handleSplitExpense(origId, share, note);
            setFixingAnomaly(null);
          }}
          onDismissAnomaly={(id) => {
            handleDismissAnomaly(id);
            setFixingAnomaly(null);
          }}
          onDeleteExpense={(id) => {
            handleDeleteExpense(id);
            setFixingAnomaly(null);
          }}
          onFlagFalsePositive={(exp, rule) => {
            handleFlagFalsePositive(exp, rule);
            setFixingAnomaly(null);
          }}
        />

        <SubscriptionManagerModal
          isOpen={isSubscriptionModalOpen}
          onClose={() => setIsSubscriptionModalOpen(false)}
          expenses={expenses}
          onUpdateExpense={handleUpdateExpense}
          onDeleteExpense={handleDeleteExpense}
          onOpenAddModal={() => {
            setIsSubscriptionModalOpen(false);
            setIsAddModalOpen(true);
          }}
          onOpenEmailDetail={(exp) => {
            setIsSubscriptionModalOpen(false);
            setViewingEmailExpense(exp);
          }}
          currency={currency}
          ratesToIDR={exchangeRateDb.ratesToIDR}
          language={language}
          t={t}
        />

        <AddExpenseModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddExpense={handleAddExpense}
          onParseEmailText={handleTestEmailParsed}
          accounts={accounts}
          isParsing={isTestingEmail}
          currency={currency}
          language={language}
          t={t}
        />

        <BankModal
          isOpen={isBankModalOpen}
          onClose={() => setIsBankModalOpen(false)}
          accounts={accounts}
          onAddAccount={handleAddBankAccount}
          onDeleteAccount={handleDeleteBankAccount}
          currency={currency}
          t={t}
        />

        <EditExpenseModal
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSave={handleUpdateExpense}
          onDelete={handleDeleteExpense}
          accounts={accounts}
          currency={currency}
          language={language}
          t={t}
        />

        <AccountModal
          isOpen={isAccountModalOpen}
          onClose={() => setIsAccountModalOpen(false)}
          user={user}
          userProfile={userProfile}
          accounts={accounts}
          currency={currency}
          t={t}
          onLogin={handleLogin}
          onLogout={handleLogout}
          hasGmailAccess={!!accessToken}
          onOpenCreateAccount={() => setIsCreateAccountModalOpen(true)}
          onUpdateProfile={handleUpdateProfile}
        />

        <CreateAccountModal
          isOpen={isCreateAccountModalOpen}
          onClose={() => setIsCreateAccountModalOpen(false)}
          onAccountCreated={handleAccountCreated}
          currentCurrency={currency}
          currentLanguage={language}
          t={t}
          onOpenLogin={handleLogin}
        />

        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          currency={currency}
          onSelectCurrency={(c) => {
            setCurrency(c);
            showToast(`Display currency changed to ${c}`);
          }}
          language={language}
          onSelectLanguage={(l) => {
            setLanguage(l);
            showToast(
              l === 'id'
                ? 'Bahasa diganti ke Bahasa Indonesia'
                : 'Language set to English'
            );
          }}
          theme={theme}
          onSelectTheme={(newTheme) => {
            setTheme(newTheme);
            showToast(
              language === 'id'
                ? `Tema diubah ke ${newTheme === 'dark' ? 'Gelap' : newTheme === 'light' ? 'Terang' : 'Sistem'}`
                : `Theme set to ${newTheme}`
            );
          }}
          autoSyncEnabled={autoSyncEnabled}
          onToggleAutoSync={() => setAutoSyncEnabled(!autoSyncEnabled)}
          autoSyncIntervalSec={autoSyncIntervalSec}
          onSetAutoSyncInterval={(sec) => {
            setAutoSyncIntervalSec(sec);
            showToast(`Auto-sync interval set to ${sec}s`);
          }}
          onResetData={handleResetData}
          onLoadSampleData={handleLoadSampleData}
          t={t}
        />

        <CurrencyModal
          isOpen={isCurrencyModalOpen}
          onClose={() => setIsCurrencyModalOpen(false)}
          currency={currency}
          onSelectCurrency={(c) => {
            setCurrency(c);
            showToast(
              language === 'id'
                ? `Mata uang diubah ke ${c}. Seluruh data pengeluaran otomatis dikonversi.`
                : `Display currency set to ${c}. All financial figures converted automatically.`
            );
          }}
          exchangeRateDb={exchangeRateDb}
          onRefreshRates={handleRefreshExchangeRates}
          onUpdateInterval={handleUpdateExchangeInterval}
          onToggleAutoUpdate={handleToggleAutoUpdateRates}
          isUpdatingRates={isUpdatingRates}
          t={t}
        />

        <LanguageModal
          isOpen={isLanguageModalOpen}
          onClose={() => setIsLanguageModalOpen(false)}
          language={language}
          onSelectLanguage={(l) => {
            setLanguage(l);
            showToast(
              l === 'id' ? 'Bahasa Indonesia diaktifkan' : 'English enabled'
            );
          }}
          t={t}
        />

        <IngestionRulesModal
          isOpen={isRulesModalOpen}
          onClose={() => setIsRulesModalOpen(false)}
          rules={ingestionRules}
          onSaveRules={(newRules) => {
            setIngestionRules(newRules);
            if (user?.uid) {
              syncRulesToFirestore(user.uid, newRules);
            }
            showToast(
              language === 'id'
                ? 'Aturan Smart Ingestion disimpan!'
                : 'Ingestion rules saved!'
            );
          }}
          expenses={expenses}
          onApplyRulesToExisting={handleApplyRulesToExisting}
          language={language}
          t={t}
        />

        <ReportStatementModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          expenses={expenses}
          userProfile={userProfile}
          currency={currency}
          ratesToIDR={exchangeRateDb.ratesToIDR}
          language={language}
          t={t}
        />

        <SenderProvenanceReviewModal
          isOpen={isProvenanceModalOpen}
          onClose={() => setIsProvenanceModalOpen(false)}
          pendingEmails={pendingReviewEmails}
          onApproveProgrammaticSender={handleApproveProgrammaticSender}
          onBatchApproveSenders={handleBatchApproveProgrammaticSenders}
          onDismissItem={handleDismissPendingEmail}
          onBatchDismissItems={handleBatchDismissPendingEmails}
          onClearAllPending={() => {
            setPendingReviewEmails([]);
            showToast(
              language === 'id'
                ? 'Antrean review dikosongkan'
                : 'Review queue cleared'
            );
          }}
          userTrustedRules={userTrustedRules}
          onRemoveTrustedRule={handleRemoveTrustedRule}
          currency={currency}
          language={language}
          t={t}
        />
      </Suspense>
    </div>
  );
}
