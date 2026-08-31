import React, { useMemo } from 'react';
import {
  TrendingUp,
  Receipt,
  RotateCcw,
  Gauge,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react';
import { Expense } from '../types';
import {
  formatCurrency,
  SupportedCurrency,
  convertCurrency,
} from '../services/currency';
import { Translations } from '../services/translations';
import { Card } from './ui/card';
import { AnimatedNumber } from './motion/animated-number';

interface MetricCardsProps {
  expenses: Expense[];
  onOpenSubscriptions: () => void;
  onOpenAnalytics?: () => void;
  onOpenSyncLogs?: () => void;
  currency: SupportedCurrency;
  ratesToIDR: Record<SupportedCurrency, number>;
  t: Translations;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  expenses,
  onOpenSubscriptions,
  onOpenAnalytics,
  onOpenSyncLogs,
  currency,
  ratesToIDR,
  t,
}) => {
  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDay = Math.max(1, now.getDate());
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const monthlyExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalMonthlySpend = monthlyExpenses.reduce((sum, e) => {
      const inTarget = convertCurrency(
        e.amount,
        e.currency as SupportedCurrency,
        currency,
        ratesToIDR
      );
      return sum + inTarget;
    }, 0);

    const dailyAverage = totalMonthlySpend / currentDay;
    const projectedMonthEnd = dailyAverage * daysInMonth;

    // Subscriptions detection
    const subscriptions = expenses.filter(
      (e) =>
        e.isRecurring ||
        e.category === 'Entertainment & Subscriptions' ||
        e.tags?.some((tag) =>
          ['subscription', 'recurring', 'saas', 'monthly'].includes(
            tag.toLowerCase()
          )
        )
    );
    const monthlySubTotal = subscriptions.reduce((sum, e) => {
      return (
        sum +
        convertCurrency(
          e.amount,
          e.currency as SupportedCurrency,
          currency,
          ratesToIDR
        )
      );
    }, 0);

    const verifiedReceiptsCount = expenses.filter(
      (e) => e.source === 'gmail_sync' || e.confidenceScore > 0.8
    ).length;

    return {
      totalMonthlySpend,
      projectedMonthEnd,
      dailyAverage,
      currentDay,
      daysInMonth,
      subscriptions,
      monthlySubTotal,
      verifiedReceiptsCount,
    };
  }, [expenses, currency, ratesToIDR]);

  const {
    totalMonthlySpend,
    projectedMonthEnd,
    dailyAverage,
    currentDay,
    daysInMonth,
    subscriptions,
    monthlySubTotal,
    verifiedReceiptsCount,
  } = metrics;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Monthly Spending & Projection (Non-clickable card, normal footer text) */}
      <Card doubleBezel className="flex flex-col justify-between">
        <div className="flex flex-col justify-between h-full space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 dark:text-slate-300">
                {t.metrics.totalSpending}
              </span>
              <div
                className="p-2 rounded-xl bg-[#2251FF]/20 text-[#60A5FA]"
                aria-hidden="true"
              >
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-editorial text-white tracking-tight mb-1 tabular-nums font-mono text-readability-shadow">
              <AnimatedNumber
                value={totalMonthlySpend}
                format={(v) => formatCurrency(v, currency)}
                className="tabular-nums font-mono"
              />
            </div>
          </div>
          <div className="text-xs flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-slate-400 font-medium">
              {t.metrics.projectedMonthEnd}
            </span>
            <span className="font-mono font-bold text-white tabular-nums">
              <AnimatedNumber
                value={projectedMonthEnd}
                format={(v) => formatCurrency(v, currency)}
                className="tabular-nums font-mono"
              />
            </span>
          </div>
        </div>
      </Card>

      {/* 2. Inbox Extraction Count (Clickable Highlight text: Active Inbox Sync) */}
      <Card doubleBezel className="flex flex-col justify-between">
        <div className="flex flex-col justify-between h-full space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 dark:text-slate-300">
                {t.metrics.totalCaptured}
              </span>
              <div
                className="p-2 rounded-xl bg-[#2251FF]/20 text-[#60A5FA]"
                aria-hidden="true"
              >
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-editorial text-white tracking-tight mb-1 tabular-nums font-mono text-readability-shadow">
              <AnimatedNumber
                value={verifiedReceiptsCount}
                className="tabular-nums font-mono"
              />
            </div>
          </div>
          <div className="text-xs flex items-center justify-between pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onOpenSyncLogs}
              className="text-[#38BDF8] font-bold hover:underline flex items-center space-x-1 cursor-pointer group transition-colors"
            >
              <span>{t.metrics.activeInboxSync}</span>
              <ArrowUpRight
                className="w-3.5 h-3.5 text-[#38BDF8] transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                aria-hidden="true"
              />
            </button>
            <span className="font-mono font-bold text-[#34D399] tabular-nums">
              99.4%
            </span>
          </div>
        </div>
      </Card>

      {/* 3. Subscriptions Tracked (Clickable Highlight text: View & Manage) */}
      <Card
        doubleBezel
        id="metric-card-subscriptions"
        className="flex flex-col justify-between"
      >
        <div className="flex flex-col justify-between h-full space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 dark:text-slate-300">
                {t.metrics.monthlySubscriptions}
              </span>
              <div
                className="p-2 rounded-xl bg-amber-500/20 text-amber-300"
                aria-hidden="true"
              >
                <RotateCcw className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-editorial text-white tracking-tight mb-1 tabular-nums font-mono text-readability-shadow flex items-baseline space-x-2">
              <span className="tabular-nums font-mono">
                {subscriptions.length}
              </span>
              <span className="text-xs font-semibold text-slate-300 font-sans">
                {subscriptions.length === 1 ? 'service' : 'services'}
              </span>
            </div>
          </div>
          <div className="text-xs flex items-center justify-between pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onOpenSubscriptions}
              className="text-[#38BDF8] font-bold hover:underline flex items-center space-x-1 cursor-pointer group transition-colors"
            >
              <span>{t.metrics.manageSubscriptions}</span>
              <ArrowUpRight
                className="w-3.5 h-3.5 text-[#38BDF8] transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                aria-hidden="true"
              />
            </button>
            <span className="font-mono font-bold text-white tabular-nums">
              <AnimatedNumber
                value={monthlySubTotal}
                format={(v) => formatCurrency(v, currency)}
                className="tabular-nums font-mono"
              />
            </span>
          </div>
        </div>
      </Card>

      {/* 4. Daily Average Spending (Non-clickable card, normal footer text) */}
      <Card doubleBezel className="flex flex-col justify-between">
        <div className="flex flex-col justify-between h-full space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 dark:text-slate-300">
                {t.metrics.dailyVelocity}
              </span>
              <div
                className="p-2 rounded-xl bg-[#2251FF]/20 text-[#60A5FA]"
                aria-hidden="true"
              >
                <Gauge className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-editorial text-white tracking-tight mb-1 tabular-nums font-mono text-readability-shadow">
              <AnimatedNumber
                value={dailyAverage}
                format={(v) => formatCurrency(v, currency)}
                className="tabular-nums font-mono"
              />
            </div>
          </div>
          <div className="text-xs flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-slate-400 font-medium">
              {t.metrics.billingCycle}
            </span>
            <span className="font-mono font-bold text-white tabular-nums">
              {currentDay}/{daysInMonth} {t.metrics.perDay}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
