export type ExpenseCategory =
  | 'Dining & Food'
  | 'Groceries'
  | 'Shopping & Retail'
  | 'Utilities & Bills'
  | 'Travel & Transportation'
  | 'Entertainment & Subscriptions'
  | 'Health & Wellness'
  | 'Financial & Fees'
  | 'Housing & Rent'
  | 'Other';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Dining & Food',
  'Groceries',
  'Shopping & Retail',
  'Utilities & Bills',
  'Travel & Transportation',
  'Entertainment & Subscriptions',
  'Health & Wellness',
  'Financial & Fees',
  'Housing & Rent',
  'Other',
];

export interface BankAccount {
  id: string;
  name: string;
  institution: string; // e.g. 'Chase', 'Bank of America', 'Apple Card', 'PayPal', 'Amex'
  accountNumberMask: string; // e.g. '•••• 4281'
  type: 'checking' | 'credit' | 'savings' | 'digital_wallet';
  balance: number;
  currency: string;
  color: string;
  iconName: string;
  lastSyncedAt?: string;
  active: boolean;
}

export interface ExpenseItem {
  name: string;
  qty?: number;
  price?: number;
}

export interface Expense {
  id: string;
  emailId?: string;
  title: string;
  merchant: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  date: string; // ISO format: YYYY-MM-DD
  time?: string;
  type: 'debit' | 'credit'; // debit = expense, credit = refund/income
  bankAccountId?: string;
  bankAccountName?: string;
  paymentMethod?: string; // e.g., "Visa *4281", "Apple Pay", "PayPal Balance"
  confidenceScore: number; // 0.0 - 1.0 (from AI email extraction)
  isRecurring: boolean;
  recurringFrequency?: 'monthly' | 'yearly' | 'weekly';
  isTaxDeductible?: boolean;
  isBusinessExpense?: boolean;
  notes?: string;
  tags: string[];
  items?: ExpenseItem[];
  taxAmount?: number;
  feeAmount?: number;
  fingerprint?: string;
  source: 'gmail_sync' | 'manual_entry' | 'mock_feed';
  senderDomain?: string;
  isDomainVerified?: boolean;
  claimedMerchant?: string;
  provenanceStatus?: 'verified_allowlist' | 'manual_approved' | 'unverified';
  isAmountAnomaly?: boolean;
  amountAnomalyDetails?: {
    multiplier: number;
    baselineAverage: number;
    percentIncrease: number;
    severity: 'moderate' | 'high' | 'critical';
    reason: string;
  };
  emailMetadata?: {
    subject: string;
    sender: string;
    senderDomain?: string;
    dateReceived: string;
    snippet: string;
    rawSnippet?: string;
    authDetails?: {
      spf?: string;
      dkim?: string;
      dmarc?: string;
      authenticatedDomain?: string;
      isSpoofed?: boolean;
    };
  };
  authenticatedDomain?: string;
  verifiedByUser?: boolean;
  schemaVersion?: number; // Versioning for future migrations (default: 1)
  isWeakFingerprint?: boolean; // Flagged when no per-transaction reference ID or email ID was available
}

export interface ExpenseFingerprintRecord {
  hash: string;
  expenseId: string;
  merchant: string;
  amount: number;
  currency: string;
  date: string;
  isWeakFingerprint?: boolean;
  createdAt: string;
}

export interface MonthlySummaryDoc {
  monthKey: string; // 'YYYY-MM'
  totalDebit: number;
  totalCredit: number;
  transactionCount: number;
  categoryTotals: Record<string, number>;
  merchantTotals: Record<string, number>;
  lastUpdated: string;
}

export interface UserTrustedDomainRule {
  id?: string;
  domain: string;
  displayName: string;
  merchantName?: string;
  category: string;
  trustedAt: string;
  sourceEmailId?: string;
  extractedFromHeader: string;
  isCryptographicallyVerified?: boolean;
}

export interface UserUntrustedDomainRule {
  id?: string;
  domain: string;
  displayName: string;
  senderPattern?: string;
  reason: string;
  blockedAt: string;
  sourceEmailId?: string;
  extractedFromHeader: string;
}

export interface PendingReviewEmail {
  id: string;
  emailId: string;
  subject: string;
  sender: string;
  senderDomain: string;
  date: string;
  snippet: string;
  body?: string;
  reason:
    | 'unverified_domain'
    | 'merchant_domain_mismatch'
    | 'low_confidence_notification'
    | 'spoofed_sender'
    | 'cryptographic_auth_failed'
    | 'homograph_attack'
    | 'amount_anomaly'
    | 'untrusted_domain_blocked';
  failureDetails: string;
  claimedMerchant?: string;
  amount?: number;
  currency?: string;
  status: 'pending' | 'approved' | 'dismissed';
  authDetails?: {
    spf?: string;
    dkim?: string;
    dmarc?: string;
    authenticatedDomain?: string;
    isSpoofed?: boolean;
  };
  homographDetails?: {
    originalDomain: string;
    normalizedDomain: string;
    spoofChars: string[];
  };
  isAmountAnomaly?: boolean;
  anomalyMultiplier?: number;
  historicalAverage?: number;
}

export interface BudgetCategory {
  id?: string;
  category: ExpenseCategory;
  monthlyLimit: number;
  color: string;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  status: 'in_progress' | 'success' | 'failed' | 'idle';
  emailsScanned: number;
  expensesFound: number;
  totalAmountParsed: number;
  message: string;
  detailedItems?: {
    subject: string;
    merchant: string;
    amount: number;
    category: string;
    confidence: number;
  }[];
}

export interface GmailRawMessage {
  id: string;
  threadId: string;
  snippet: string;
  internalDate: string;
  headers: {
    subject?: string;
    from?: string;
    date?: string;
    to?: string;
  };
  bodyText?: string;
}

export interface SpendingInsight {
  type: 'trend' | 'alert' | 'saving_opportunity' | 'recurring';
  title: string;
  description: string;
  amount?: number;
  badge?: string;
}

export type EntityType = 'personal' | 'business' | 'freelance' | 'corporate';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  entityType: EntityType;
  companyName?: string;
  jobTitle?: string;
  defaultCurrency: string; // e.g. 'IDR', 'USD'
  defaultLanguage: 'en' | 'id';
  monthlyBudgetGoal: number;
  selectedInstitutions: string[];
  syncCadence: 'realtime' | 'hourly' | 'daily';
  autoApprovalThreshold: number; // e.g. 85 (%)
  enableLargeTxAlerts: boolean;
  largeTxThreshold: number; // e.g. 1000000
  enableWeeklyDigest: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IngestionRule {
  id: string;
  name: string;
  keyword: string;
  matchField: 'merchant' | 'sender' | 'subject' | 'any';
  assignCategory: ExpenseCategory;
  autoTags: string[];
  isBusinessExpense?: boolean;
  isTaxDeductible?: boolean;
  enabled: boolean;
}

export interface BlacklistedEmailRule {
  id: string;
  pattern: string; // sender email, subject substring, or domain
  matchField: 'sender' | 'subject' | 'any' | 'emailId';
  reason: string; // e.g. "False positive discount / promo", "Never sync this sender"
  createdAt: string;
  enabled: boolean;
}

export interface RecurringSubscriptionSummary {
  merchant: string;
  estimatedMonthlyAmount: number;
  category: ExpenseCategory;
  lastDate: string;
  frequency: string;
  status: 'active' | 'review_needed';
  occurrences: number;
}

export type SupportedCurrency =
  'IDR' | 'USD' | 'EUR' | 'SGD' | 'MYR' | 'JPY' | 'GBP' | 'AUD';

export interface ExchangeRateRecord {
  code: SupportedCurrency;
  rateToIDR: number; // 1 unit in IDR (e.g. 1 USD = 16,250 IDR)
  rateFromUSD: number; // 1 USD in target currency
  symbol: string;
  name: string;
  flag: string;
  change24h?: number;
  lastUpdated: string;
  source: string;
}

export interface ExchangeRateDatabase {
  baseCurrency: SupportedCurrency;
  ratesToIDR: Record<SupportedCurrency, number>;
  ratesFromUSD: Record<SupportedCurrency, number>;
  lastUpdated: string;
  nextUpdateDue: string;
  updateIntervalMinutes: number; // e.g., 5, 15, 60, 360, 1440
  autoUpdateEnabled: boolean;
  provider: string;
  history?: {
    timestamp: string;
    ratesToIDR: Record<SupportedCurrency, number>;
  }[];
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AnomalyRecord {
  expenseId: string;
  expense?: Expense;
  category: ExpenseCategory;
  amount: number;
  convertedAmount: number;
  currency: string;
  categoryAverage: number;
  categoryMedian?: number;
  categoryCount: number;
  multiplier: number; // e.g. 2.5x
  percentageAboveAverage: number; // e.g. 150% higher than average (250% of average)
  severity: 'moderate' | 'high' | 'critical';
  reason: string;
  dismissed?: boolean;
  detectedAt: string;
}

export interface CategoryBaselineStats {
  category: ExpenseCategory;
  count: number;
  totalAmount: number;
  averageAmount: number;
  medianAmount: number;
  maxAmount: number;
  minAmount: number;
  standardDeviation: number;
  anomalyCount: number;
}

export interface AnomalyDetectionResult {
  anomalies: AnomalyRecord[];
  anomaliesMap: Map<string, AnomalyRecord>;
  categoryStats: Record<ExpenseCategory, CategoryBaselineStats>;
  totalAnomalousSpend: number;
  totalAnomaliesCount: number;
  criticalCount: number;
  highCount: number;
  moderateCount: number;
  highestMultiplierRecord: AnomalyRecord | null;
  highestAnomaly: AnomalyRecord | null;
  thresholdMultiplier: number;
  categoryBaselines: Record<ExpenseCategory, CategoryBaselineStats>;
}

export type MECEExpenseCategory =
  | 'Utilities & Bills'
  | 'Entertainment & Subscriptions'
  | 'Housing & Rent'
  | 'Travel & Transportation'
  | 'Dining & Food'
  | 'Other';

export interface AuditStatementCategory {
  name: MECEExpenseCategory;
  count: number;
  amount: string;
  rawAmount: number;
  share: string;
  percentage: number;
}

export interface AuditStatementTransaction {
  date: string;
  merchant: string;
  category: MECEExpenseCategory;
  payment_method: string;
  amount: string;
  rawAmount: number;
  is_reimbursable: boolean;
  is_tax_deductible?: boolean;
}

export interface AuditStatementJSON {
  statement: {
    ref: string;
    date: string;
    title: string;
    subtitle: string;
    status: string;
  };
  account: {
    owner: string;
    email: string;
    period: string;
    scope: string;
    currency: string;
  };
  kpi: {
    total_amount: string;
    raw_total_amount?: number;
    transaction_count: number;
    reimbursable_amount: string;
    raw_reimbursable_amount?: number;
    reimbursable_share: string;
    tax_deductible_amount: string;
    raw_tax_deductible_amount?: number;
    personal_amount: string;
    raw_personal_amount?: number;
    personal_share: string;
  };
  categories_insight: string;
  categories: AuditStatementCategory[];
  transactions: AuditStatementTransaction[];
  audit: {
    auditor: string;
    audit_note: string;
    approver: string;
  };
}
