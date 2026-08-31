import React, { useMemo } from 'react';
import { Expense, ExpenseCategory, SpendingInsight } from '../types';
import {
  formatCurrency,
  convertCurrency,
  SupportedCurrency,
  DEFAULT_EXCHANGE_RATE_DB,
} from '../services/currency';
import { Translations } from '../services/translations';
import { Sparkles, Building, Zap, FileText } from 'lucide-react';
import { InteractiveDashboardCharts } from './InteractiveDashboardCharts';

interface AnalyticsViewProps {
  expenses: Expense[];
  insights: SpendingInsight[];
  isLoadingInsights: boolean;
  onRefreshInsights: () => void;
  onOpenReportModal?: () => void;
  currency: SupportedCurrency;
  ratesToIDR?: Record<SupportedCurrency, number>;
  t: Translations;
  isPartialData?: boolean;
  hasMoreExpenses?: boolean;
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  'Dining & Food': '#D97706', // Warm Amber
  Groceries: '#059669', // Forest Emerald
  'Shopping & Retail': '#2251FF', // Electric Accent Blue
  'Utilities & Bills': '#475569', // Slate
  'Travel & Transportation': '#0284C7', // Sky Blue
  'Entertainment & Subscriptions': '#7C3AED', // Violet
  'Health & Wellness': '#E11D48', // Rose
  'Housing & Rent': '#0D9488', // Teal
  'Financial & Fees': '#64748B', // Muted Slate
  Other: '#94A3B8', // Neutral
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  expenses,
  insights,
  isLoadingInsights,
  onRefreshInsights,
  onOpenReportModal,
  currency,
  ratesToIDR = DEFAULT_EXCHANGE_RATE_DB.ratesToIDR,
  t,
  isPartialData = false,
  hasMoreExpenses = false,
}) => {
  interface MerchantSummary {
    merchant: string;
    total: number;
    count: number;
    category: ExpenseCategory;
  }

  const {
    totalDebit,
    sortedCategories,
    topMerchants,
    subscriptions,
    monthlySubTotal,
  } = useMemo(() => {
    const totalDebitCalc = expenses
      .filter((e) => e.type === 'debit')
      .reduce((sum, e) => {
        const converted = convertCurrency(
          e.amount,
          e.currency || 'IDR',
          currency,
          ratesToIDR
        );
        return sum + converted;
      }, 0);

    // Group by category converted to active currency
    const categoryTotals: Record<string, number> = expenses
      .filter((e) => e.type === 'debit')
      .reduce(
        (acc, e) => {
          const converted = convertCurrency(
            e.amount,
            e.currency || 'IDR',
            currency,
            ratesToIDR
          );
          acc[e.category] = (acc[e.category] || 0) + converted;
          return acc;
        },
        {} as Record<string, number>
      );

    const sortedCategoriesCalc = Object.entries(categoryTotals)
      .map(([cat, amountVal]) => {
        const amount = Number(amountVal) || 0;
        return {
          category: cat as ExpenseCategory,
          amount,
          percentage: totalDebitCalc > 0 ? (amount / totalDebitCalc) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // Group by Merchant converted to active currency
    const merchantTotals = expenses
      .filter((e) => e.type === 'debit')
      .reduce(
        (acc, e) => {
          const converted = convertCurrency(
            e.amount,
            e.currency || 'IDR',
            currency,
            ratesToIDR
          );
          if (!acc[e.merchant]) {
            acc[e.merchant] = {
              merchant: e.merchant,
              total: 0,
              count: 0,
              category: e.category,
            };
          }
          acc[e.merchant].total += converted;
          acc[e.merchant].count += 1;
          return acc;
        },
        {} as Record<string, MerchantSummary>
      );

    const topMerchantsCalc: MerchantSummary[] = (
      Object.values(merchantTotals) as MerchantSummary[]
    )
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Subscriptions converted to active currency
    const subscriptionsCalc = expenses.filter((e) => e.isRecurring);
    const monthlySubTotalCalc = subscriptionsCalc.reduce((sum, e) => {
      const converted = convertCurrency(
        e.amount,
        e.currency || 'IDR',
        currency,
        ratesToIDR
      );
      return sum + converted;
    }, 0);

    return {
      totalDebit: totalDebitCalc,
      sortedCategories: sortedCategoriesCalc,
      topMerchants: topMerchantsCalc,
      subscriptions: subscriptionsCalc,
      monthlySubTotal: monthlySubTotalCalc,
    };
  }, [expenses, currency, ratesToIDR]);

  return (
    <div className="space-y-6">
      {/* Executive AI Insights Banner */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 text-white transition-colors">
        <div className="glass-content">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-[#F0F4F8] dark:bg-[#163354] text-[#2251FF] dark:text-[#38BDF8]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base sm:text-lg font-bold text-[#051C2C] dark:text-white tracking-tight font-editorial">
                    {t.analytics.aiInsights}
                  </h3>
                  {(isPartialData || hasMoreExpenses) && (
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1"
                      title="Dataset is paged/capped. Historical rollups are active."
                    >
                      <span>⚡ Partial Data (Capped)</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#64748B] dark:text-slate-400">
                  {t.analytics.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenReportModal && (
                <button
                  id="analytics-open-statement-btn"
                  onClick={onOpenReportModal}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#051C2C] dark:bg-[#2251FF] hover:bg-[#0D2E78] dark:hover:bg-[#1267D5] text-xs font-bold text-white shadow-xs transition-[color,transform] cursor-pointer active:scale-95"
                  title="Buka Laporan Eksekutif (PDF & CSV)"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-200" />
                  <span>
                    {t.feed.statementSummary || 'Executive Statement'}
                  </span>
                </button>
              )}

              <button
                id="refresh-ai-insights-btn"
                onClick={onRefreshInsights}
                disabled={isLoadingInsights}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#F0F4F8] dark:bg-[#163354] hover:bg-[#E2E8F0] dark:hover:bg-[#1E4373] text-xs font-semibold text-[#051C2C] dark:text-white border border-[#E2E8F0] dark:border-[#1E3A5F] transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                <Sparkles
                  className={`w-3.5 h-3.5 text-[#2251FF] dark:text-[#38BDF8] ${isLoadingInsights ? 'animate-spin' : ''}`}
                />
                <span>
                  {isLoadingInsights
                    ? 'Analyzing...'
                    : t.analytics.refreshInsights}
                </span>
              </button>
            </div>
          </div>

          {insights.length === 0 ? (
            <div className="text-center py-6 px-4 bg-[#F8F9FA] dark:bg-[#081827] rounded-lg border border-dashed border-[#CBD5E1] dark:border-[#1E3A5F]">
              <Sparkles className="w-6 h-6 text-[#2251FF] dark:text-[#38BDF8] mx-auto mb-2 opacity-60" />
              <p className="text-xs font-semibold text-[#051C2C] dark:text-white">
                {t.analytics.aiInsights}
              </p>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400 max-w-sm mx-auto mt-0.5">
                {t.analytics.subtitle}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg bg-[#F8F9FA] dark:bg-[#081827] border border-[#E2E8F0] dark:border-[#1E3A5F] hover:border-[#CBD5E1] dark:hover:border-[#2A486F] transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#051C2C] dark:text-white bg-[#F0F4F8] dark:bg-[#163354] px-2 py-0.5 rounded border border-[#E2E8F0] dark:border-[#1E3A5F]">
                      {insight.badge || 'Insight'}
                    </span>
                    {insight.amount && (
                      <span className="text-xs font-bold text-[#051C2C] dark:text-white font-mono">
                        {formatCurrency(
                          convertCurrency(
                            insight.amount,
                            'IDR',
                            currency,
                            ratesToIDR
                          ),
                          currency
                        )}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-[#051C2C] dark:text-white mt-2">
                    {insight.title}
                  </h4>
                  <p className="text-xs text-[#2D3748] dark:text-slate-300 mt-1 leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Spending Breakdown */}
        <div className="glass-panel rounded-2xl p-5 sm:p-6 text-white transition-colors">
          <div className="glass-content">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-[#051C2C] dark:text-white font-editorial">
                  {t.analytics.spendingByCategory}
                </h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400">
                  {t.analytics.categoryDistributionDesc}
                </p>
              </div>
              <span className="text-sm font-bold text-[#051C2C] dark:text-white font-mono bg-[#F8F9FA] dark:bg-[#081827] px-2.5 py-1 rounded border border-[#E2E8F0] dark:border-[#1E3A5F]">
                {formatCurrency(totalDebit, currency)}
              </span>
            </div>

            {sortedCategories.length === 0 ? (
              <p className="text-xs text-[#64748B] dark:text-slate-400 text-center py-8">
                {t.feed.noExpensesFound}
              </p>
            ) : (
              <div className="space-y-3.5">
                {sortedCategories.map((item) => {
                  const color = CATEGORY_COLORS[item.category] || '#94A3B8';
                  return (
                    <div key={item.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-semibold text-[#051C2C] dark:text-white">
                            {t.categories[item.category] || item.category}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 font-mono">
                          <span className="text-[#64748B] dark:text-slate-400">
                            {item.percentage.toFixed(1)}%
                          </span>
                          <span className="font-bold text-[#051C2C] dark:text-white">
                            {formatCurrency(item.amount, currency)}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2 bg-[#F1F5F9] dark:bg-[#081827] rounded-full overflow-hidden border border-[#E2E8F0] dark:border-[#1E3A5F]">
                        <div
                          className="h-full rounded-full transition-[width,background-color] duration-500"
                          style={{
                            width: `${Math.max(item.percentage, 2)}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Top Merchants Leaderboard & Recurring Subscriptions */}
        <div className="space-y-6">
          {/* Top Merchants */}
          <div className="glass-panel rounded-2xl p-5 sm:p-6 text-white transition-colors">
            <div className="glass-content">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-base font-bold text-white font-editorial">
                    {t.analytics.topMerchants}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {t.analytics.topMerchantsDesc}
                  </p>
                </div>
                <Building className="w-4 h-4 text-[#38BDF8]" />
              </div>

              {topMerchants.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  {t.analytics.topMerchantsDesc}
                </p>
              ) : (
                <div className="space-y-2.5">
                  {topMerchants.map((m, idx) => (
                    <div
                      key={m.merchant}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/15 hover:border-[#2251FF]/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 rounded bg-white/10 text-white font-bold text-xs flex items-center justify-center border border-white/15">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-white">
                            {m.merchant}
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            {m.count} {t.analytics.orders} •{' '}
                            {t.categories[m.category] || m.category}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-white font-mono">
                          {formatCurrency(m.total, currency)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Subscriptions Stream */}
          <div className="glass-panel rounded-2xl p-5 sm:p-6 text-white transition-colors">
            <div className="glass-content">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-[#7C3AED] dark:text-purple-400" />
                  <div>
                    <h3 className="text-base font-bold text-[#051C2C] dark:text-white font-editorial">
                      {t.analytics.recurringSubscriptions}
                    </h3>
                    <p className="text-xs text-[#64748B] dark:text-slate-400">
                      {t.analytics.recurringDesc}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-[#051C2C] dark:text-purple-300 font-mono bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded border border-purple-200 dark:border-purple-800">
                  {formatCurrency(monthlySubTotal, currency)}
                  {t.analytics.perMonth}
                </span>
              </div>

              {subscriptions.length === 0 ? (
                <p className="text-xs text-[#64748B] dark:text-slate-400 text-center py-4">
                  {t.analytics.noSubscriptionsYet}
                </p>
              ) : (
                <div className="space-y-2">
                  {subscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-[#051C2C] dark:text-white">
                          {sub.merchant}
                        </h4>
                        <p className="text-[10px] text-purple-700 dark:text-purple-300 font-medium">
                          {sub.recurringFrequency || 'Monthly'} •{' '}
                          {sub.bankAccountName || 'Card'}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-[#051C2C] dark:text-white font-mono">
                        {formatCurrency(
                          convertCurrency(
                            sub.amount,
                            sub.currency || 'IDR',
                            currency,
                            ratesToIDR
                          ),
                          currency
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
