import {
  Expense,
  IngestionRule,
  ExpenseCategory,
  BlacklistedEmailRule,
} from '../types';

export const DEFAULT_INGESTION_RULES: IngestionRule[] = [
  {
    id: 'rule_tokopedia',
    name: 'Tokopedia E-Commerce',
    keyword: 'tokopedia',
    matchField: 'any',
    assignCategory: 'Shopping & Retail',
    autoTags: ['e-commerce', 'online'],
    isBusinessExpense: false,
    isTaxDeductible: false,
    enabled: true,
  },
  {
    id: 'rule_shopee',
    name: 'Shopee Orders & Pay',
    keyword: 'shopee',
    matchField: 'any',
    assignCategory: 'Shopping & Retail',
    autoTags: ['shopee', 'retail'],
    isBusinessExpense: false,
    isTaxDeductible: false,
    enabled: true,
  },
  {
    id: 'rule_grab_gojek',
    name: 'Grab & Gojek Mobility',
    keyword: 'grab',
    matchField: 'any',
    assignCategory: 'Travel & Transportation',
    autoTags: ['ride-hailing', 'mobility', 'transport'],
    isBusinessExpense: true,
    isTaxDeductible: true,
    enabled: true,
  },
  {
    id: 'rule_gofood',
    name: 'GoFood / GrabFood Delivery',
    keyword: 'gofood',
    matchField: 'any',
    assignCategory: 'Dining & Food',
    autoTags: ['food-delivery', 'meals'],
    isBusinessExpense: false,
    isTaxDeductible: false,
    enabled: true,
  },
  {
    id: 'rule_starbucks',
    name: 'Starbucks Coffee & Cafes',
    keyword: 'starbucks',
    matchField: 'merchant',
    assignCategory: 'Dining & Food',
    autoTags: ['coffee', 'client-meeting'],
    isBusinessExpense: true,
    isTaxDeductible: true,
    enabled: true,
  },
  {
    id: 'rule_aws_cloud',
    name: 'AWS & Cloud Hosting',
    keyword: 'amazon web services',
    matchField: 'any',
    assignCategory: 'Utilities & Bills',
    autoTags: ['infrastructure', 'cloud', 'saas'],
    isBusinessExpense: true,
    isTaxDeductible: true,
    enabled: true,
  },
  {
    id: 'rule_subscriptions',
    name: 'Digital Entertainment (Netflix, Spotify, Apple)',
    keyword: 'netflix',
    matchField: 'any',
    assignCategory: 'Entertainment & Subscriptions',
    autoTags: ['recurring', 'streaming'],
    isBusinessExpense: false,
    isTaxDeductible: false,
    enabled: true,
  },
  {
    id: 'rule_telco',
    name: 'Telkomsel / Indosat Cell Bills',
    keyword: 'telkomsel',
    matchField: 'any',
    assignCategory: 'Utilities & Bills',
    autoTags: ['telecom', 'phone-bill'],
    isBusinessExpense: true,
    isTaxDeductible: true,
    enabled: true,
  },
  {
    id: 'rule_traveloka',
    name: 'Traveloka Flights & Hotels',
    keyword: 'traveloka',
    matchField: 'any',
    assignCategory: 'Travel & Transportation',
    autoTags: ['business-travel', 'lodging'],
    isBusinessExpense: true,
    isTaxDeductible: true,
    enabled: true,
  },
];

export function applyIngestionRules(
  expense: Expense,
  rules: IngestionRule[]
): { updatedExpense: Expense; matchedRule: IngestionRule | null } {
  const activeRules = rules.filter((r) => r.enabled);

  for (const rule of activeRules) {
    const kw = rule.keyword.toLowerCase().trim();
    if (!kw) continue;

    let matched = false;
    const merchant = (expense.merchant || '').toLowerCase();
    const title = (expense.title || '').toLowerCase();
    const sender = (expense.emailMetadata?.sender || '').toLowerCase();
    const subject = (expense.emailMetadata?.subject || '').toLowerCase();
    const snippet = (expense.emailMetadata?.snippet || '').toLowerCase();

    if (rule.matchField === 'merchant') {
      matched = merchant.includes(kw);
    } else if (rule.matchField === 'sender') {
      matched = sender.includes(kw);
    } else if (rule.matchField === 'subject') {
      matched = subject.includes(kw);
    } else {
      // 'any'
      matched =
        merchant.includes(kw) ||
        title.includes(kw) ||
        sender.includes(kw) ||
        subject.includes(kw) ||
        snippet.includes(kw);
    }

    if (matched) {
      const mergedTags = Array.from(
        new Set([...(expense.tags || []), ...rule.autoTags])
      );
      return {
        updatedExpense: {
          ...expense,
          category: rule.assignCategory,
          tags: mergedTags,
          isBusinessExpense:
            rule.isBusinessExpense ?? expense.isBusinessExpense,
          isTaxDeductible: rule.isTaxDeductible ?? expense.isTaxDeductible,
        },
        matchedRule: rule,
      };
    }
  }

  return { updatedExpense: expense, matchedRule: null };
}

export function batchApplyRules(
  expenses: Expense[],
  rules: IngestionRule[]
): { updatedExpenses: Expense[]; countModified: number } {
  let countModified = 0;
  const updatedExpenses = expenses.map((exp) => {
    const { updatedExpense, matchedRule } = applyIngestionRules(exp, rules);
    if (
      matchedRule &&
      (updatedExpense.category !== exp.category ||
        updatedExpense.tags.length !== exp.tags.length)
    ) {
      countModified++;
      return updatedExpense;
    }
    return exp;
  });

  return { updatedExpenses, countModified };
}

/**
 * Checks if an email or transaction is blocked by user-defined blacklist rules.
 */
export function isEmailBlacklisted(
  email: {
    id?: string;
    from?: string;
    sender?: string;
    subject?: string;
    snippet?: string;
    bodyText?: string;
    body?: string;
  },
  blacklistedRules: BlacklistedEmailRule[] = []
): { isBlocked: boolean; matchedRule?: BlacklistedEmailRule } {
  const activeRules = blacklistedRules.filter((r) => r.enabled !== false);
  const emailId = (email.id || '').toLowerCase().trim();
  const sender = (email.from || email.sender || '').toLowerCase().trim();
  const subject = (email.subject || '').toLowerCase().trim();
  const snippet = (email.snippet || '').toLowerCase().trim();
  const body = (email.bodyText || email.body || '').toLowerCase().trim();

  for (const rule of activeRules) {
    const pattern = rule.pattern.toLowerCase().trim();
    if (!pattern) continue;

    let matched = false;
    if (rule.matchField === 'emailId') {
      matched = emailId === pattern || emailId.includes(pattern);
    } else if (rule.matchField === 'sender') {
      matched = sender.includes(pattern);
    } else if (rule.matchField === 'subject') {
      matched = subject.includes(pattern);
    } else {
      // 'any'
      matched =
        emailId.includes(pattern) ||
        sender.includes(pattern) ||
        subject.includes(pattern) ||
        snippet.includes(pattern) ||
        body.includes(pattern);
    }

    if (matched) {
      return { isBlocked: true, matchedRule: rule };
    }
  }

  return { isBlocked: false };
}

/**
 * Heuristically identifies promotional newsletters, advertising offers, and prospective discount pitches.
 */
export function isPromotionalOrDiscountEmail(email: {
  subject?: string;
  snippet?: string;
  bodyText?: string;
  body?: string;
}): boolean {
  const subject = (email.subject || '').toLowerCase();
  const snippet = (email.snippet || '').toLowerCase();
  const text =
    `${subject} ${snippet} ${email.bodyText || email.body || ''}`.toLowerCase();

  // Strong promotional markers
  const promoKeywords = [
    'special discount',
    'promo code',
    'voucher diskon',
    'diskon hingga',
    'up to 50% off',
    'up to 70% off',
    'free credits',
    'get $100 in credits',
    'exclusive offer',
    'penawaran spesial',
    'save up to',
    'newsletter',
    'weekly digest',
    'promosi akhir pekan',
    'flash sale',
    'gunakan kupon',
    'cashback s.d',
    'kupon hemat',
    'promo terbatas',
    'upgrade today to get',
    'start your free trial',
    'coba gratis sekarang',
  ];

  // Strong transaction confirmation markers that indicate a REAL receipt
  const realTransactionMarkers = [
    'tanda terima',
    'resi pembayaran',
    'transaksi berhasil',
    'total amount charged',
    'invoice number',
    'nomor pesanan',
    'nomor ref',
    'payment receipt',
    'order confirmation',
    'total payment',
    'uang keluar',
    'debit edc',
    'qris berhasil',
    'paid in full',
  ];

  const hasRealTransactionMarker = realTransactionMarkers.some((m) =>
    text.includes(m)
  );
  const hasPromoKeyword = promoKeywords.some((k) => text.includes(k));

  // If it has strong promo phrasing and no clear proof of receipt/paid status, classify as promo
  if (hasPromoKeyword && !hasRealTransactionMarker) {
    return true;
  }

  return false;
}
