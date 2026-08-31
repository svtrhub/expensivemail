import {
  Expense,
  ExpenseCategory,
  AnomalyRecord,
  CategoryBaselineStats,
  AnomalyDetectionResult,
  SupportedCurrency,
} from '../types';
import { convertCurrency, formatCurrency } from './currency';

/**
 * Calculates historical category baseline averages and identifies anomalous spending spikes
 * Flagging expenses that are >= 200% of historical category average (or 200% higher, i.e. 2.0x - 3.0x).
 *
 * @param expenses - All expenses in the workspace
 * @param targetCurrency - Current active display currency (e.g. IDR, USD)
 * @param ratesToIDR - Exchange rates map for cross-currency normalization
 * @param thresholdMultiplier - Multiplier threshold for triggering an anomaly (default 2.0 = 200% of category baseline)
 * @param dismissedIds - Set of expense IDs explicitly dismissed/acknowledged by user
 */
export function detectAnomalies(
  expenses: Expense[],
  targetCurrency: SupportedCurrency = 'IDR',
  ratesToIDR: Record<SupportedCurrency, number> = {} as any,
  thresholdMultiplier: number = 2.0,
  dismissedIds: Set<string> = new Set()
): AnomalyDetectionResult {
  const debitExpenses = expenses.filter((e) => e.type !== 'credit');

  // 1. Group expenses by category and calculate initial converted amounts
  const categoryGroups: Record<
    ExpenseCategory,
    { expense: Expense; converted: number }[]
  > = {
    'Dining & Food': [],
    Groceries: [],
    'Shopping & Retail': [],
    'Utilities & Bills': [],
    'Travel & Transportation': [],
    'Entertainment & Subscriptions': [],
    'Health & Wellness': [],
    'Financial & Fees': [],
    'Housing & Rent': [],
    Other: [],
  };

  debitExpenses.forEach((e) => {
    const cat = e.category || 'Other';
    const converted = convertCurrency(
      e.amount,
      (e.currency as SupportedCurrency) || 'IDR',
      targetCurrency,
      ratesToIDR
    );
    if (!categoryGroups[cat]) {
      categoryGroups[cat] = [];
    }
    categoryGroups[cat].push({ expense: e, converted });
  });

  // 2. Compute category baseline statistics
  const categoryStats = {} as Record<ExpenseCategory, CategoryBaselineStats>;

  (Object.keys(categoryGroups) as ExpenseCategory[]).forEach((cat) => {
    const items = categoryGroups[cat];
    const count = items.length;

    if (count === 0) {
      categoryStats[cat] = {
        category: cat,
        count: 0,
        totalAmount: 0,
        averageAmount: 0,
        medianAmount: 0,
        maxAmount: 0,
        minAmount: 0,
        standardDeviation: 0,
        anomalyCount: 0,
      };
      return;
    }

    const values = items.map((i) => i.converted).sort((a, b) => a - b);
    const totalAmount = values.reduce((sum, v) => sum + v, 0);
    const averageAmount = totalAmount / count;
    const medianAmount =
      count % 2 === 0
        ? (values[count / 2 - 1] + values[count / 2]) / 2
        : values[Math.floor(count / 2)];
    const maxAmount = values[values.length - 1];
    const minAmount = values[0];

    // Standard deviation
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - averageAmount, 2), 0) /
      count;
    const standardDeviation = Math.sqrt(variance);

    categoryStats[cat] = {
      category: cat,
      count,
      totalAmount,
      averageAmount,
      medianAmount,
      maxAmount,
      minAmount,
      standardDeviation,
      anomalyCount: 0,
    };
  });

  // Global overall baseline average for categories with very few data points (< 2)
  const allConvertedValues = debitExpenses.map((e) =>
    convertCurrency(
      e.amount,
      (e.currency as SupportedCurrency) || 'IDR',
      targetCurrency,
      ratesToIDR
    )
  );
  const globalAverage =
    allConvertedValues.length > 0
      ? allConvertedValues.reduce((sum, v) => sum + v, 0) /
        allConvertedValues.length
      : 100000;

  // 3. Detect anomalies for each individual transaction
  const anomalies: AnomalyRecord[] = [];
  const anomaliesMap = new Map<string, AnomalyRecord>();

  debitExpenses.forEach((exp) => {
    const cat = exp.category || 'Other';
    const items = categoryGroups[cat] || [];
    const converted = convertCurrency(
      exp.amount,
      (exp.currency as SupportedCurrency) || 'IDR',
      targetCurrency,
      ratesToIDR
    );

    // Calculate baseline historical average for this category EXCLUDING the current transaction
    // This statistical technique prevents an extreme single transaction from inflating the average and concealing itself.
    let baselineAvg = categoryStats[cat]?.averageAmount || globalAverage;
    let baselineCount = items.length;

    if (items.length > 1) {
      const otherItems = items.filter((i) => i.expense.id !== exp.id);
      const otherTotal = otherItems.reduce((sum, i) => sum + i.converted, 0);
      baselineAvg = otherTotal / otherItems.length;
      baselineCount = otherItems.length;
    } else if (items.length === 1) {
      // Single transaction in this category: compare with global average if significantly lower
      baselineAvg = Math.min(baselineAvg, globalAverage);
    }

    if (baselineAvg <= 0) {
      baselineAvg = 1;
    }

    const multiplier = converted / baselineAvg;
    const percentageAboveAverage =
      ((converted - baselineAvg) / baselineAvg) * 100;

    // Check if it surpasses the anomaly threshold (e.g. >= 2.0x / 200% of category baseline)
    if (multiplier >= thresholdMultiplier && converted > 5000) {
      let severity: 'moderate' | 'high' | 'critical' = 'moderate';
      if (multiplier >= 4.0) {
        severity = 'critical';
      } else if (multiplier >= 2.5) {
        severity = 'high';
      }

      const formattedConverted = formatCurrency(converted, targetCurrency);
      const formattedAvg = formatCurrency(baselineAvg, targetCurrency);
      const percentStr = `${Math.round(percentageAboveAverage)}%`;

      const reason = `Nominal ${formattedConverted} lebih tinggi +${percentStr} (${multiplier.toFixed(
        1
      )}x) dibanding rata-rata kategori ${cat} (${formattedAvg}).`;

      const isDismissed =
        dismissedIds.has(exp.id) ||
        (exp.emailId ? dismissedIds.has(exp.emailId) : false) ||
        (exp.id.startsWith('exp_mail_')
          ? dismissedIds.has(exp.id.replace(/^exp_mail_/, ''))
          : false);

      const record: AnomalyRecord = {
        expenseId: exp.id,
        expense: exp,
        category: cat,
        amount: exp.amount,
        convertedAmount: converted,
        currency: exp.currency || targetCurrency,
        categoryAverage: baselineAvg,
        categoryMedian: categoryStats[cat]?.medianAmount,
        categoryCount: baselineCount,
        multiplier: Math.round(multiplier * 100) / 100,
        percentageAboveAverage: Math.round(percentageAboveAverage),
        severity,
        reason,
        dismissed: isDismissed,
        detectedAt: new Date().toISOString(),
      };

      anomalies.push(record);
      anomaliesMap.set(exp.id, record);

      if (categoryStats[cat]) {
        categoryStats[cat].anomalyCount += 1;
      }
    }
  });

  // Sort anomalies by highest multiplier descending
  anomalies.sort((a, b) => b.multiplier - a.multiplier);

  const activeAnomalies = anomalies.filter((a) => !a.dismissed);
  const totalAnomalousSpend = activeAnomalies.reduce(
    (sum, a) => sum + a.convertedAmount,
    0
  );
  const criticalCount = activeAnomalies.filter(
    (a) => a.severity === 'critical'
  ).length;
  const highCount = activeAnomalies.filter((a) => a.severity === 'high').length;
  const moderateCount = activeAnomalies.filter(
    (a) => a.severity === 'moderate'
  ).length;
  const highestRec = anomalies.length > 0 ? anomalies[0] : null;

  return {
    anomalies,
    anomaliesMap,
    categoryStats,
    categoryBaselines: categoryStats,
    totalAnomalousSpend,
    totalAnomaliesCount: activeAnomalies.length,
    criticalCount,
    highCount,
    moderateCount,
    highestMultiplierRecord: highestRec,
    highestAnomaly: highestRec,
    thresholdMultiplier,
  };
}

/**
 * Priority 5: Real-time Amount Anomaly Check for Ingested / Synced Transactions
 * Checks a single incoming expense against historical data for that merchant and category.
 * Even for 100% verified senders (e.g. authentic AWS / Google / Bank emails), flags
 * billing spikes (e.g. 3x - 10x historical average) to catch account compromises,
 * runaway cloud infrastructure, or billing errors.
 */
export function checkTransactionAmountAnomaly(
  expense: Expense,
  historicalExpenses: Expense[],
  targetCurrency: SupportedCurrency = 'IDR',
  ratesToIDR: Record<SupportedCurrency, number> = {} as any,
  surgeThresholdMultiplier: number = 2.5
): {
  isAnomaly: boolean;
  multiplier: number;
  baselineAverage: number;
  percentIncrease: number;
  severity: 'moderate' | 'high' | 'critical';
  reason: string;
} {
  const currentConverted = convertCurrency(
    expense.amount,
    (expense.currency as SupportedCurrency) || 'IDR',
    targetCurrency,
    ratesToIDR
  );

  // Ignore negligible charges under $1 / Rp 15,000
  if (currentConverted < 15000) {
    return {
      isAnomaly: false,
      multiplier: 1,
      baselineAverage: currentConverted,
      percentIncrease: 0,
      severity: 'moderate',
      reason: '',
    };
  }

  const cleanMerchant = (expense.merchant || '').toLowerCase().trim();
  const pastDebitExpenses = historicalExpenses.filter(
    (e) => e.type !== 'credit' && e.id !== expense.id
  );

  // 1. Merchant-specific baseline check (highest precision)
  const sameMerchantPast = pastDebitExpenses.filter((e) => {
    const m = (e.merchant || '').toLowerCase().trim();
    return (
      m === cleanMerchant ||
      (m &&
        cleanMerchant &&
        (m.includes(cleanMerchant) || cleanMerchant.includes(m)))
    );
  });

  if (sameMerchantPast.length >= 2) {
    const pastValues = sameMerchantPast.map((e) =>
      convertCurrency(
        e.amount,
        (e.currency as SupportedCurrency) || 'IDR',
        targetCurrency,
        ratesToIDR
      )
    );
    const avg = pastValues.reduce((sum, v) => sum + v, 0) / pastValues.length;

    if (avg > 0) {
      const multiplier = currentConverted / avg;
      if (multiplier >= surgeThresholdMultiplier) {
        const percentIncrease = Math.round(
          ((currentConverted - avg) / avg) * 100
        );
        let severity: 'moderate' | 'high' | 'critical' = 'moderate';
        if (multiplier >= 4.0) severity = 'critical';
        else if (multiplier >= 2.8) severity = 'high';

        const formattedCurrent = formatCurrency(
          currentConverted,
          targetCurrency
        );
        const formattedAvg = formatCurrency(avg, targetCurrency);

        return {
          isAnomaly: true,
          multiplier: Math.round(multiplier * 10) / 10,
          baselineAverage: Math.round(avg),
          percentIncrease,
          severity,
          reason: `Billing Surge: ${formattedCurrent} is ${multiplier.toFixed(1)}x higher (+${percentIncrease}%) than your historical ${expense.merchant || 'merchant'} average (${formattedAvg}).`,
        };
      }
    }
  }

  // 2. Category-specific baseline check
  const cat = expense.category || 'Other';
  const sameCategoryPast = pastDebitExpenses.filter(
    (e) => (e.category || 'Other') === cat
  );

  if (sameCategoryPast.length >= 3) {
    const pastValues = sameCategoryPast.map((e) =>
      convertCurrency(
        e.amount,
        (e.currency as SupportedCurrency) || 'IDR',
        targetCurrency,
        ratesToIDR
      )
    );
    const avg = pastValues.reduce((sum, v) => sum + v, 0) / pastValues.length;

    if (avg > 0) {
      const multiplier = currentConverted / avg;
      if (multiplier >= Math.max(3.0, surgeThresholdMultiplier)) {
        const percentIncrease = Math.round(
          ((currentConverted - avg) / avg) * 100
        );
        let severity: 'moderate' | 'high' | 'critical' = 'moderate';
        if (multiplier >= 5.0) severity = 'critical';
        else if (multiplier >= 3.5) severity = 'high';

        const formattedCurrent = formatCurrency(
          currentConverted,
          targetCurrency
        );
        const formattedAvg = formatCurrency(avg, targetCurrency);

        return {
          isAnomaly: true,
          multiplier: Math.round(multiplier * 10) / 10,
          baselineAverage: Math.round(avg),
          percentIncrease,
          severity,
          reason: `Category Spike: ${formattedCurrent} is ${multiplier.toFixed(1)}x higher than average ${cat} spending (${formattedAvg}).`,
        };
      }
    }
  }

  return {
    isAnomaly: false,
    multiplier: 1,
    baselineAverage: currentConverted,
    percentIncrease: 0,
    severity: 'moderate',
    reason: '',
  };
}
