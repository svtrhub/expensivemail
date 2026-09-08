import React, { useState, useEffect } from 'react';
import { X, Target, Sparkles, Check, DollarSign } from 'lucide-react';
import {
  ExpenseCategory,
  EXPENSE_CATEGORIES,
  SupportedCurrency,
  BudgetCategory,
} from '../types';
import { Translations } from '../services/translations';
import {
  CURRENCIES,
  convertCurrency,
  formatCurrency,
} from '../services/currency';

interface SetBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateBudget: (category: ExpenseCategory, newLimit: number) => void;
  currency: SupportedCurrency;
  ratesToIDR?: Record<SupportedCurrency, number>;
  language: 'id' | 'en';
  t: Translations;
  budgets?: BudgetCategory[];
  initialCategory?: ExpenseCategory | null;
}

export const SetBudgetModal: React.FC<SetBudgetModalProps> = ({
  isOpen,
  onClose,
  onUpdateBudget,
  currency,
  ratesToIDR,
  language,
  t,
  budgets = [],
  initialCategory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>(
    initialCategory || 'Dining & Food'
  );
  const [limitAmount, setLimitAmount] = useState<string>('');
  const [presetApplied, setPresetApplied] = useState(false);

  const currentCurrency = CURRENCIES[currency] || CURRENCIES.IDR;

  // Whenever modal opens or selected category changes, load its current or recommended limit
  useEffect(() => {
    if (!isOpen) return;

    const targetCat = initialCategory || selectedCategory;
    setSelectedCategory(targetCat);

    const existing = budgets.find((b) => b.category === targetCat);
    const baseIdrAmount = existing ? existing.monthlyLimit : 2500000;
    const converted = convertCurrency(
      baseIdrAmount,
      'IDR',
      currency,
      ratesToIDR
    );
    // Round cleanly: for IDR to nearest 50,000, for foreign to whole integer or 2 decimals
    const rounded =
      currency === 'IDR'
        ? Math.round(converted / 10000) * 10000
        : Math.round(converted);
    setLimitAmount(String(rounded));
  }, [
    isOpen,
    selectedCategory,
    initialCategory,
    budgets,
    currency,
    ratesToIDR,
  ]);

  if (!isOpen) return null;

  const handleCategoryChange = (cat: ExpenseCategory) => {
    setSelectedCategory(cat);
    const existing = budgets.find((b) => b.category === cat);
    const baseIdrAmount = existing ? existing.monthlyLimit : 2000000;
    const converted = convertCurrency(
      baseIdrAmount,
      'IDR',
      currency,
      ratesToIDR
    );
    const rounded =
      currency === 'IDR'
        ? Math.round(converted / 10000) * 10000
        : Math.round(converted);
    setLimitAmount(String(rounded));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(limitAmount);
    if (!isNaN(val) && val > 0) {
      // Convert entered limit in active currency back to canonical base IDR
      const idrLimit = Math.round(
        convertCurrency(val, currency, 'IDR', ratesToIDR)
      );
      onUpdateBudget(selectedCategory, idrLimit);
      onClose();
    }
  };

  const handleApplyDefaults = () => {
    // All 10 official categories covered
    const defaultCategories: { cat: ExpenseCategory; idrAmount: number }[] = [
      { cat: 'Dining & Food', idrAmount: 2500000 },
      { cat: 'Groceries', idrAmount: 3500000 },
      { cat: 'Shopping & Retail', idrAmount: 1500000 },
      { cat: 'Utilities & Bills', idrAmount: 1200000 },
      { cat: 'Travel & Transportation', idrAmount: 1000000 },
      { cat: 'Entertainment & Subscriptions', idrAmount: 500000 },
      { cat: 'Health & Wellness', idrAmount: 800000 },
      { cat: 'Financial & Fees', idrAmount: 200000 },
      { cat: 'Housing & Rent', idrAmount: 5000000 },
      { cat: 'Other', idrAmount: 1000000 },
    ];

    defaultCategories.forEach((item) => {
      onUpdateBudget(item.cat, item.idrAmount);
    });

    setPresetApplied(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div
      id="set-budget-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="set-budget-modal-container"
        className="w-full max-w-md rounded-2xl bg-[#0F172A] border border-white/20 shadow-2xl overflow-hidden text-white animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#1E293B]/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2251FF]/20 border border-[#6FE0FF]/30 flex items-center justify-center text-[#6FE0FF]">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                {language === 'id'
                  ? 'Atur Batas Anggaran'
                  : 'Set Budget Target'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === 'id'
                  ? 'Kendalikan pengeluaran per kategori'
                  : 'Manage spending caps by category'}
              </p>
            </div>
          </div>
          <button
            id="close-set-budget-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5">
          {/* Quick Preset Banner */}
          <div className="p-3 rounded-xl bg-[#2251FF]/10 border border-[#2251FF]/30 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-4 h-4 text-[#6FE0FF] shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">
                  {language === 'id'
                    ? 'Konfigurasi Otomatis (10 Kategori)'
                    : 'Auto-Configure (All 10 Categories)'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {language === 'id'
                    ? 'Terapkan rekomendasi batas seimbang'
                    : 'Apply balanced targets calibrated for standard living'}
                </p>
              </div>
            </div>
            <button
              id="btn-apply-all-default-budgets"
              type="button"
              onClick={handleApplyDefaults}
              disabled={presetApplied}
              className="px-3 py-1.5 rounded-lg bg-[#2251FF] hover:bg-[#1A41CC] disabled:bg-emerald-600 text-[11px] font-bold text-white transition-all shrink-0 cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              {presetApplied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{language === 'id' ? 'Terapkan' : 'Applied'}</span>
                </>
              ) : (
                <span>
                  {language === 'id' ? 'Terapkan Semua' : 'Apply All'}
                </span>
              )}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4">
            {/* Category Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                {language === 'id' ? 'Pilih Kategori' : 'Select Category'}
              </label>
              <select
                id="budget-category-select"
                value={selectedCategory}
                onChange={(e) =>
                  handleCategoryChange(e.target.value as ExpenseCategory)
                }
                style={{ colorScheme: 'dark', backgroundColor: '#0A1120' }}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0A1120] border border-white/20 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#6FE0FF] [&>option]:bg-[#0A1120] [&>option]:text-white"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option
                    key={cat}
                    value={cat}
                    className="bg-[#0A1120] text-white"
                  >
                    {t.categories[cat] || cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Monthly Limit Amount */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 block">
                  {language === 'id'
                    ? `Batas Bulanan (${currentCurrency.code})`
                    : `Monthly Limit (${currentCurrency.code})`}
                </label>
                {currency !== 'IDR' && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    ≈ IDR{' '}
                    {formatCurrency(
                      convertCurrency(
                        parseFloat(limitAmount) || 0,
                        currency,
                        'IDR',
                        ratesToIDR
                      ),
                      'IDR'
                    )}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                  {currentCurrency.symbol}
                </span>
                <input
                  id="budget-limit-amount-input"
                  type="number"
                  min="1"
                  step="any"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  placeholder={currency === 'IDR' ? '2500000' : '150'}
                  required
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#0A1120] border border-white/20 text-xs font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#6FE0FF]"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-end space-x-2">
              <button
                id="cancel-set-budget-btn"
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                {t.modals.cancel}
              </button>
              <button
                id="submit-set-budget-btn"
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#2251FF] hover:bg-[#1267D5] text-white text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
              >
                {language === 'id' ? 'Simpan Target' : 'Save Target'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
