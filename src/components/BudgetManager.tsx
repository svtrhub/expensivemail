import React, { useState, useMemo } from 'react';
import {
  Target,
  Plus,
  RotateCcw,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Eye,
  Pencil,
  Check,
  X,
  Calendar,
  Utensils,
  ShoppingCart,
  ShoppingBag,
  Zap,
  Car,
  Tv,
  Heart,
  CreditCard,
  Home,
  Tag,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Expense,
  BudgetCategory,
  SupportedCurrency,
  ExpenseCategory,
  EXPENSE_CATEGORIES,
} from '../types';
import { Translations } from '../services/translations';
import { formatCurrency, convertCurrency } from '../services/currency';

interface BudgetManagerProps {
  expenses: Expense[];
  budgets: BudgetCategory[];
  onUpdateBudget: (category: ExpenseCategory, newLimit: number) => void;
  onOpenSetBudgetModal?: () => void;
  onResetDefaultBudgets?: () => void;
  currency: SupportedCurrency;
  ratesToIDR?: Record<SupportedCurrency, number>;
  t: Translations;
  onSelectCategoryFilter?: (category: ExpenseCategory) => void;
  language?: 'id' | 'en';
}

const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string; color?: string }>
> = {
  'Dining & Food': Utensils,
  Groceries: ShoppingCart,
  'Shopping & Retail': ShoppingBag,
  'Utilities & Bills': Zap,
  'Travel & Transportation': Car,
  'Entertainment & Subscriptions': Tv,
  'Health & Wellness': Heart,
  'Financial & Fees': CreditCard,
  'Housing & Rent': Home,
  Other: Tag,
};

const CATEGORY_COLORS: Record<string, string> = {
  'Dining & Food': '#FB923C',
  Groceries: '#34D399',
  'Shopping & Retail': '#60A5FA',
  'Utilities & Bills': '#FBBF24',
  'Travel & Transportation': '#2DD4BF',
  'Entertainment & Subscriptions': '#C084FC',
  'Health & Wellness': '#FB7185',
  'Financial & Fees': '#94A3B8',
  'Housing & Rent': '#818CF8',
  Other: '#A78BFA',
};

export const BudgetManager: React.FC<BudgetManagerProps> = ({
  expenses,
  budgets,
  onUpdateBudget,
  onOpenSetBudgetModal,
  onResetDefaultBudgets,
  currency,
  ratesToIDR,
  t,
  onSelectCategoryFilter,
  language = 'id',
}) => {
  const [editingCategory, setEditingCategory] =
    useState<ExpenseCategory | null>(null);
  const [editLimitInput, setEditLimitInput] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'OVER' | 'APPROACHING' | 'SAFE'
  >('ALL');

  // Available months from expense dates
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    monthsSet.add(currentMonthKey);

    expenses.forEach((e) => {
      if (e.date && e.date.length >= 7) {
        monthsSet.add(e.date.slice(0, 7));
      }
    });

    return Array.from(monthsSet).sort().reverse();
  }, [expenses]);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return selectedMonth === cur;
  }, [selectedMonth]);

  // Aggregate expenses for the selected month by category
  const {
    categorySpendMap,
    categoryTxCountMap,
    totalSpentSelectedMonth,
    unbudgetedSpendMap,
  } = useMemo(() => {
    const spendMap: Record<string, number> = {};
    const countMap: Record<string, number> = {};
    const unbudgeted: Record<string, number> = {};
    const budgetedCategoriesSet = new Set(budgets.map((b) => b.category));
    let totalSpent = 0;

    expenses.forEach((e) => {
      // Must not be an incoming credit/deposit
      if (e.type === 'credit') return;

      // Match month prefix resiliently (e.g. "2026-09")
      const matchesMonth =
        (e.date && e.date.startsWith(selectedMonth)) ||
        (() => {
          const d = new Date(e.date);
          if (isNaN(d.getTime())) return false;
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          return key === selectedMonth;
        })();

      if (matchesMonth) {
        const cat = e.category || 'Other';
        // e.amount is stored in canonical IDR
        spendMap[cat] = (spendMap[cat] || 0) + e.amount;
        countMap[cat] = (countMap[cat] || 0) + 1;
        totalSpent += e.amount;

        if (!budgetedCategoriesSet.has(cat as ExpenseCategory)) {
          unbudgeted[cat] = (unbudgeted[cat] || 0) + e.amount;
        }
      }
    });

    return {
      categorySpendMap: spendMap,
      categoryTxCountMap: countMap,
      totalSpentSelectedMonth: totalSpent,
      unbudgetedSpendMap: unbudgeted,
    };
  }, [expenses, selectedMonth, budgets]);

  // Total budget in canonical IDR
  const totalBudgetIDR = useMemo(() => {
    return budgets.reduce((sum, b) => sum + (b.monthlyLimit || 0), 0);
  }, [budgets]);

  // Conversions for summary display
  const totalBudgetDisplay = convertCurrency(
    totalBudgetIDR,
    'IDR',
    currency,
    ratesToIDR
  );
  const totalSpentDisplay = convertCurrency(
    totalSpentSelectedMonth,
    'IDR',
    currency,
    ratesToIDR
  );
  const remainingIDR = totalBudgetIDR - totalSpentSelectedMonth;
  const remainingDisplay = convertCurrency(
    Math.abs(remainingIDR),
    'IDR',
    currency,
    ratesToIDR
  );
  const overallUtilizationPct =
    totalBudgetIDR > 0 ? (totalSpentSelectedMonth / totalBudgetIDR) * 100 : 0;

  // Month pacing calculation
  const pacingData = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    const now = new Date();

    let daysPassed = totalDaysInMonth;
    if (isCurrentMonth) {
      daysPassed = Math.min(now.getDate(), totalDaysInMonth);
    }

    const expectedPct = (daysPassed / totalDaysInMonth) * 100;
    const diffPct = overallUtilizationPct - expectedPct;

    return {
      daysPassed,
      totalDaysInMonth,
      expectedPct,
      isPacingFast: diffPct > 8,
      diffPct: Math.round(diffPct),
    };
  }, [selectedMonth, isCurrentMonth, overallUtilizationPct]);

  // Count budget status groups
  const statusCounts = useMemo(() => {
    let safe = 0;
    let approaching = 0;
    let over = 0;

    budgets.forEach((b) => {
      const spent = categorySpendMap[b.category] || 0;
      const pct = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
      if (pct > 100) over++;
      else if (pct >= 80) approaching++;
      else safe++;
    });

    return { safe, approaching, over };
  }, [budgets, categorySpendMap]);

  // Filtered budgets list
  const filteredBudgets = useMemo(() => {
    if (statusFilter === 'ALL') return budgets;
    return budgets.filter((b) => {
      const spent = categorySpendMap[b.category] || 0;
      const pct = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
      if (statusFilter === 'OVER') return pct > 100;
      if (statusFilter === 'APPROACHING') return pct >= 80 && pct <= 100;
      if (statusFilter === 'SAFE') return pct < 80;
      return true;
    });
  }, [budgets, statusFilter, categorySpendMap]);

  const handleStartEdit = (budget: BudgetCategory) => {
    setEditingCategory(budget.category);
    // Display limit converted into active currency
    const displayVal = convertCurrency(
      budget.monthlyLimit,
      'IDR',
      currency,
      ratesToIDR
    );
    const rounded = currency === 'IDR' ? displayVal : Math.round(displayVal);
    setEditLimitInput(String(rounded));
  };

  const handleSaveEdit = (category: ExpenseCategory) => {
    const val = parseFloat(editLimitInput);
    if (!isNaN(val) && val > 0) {
      // Convert back to canonical IDR
      const idrLimit = Math.round(
        convertCurrency(val, currency, 'IDR', ratesToIDR)
      );
      onUpdateBudget(category, idrLimit);
    }
    setEditingCategory(null);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
  };

  // Format month name
  const formatMonthLabel = (mKey: string) => {
    try {
      const [y, m] = mKey.split('-');
      const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
      return d.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return mKey;
    }
  };

  return (
    <section
      id="budget-manager-panel"
      aria-label="Financial Budget Management"
      className="glass-panel rounded-2xl p-5 sm:p-6 text-slate-100 transition-colors shadow-xl border border-white/10"
    >
      <div className="glass-content space-y-6">
        {/* Top Header & Global Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2251FF] to-[#6FE0FF] p-[1px] shrink-0 shadow-md">
              <div className="w-full h-full rounded-[11px] bg-[#0A1120] flex items-center justify-center text-[#6FE0FF]">
                <Target className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {t.budgets.title}
                </h2>
                {isCurrentMonth ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {language === 'id' ? 'Bulan Berjalan' : 'Active Month'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">
                    {language === 'id' ? 'Arsip Periode' : 'Past Period'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {t.budgets.subtitle}
              </p>
            </div>
          </div>

          {/* Controls: Month Selector & Set Budget CTAs */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Month Selector */}
            <div className="relative">
              <div className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#0A1120] border border-white/15 text-xs text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-[#6FE0FF]" />
                <select
                  id="budget-month-selector"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{ colorScheme: 'dark', backgroundColor: '#0A1120' }}
                  className="bg-transparent border-none text-xs font-semibold text-white focus:outline-none cursor-pointer pr-2 [&>option]:bg-[#0A1120] [&>option]:text-white"
                >
                  {availableMonths.map((m) => (
                    <option
                      key={m}
                      value={m}
                      className="bg-[#0A1120] text-white"
                    >
                      {formatMonthLabel(m)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Set / Adjust Limits */}
            {onOpenSetBudgetModal && (
              <button
                id="btn-open-set-budget-modal"
                onClick={onOpenSetBudgetModal}
                className="px-3.5 py-2 rounded-xl bg-[#2251FF] hover:bg-[#1A41CC] text-white text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {budgets.length === 0
                    ? t.budgets.setupDefaults
                    : language === 'id'
                      ? 'Tambah Target'
                      : 'Add Target'}
                </span>
              </button>
            )}

            {/* Reset to Recommended Defaults */}
            {onResetDefaultBudgets && (
              <button
                id="btn-reset-default-budgets"
                onClick={onResetDefaultBudgets}
                title={
                  language === 'id'
                    ? 'Reset target anggaran standar'
                    : 'Reset to standard default limits'
                }
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">
                  {language === 'id' ? 'Standar' : 'Defaults'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Global Overview & Metric Highlights */}
        {budgets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Total Budget Card */}
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                {t.budgets.totalBudget} ({currency})
              </span>
              <div className="text-xl font-mono font-bold text-white">
                {formatCurrency(totalBudgetDisplay, currency)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                <Target className="w-3 h-3 text-[#6FE0FF]" />
                <span>
                  {budgets.length}{' '}
                  {language === 'id'
                    ? 'kategori dibatasi'
                    : 'categories budgeted'}
                </span>
              </div>
            </div>

            {/* Total Spent Card */}
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                {t.budgets.spent} ({currency})
              </span>
              <div className="text-xl font-mono font-bold text-[#6FE0FF]">
                {formatCurrency(totalSpentDisplay, currency)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3 text-[#6FE0FF]" />
                <span>{formatMonthLabel(selectedMonth)}</span>
              </div>
            </div>

            {/* Remaining / Over Budget */}
            <div
              className={`p-4 rounded-xl border shadow-xs ${
                remainingIDR < 0
                  ? 'bg-rose-500/10 border-rose-500/30'
                  : 'bg-emerald-500/10 border-emerald-500/30'
              }`}
            >
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                {remainingIDR < 0 ? t.budgets.overBudget : t.budgets.remaining}{' '}
                ({currency})
              </span>
              <div
                className={`text-xl font-mono font-bold ${
                  remainingIDR < 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {remainingIDR < 0 ? '-' : '+'}
                {formatCurrency(remainingDisplay, currency)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                {remainingIDR < 0 ? (
                  <AlertCircle className="w-3 h-3 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                )}
                <span>
                  {overallUtilizationPct.toFixed(1)}%{' '}
                  {language === 'id' ? 'terpakai' : 'utilized'}
                </span>
              </div>
            </div>

            {/* Pace & Burn Rate */}
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                {language === 'id' ? 'Laju Pengeluaran' : 'Spending Pace'}
              </span>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                {pacingData.isPacingFast ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {language === 'id'
                      ? 'Lebih Cepat Dari Jadwal'
                      : 'Pacing Ahead'}
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {language === 'id' ? 'Terkendali Aman' : 'Well Controlled'}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-1.5">
                {isCurrentMonth ? (
                  <span>
                    {language === 'id'
                      ? `Hari ke-${pacingData.daysPassed} dari ${pacingData.totalDaysInMonth} hari`
                      : `Day ${pacingData.daysPassed} of ${pacingData.totalDaysInMonth}`}
                  </span>
                ) : (
                  <span>
                    {language === 'id'
                      ? 'Laporan periode ditutup'
                      : 'Closed period report'}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status Filter Chips */}
        {budgets.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 text-[11px] font-semibold mr-1 flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3" />
                {language === 'id' ? 'Filter Status:' : 'Filter:'}
              </span>
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-white/20 text-white shadow-xs'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {language === 'id' ? 'Semua' : 'All'} ({budgets.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('OVER')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'OVER'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-white/5 text-slate-400 hover:text-rose-400'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                {language === 'id' ? 'Melebihi' : 'Over'} ({statusCounts.over})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('APPROACHING')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'APPROACHING'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-white/5 text-slate-400 hover:text-amber-400'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {language === 'id' ? 'Mendekati Cap' : 'Near Cap'} (
                {statusCounts.approaching})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('SAFE')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'SAFE'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-white/5 text-slate-400 hover:text-emerald-400'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {language === 'id' ? 'Aman' : 'Safe'} ({statusCounts.safe})
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {budgets.length === 0 ? (
          <div
            id="budgets-empty-state"
            className="p-8 sm:p-12 rounded-2xl bg-white/[0.02] border border-dashed border-white/20 text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#2251FF]/15 border border-[#6FE0FF]/30 flex items-center justify-center text-[#6FE0FF] mx-auto shadow-inner">
              <Target className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-base font-bold text-white">
                {t.budgets.noBudgetsTitle}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.budgets.noBudgetsDesc}
              </p>
            </div>
            {onResetDefaultBudgets && (
              <button
                id="btn-empty-apply-defaults"
                type="button"
                onClick={onResetDefaultBudgets}
                className="px-5 py-2.5 rounded-xl bg-[#2251FF] hover:bg-[#1A41CC] text-white text-xs font-bold transition-all shadow-md inline-flex items-center space-x-2 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-[#6FE0FF]" />
                <span>{t.budgets.setupDefaults}</span>
              </button>
            )}
          </div>
        ) : (
          /* Budget Category Grid */
          <div
            id="budget-categories-grid"
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {filteredBudgets.map((budget) => {
              const spentIDR = categorySpendMap[budget.category] || 0;
              const txCount = categoryTxCountMap[budget.category] || 0;
              const limitIDR = budget.monthlyLimit || 0;
              const percentage = limitIDR > 0 ? (spentIDR / limitIDR) * 100 : 0;
              const isOver = percentage > 100;
              const isNear = percentage >= 80 && !isOver;

              const spentDisplay = convertCurrency(
                spentIDR,
                'IDR',
                currency,
                ratesToIDR
              );
              const limitDisplay = convertCurrency(
                limitIDR,
                'IDR',
                currency,
                ratesToIDR
              );
              const diffIDR = Math.abs(limitIDR - spentIDR);
              const diffDisplay = convertCurrency(
                diffIDR,
                'IDR',
                currency,
                ratesToIDR
              );

              const CategoryIcon = CATEGORY_ICONS[budget.category] || Tag;
              const categoryColor =
                budget.color || CATEGORY_COLORS[budget.category] || '#2251FF';
              const isEditing = editingCategory === budget.category;

              return (
                <div
                  key={budget.category}
                  id={`budget-card-${budget.category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  className={`p-4 rounded-xl border transition-all relative overflow-hidden group ${
                    isOver
                      ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
                      : isNear
                        ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50'
                        : 'bg-white/[0.04] border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Card Header: Category & Controls */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                        style={{
                          backgroundColor: `${categoryColor}25`,
                          border: `1px solid ${categoryColor}50`,
                        }}
                      >
                        <CategoryIcon
                          className="w-5 h-5"
                          color={categoryColor}
                        />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-white tracking-wide">
                            {t.categories[budget.category] || budget.category}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-400 font-mono">
                            {txCount} {language === 'id' ? 'transaksi' : 'txns'}
                          </span>
                          {/* Drill-down link to transactions */}
                          {onSelectCategoryFilter && (
                            <button
                              type="button"
                              onClick={() =>
                                onSelectCategoryFilter(budget.category)
                              }
                              className="text-[11px] text-[#6FE0FF] hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
                              title={
                                language === 'id'
                                  ? `Lihat transaksi ${budget.category}`
                                  : `View transactions for ${budget.category}`
                              }
                            >
                              <span>
                                {language === 'id'
                                  ? 'Lihat Riwayat'
                                  : 'View History'}
                              </span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Pill & Edit Action */}
                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isOver
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : isNear
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {percentage.toFixed(0)}%
                      </span>

                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(budget)}
                          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                          aria-label={`Edit ${budget.category} budget limit`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Limit Editing Form */}
                  {isEditing ? (
                    <div className="p-3 my-2 rounded-xl bg-[#0A1120] border border-[#2251FF]/40 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                        <span>
                          {language === 'id'
                            ? 'Atur Limit Baru'
                            : 'Set New Cap'}{' '}
                          ({currency})
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {language === 'id'
                            ? 'Tersimpan otomatis'
                            : 'Auto-synced'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="any"
                          min="1"
                          value={editLimitInput}
                          onChange={(e) => setEditLimitInput(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/20 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#6FE0FF]"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(budget.category)}
                          className="px-3 py-1.5 rounded-lg bg-[#2251FF] hover:bg-[#1A41CC] text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{language === 'id' ? 'Simpan' : 'Save'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 text-xs transition-colors shrink-0 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Spending vs Limit Metric Display */
                    <div className="space-y-2 my-2">
                      <div className="flex items-baseline justify-between text-xs">
                        <div className="space-x-1">
                          <span className="text-slate-400 font-medium">
                            {language === 'id' ? 'Terpakai:' : 'Spent:'}
                          </span>
                          <span className="font-mono font-bold text-white">
                            {formatCurrency(spentDisplay, currency)}
                          </span>
                        </div>
                        <div className="space-x-1 text-right">
                          <span className="text-slate-400 font-medium">
                            {t.budgets.cap}:
                          </span>
                          <span className="font-mono font-bold text-slate-300">
                            {formatCurrency(limitDisplay, currency)}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar with Semantic Color & Overflow */}
                      <div className="w-full h-2 rounded-full bg-black/30 overflow-hidden relative">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            isOver
                              ? 'bg-rose-500'
                              : isNear
                                ? 'bg-amber-400'
                                : 'bg-[#2251FF]'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>

                      {/* Remaining / Over Budget Delta Label */}
                      <div className="flex items-center justify-between text-[11px] pt-0.5">
                        <span
                          className={
                            isOver
                              ? 'text-rose-400 font-semibold'
                              : isNear
                                ? 'text-amber-400 font-semibold'
                                : 'text-slate-400'
                          }
                        >
                          {isOver
                            ? `${t.budgets.overBudget}: ${formatCurrency(diffDisplay, currency)}`
                            : `${t.budgets.remaining}: ${formatCurrency(diffDisplay, currency)}`}
                        </span>

                        <span className="text-[10px] text-slate-500 font-mono">
                          {isOver
                            ? language === 'id'
                              ? 'Perlu evaluasi'
                              : 'Limit exceeded'
                            : language === 'id'
                              ? 'Sisa batas aman'
                              : 'Remaining safe'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Unbudgeted Spending Alert (Discovered Categories) */}
        {Object.keys(unbudgetedSpendMap).length > 0 && (
          <div
            id="unbudgeted-categories-card"
            className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {language === 'id'
                      ? 'Pengeluaran Di Kategori Tanpa Target'
                      : 'Spending in Unbudgeted Categories'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {language === 'id'
                      ? 'Ditemukan pengeluaran pada kategori yang belum dipasangi batas target anggaran'
                      : 'Found transactions in categories without an active monthly target cap'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
              {Object.entries(unbudgetedSpendMap).map(([cat, amount]) => {
                const displayAmt = convertCurrency(
                  amount,
                  'IDR',
                  currency,
                  ratesToIDR
                );
                return (
                  <div
                    key={cat}
                    className="p-2.5 rounded-lg bg-black/30 border border-white/10 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        {t.categories[cat as ExpenseCategory] || cat}
                      </span>
                      <span className="text-[11px] font-mono text-amber-300">
                        {formatCurrency(displayAmt, currency)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateBudget(cat as ExpenseCategory, 1500000)
                      }
                      className="px-2.5 py-1 rounded-md bg-[#2251FF] hover:bg-[#1A41CC] text-[11px] font-bold text-white transition-all cursor-pointer"
                    >
                      {language === 'id' ? '+ Anggarkan' : '+ Set Cap'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
export default BudgetManager;
