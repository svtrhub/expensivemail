import React, { useState, useMemo } from 'react';
import { Expense, BudgetCategory, ExpenseCategory } from '../types';
import {
  formatCurrency,
  convertCurrency,
  SupportedCurrency,
  CURRENCIES,
  DEFAULT_EXCHANGE_RATE_DB,
} from '../services/currency';
import { Translations } from '../services/translations';
import { Target, AlertTriangle, CheckCircle, Edit3, Plus } from 'lucide-react';
import { AnimatedNumber } from './motion/animated-number';

interface BudgetManagerProps {
  expenses: Expense[];
  budgets: BudgetCategory[];
  onUpdateBudget: (category: ExpenseCategory, newLimit: number) => void;
  onOpenSetBudgetModal?: () => void;
  currency: SupportedCurrency;
  ratesToIDR?: Record<SupportedCurrency, number>;
  t: Translations;
}

export const BudgetManager: React.FC<BudgetManagerProps> = ({
  expenses,
  budgets,
  onUpdateBudget,
  onOpenSetBudgetModal,
  currency,
  ratesToIDR = DEFAULT_EXCHANGE_RATE_DB.ratesToIDR,
  t,
}) => {
  const [editingCategory, setEditingCategory] =
    useState<ExpenseCategory | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const {
    categorySpendMap,
    totalBudget,
    totalSpentInBudgeted,
    overallPercentage,
  } = useMemo(() => {
    // Calculate spending this month per category converted to active currency
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const currentMonthExpenses = expenses.filter(
      (e) => e.date.startsWith(currentMonthStr) && e.type === 'debit'
    );

    const spendMap = currentMonthExpenses.reduce(
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

    const budgetTotal = budgets.reduce((sum, b) => {
      const convertedLimit = convertCurrency(
        b.monthlyLimit,
        'IDR',
        currency,
        ratesToIDR
      );
      return sum + convertedLimit;
    }, 0);

    const spentInBudgeted = budgets.reduce(
      (sum, b) => sum + (spendMap[b.category] || 0),
      0
    );

    const percentage =
      budgetTotal > 0 ? (spentInBudgeted / budgetTotal) * 100 : 0;

    return {
      categorySpendMap: spendMap,
      totalBudget: budgetTotal,
      totalSpentInBudgeted: spentInBudgeted,
      overallPercentage: percentage,
    };
  }, [expenses, budgets, currency, ratesToIDR]);

  const handleStartEdit = (budget: BudgetCategory) => {
    setEditingCategory(budget.category);
    // Convert current IDR limit to active currency for display in input
    const convertedLimit = convertCurrency(
      budget.monthlyLimit,
      'IDR',
      currency,
      ratesToIDR
    );
    setEditValue(convertedLimit.toString());
  };

  const handleSaveEdit = (category: ExpenseCategory) => {
    const val = parseFloat(editValue);
    if (!isNaN(val) && val >= 0) {
      // Convert value in active currency back to base IDR for persistent storage
      const idrLimit = convertCurrency(val, currency, 'IDR', ratesToIDR);
      onUpdateBudget(category, idrLimit);
    }
    setEditingCategory(null);
  };

  const currencySymbol = CURRENCIES[currency]?.symbol || 'Rp';

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 text-white transition-colors">
      <div className="glass-content">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-[#F0F4F8] dark:bg-[#163354] text-[#2251FF] dark:text-[#38BDF8]">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#051C2C] dark:text-white tracking-tight font-editorial">
                {t.budgets.title}
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                {t.budgets.subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-3 text-xs bg-[#F8F9FA] dark:bg-[#081827] px-3.5 py-2 rounded-lg border border-[#CBD5E1] dark:border-[#1E3A5F]">
              <span className="text-[#64748B] dark:text-slate-400 font-medium">
                {t.budgets.totalBudget}:
              </span>
              <span className="font-mono font-bold text-[#051C2C] dark:text-white">
                <AnimatedNumber
                  value={totalSpentInBudgeted}
                  format={(v) => formatCurrency(v, currency)}
                />{' '}
                /{' '}
                <AnimatedNumber
                  value={totalBudget}
                  format={(v) => formatCurrency(v, currency)}
                />{' '}
                (
                <AnimatedNumber
                  value={overallPercentage}
                  format={(v) => v.toFixed(0)}
                />
                %)
              </span>
            </div>

            {onOpenSetBudgetModal && (
              <button
                type="button"
                onClick={onOpenSetBudgetModal}
                className="px-3.5 py-2 bg-[#2251FF] hover:bg-[#1267D5] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{t.budgets.setupDefaults}</span>
              </button>
            )}
          </div>
        </div>

        {/* Grid of Budget Cards or Empty State */}
        {budgets.length === 0 ? (
          <div className="text-center py-10 px-4 bg-[#F8F9FA] dark:bg-[#081827] rounded-xl border border-dashed border-[#CBD5E1] dark:border-[#1E3A5F] mt-5">
            <div className="w-12 h-12 rounded-xl bg-[#F0F4F8] dark:bg-[#163354] text-[#2251FF] dark:text-[#38BDF8] flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[#051C2C] dark:text-white">
              {t.budgets.noBudgetsTitle}
            </h4>
            <p className="text-xs text-[#64748B] dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
              {t.budgets.noBudgetsDesc}
            </p>
            <button
              type="button"
              onClick={() => {
                if (onOpenSetBudgetModal) {
                  onOpenSetBudgetModal();
                } else {
                  const defaultCategories: ExpenseCategory[] = [
                    'Dining & Food',
                    'Groceries',
                    'Shopping & Retail',
                    'Utilities & Bills',
                    'Travel & Transportation',
                    'Entertainment & Subscriptions',
                    'Health & Wellness',
                    'Financial & Fees',
                  ];
                  defaultCategories.forEach((cat) => {
                    onUpdateBudget(cat, currency === 'IDR' ? 2000000 : 300);
                  });
                }
              }}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-[#2251FF] hover:bg-[#1267D5] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>{t.budgets.setupDefaults}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-5">
            {budgets.map((budget) => {
              const spent = categorySpendMap[budget.category] || 0;
              const convertedLimit = convertCurrency(
                budget.monthlyLimit,
                'IDR',
                currency,
                ratesToIDR
              );
              const percentage =
                convertedLimit > 0 ? (spent / convertedLimit) * 100 : 0;
              const isOver = spent > convertedLimit;
              const isNear = percentage >= 80 && !isOver;
              const isEditing = editingCategory === budget.category;

              return (
                <div
                  key={budget.category}
                  className={`p-4 rounded-xl border transition-colors ${
                    isOver
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 shadow-2xs'
                      : isNear
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 shadow-2xs'
                        : 'bg-white dark:bg-[#081827] border-[#E2E8F0] dark:border-[#1E3A5F] hover:border-[#CBD5E1] dark:hover:border-[#2A486F] shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#051C2C] dark:text-white">
                        {t.categories[budget.category] || budget.category}
                      </h4>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        {isOver ? (
                          <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1 text-rose-600 dark:text-rose-400" />
                            {t.budgets.overBudget}:{' '}
                            <AnimatedNumber
                              value={spent - convertedLimit}
                              format={(v) => formatCurrency(v, currency)}
                            />
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#64748B] dark:text-slate-400">
                            {t.budgets.remaining}:{' '}
                            <AnimatedNumber
                              value={convertedLimit - spent}
                              format={(v) => formatCurrency(v, currency)}
                            />
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      id={`edit-budget-${budget.category.replace(/\s+/g, '-')}`}
                      onClick={() => handleStartEdit(budget)}
                      className="p-1.5 rounded hover:bg-[#F0F4F8] dark:hover:bg-[#163354] text-slate-400 hover:text-[#2251FF] dark:hover:text-[#38BDF8] transition-colors cursor-pointer"
                      title="Adjust monthly budget limit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Progress meter */}
                  <div className="mt-3.5">
                    <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                      <span className="font-bold text-[#051C2C] dark:text-white">
                        <AnimatedNumber
                          value={spent}
                          format={(v) => formatCurrency(v, currency)}
                        />
                      </span>
                      <span className="text-[#64748B] dark:text-slate-400">
                        {t.budgets.cap}{' '}
                        <AnimatedNumber
                          value={convertedLimit}
                          format={(v) => formatCurrency(v, currency)}
                        />
                      </span>
                    </div>

                    <div className="w-full h-2 bg-[#F1F5F9] dark:bg-[#0D2238] rounded-full overflow-hidden border border-[#E2E8F0] dark:border-[#1E3A5F]">
                      <div
                        className={`h-full rounded-full transition-[width,background-color] duration-500 ${
                          isOver
                            ? 'bg-rose-500'
                            : isNear
                              ? 'bg-amber-500'
                              : 'bg-[#2251FF]'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Inline Editor */}
                  {isEditing && (
                    <div className="mt-3 pt-3 border-t border-[#E2E8F0] dark:border-[#1E3A5F] flex items-center space-x-2">
                      <div className="relative flex-1">
                        <span className="text-xs absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-slate-400 font-semibold font-mono">
                          {currencySymbol}
                        </span>
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full pl-8 pr-2 py-1 bg-[#F8F9FA] dark:bg-[#0D2238] border border-[#CBD5E1] dark:border-[#1E3A5F] rounded text-xs text-[#051C2C] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2251FF] font-mono"
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={() => handleSaveEdit(budget.category)}
                        className="px-2.5 py-1 bg-[#2251FF] text-white rounded text-xs font-semibold hover:bg-[#1267D5] transition-colors cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="px-2 py-1 bg-slate-100 dark:bg-[#163354] hover:bg-slate-200 dark:hover:bg-[#1E4373] text-slate-600 dark:text-slate-300 rounded text-xs cursor-pointer"
                      >
                        {t.modals.cancel}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
