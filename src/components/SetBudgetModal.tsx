import React, { useState } from 'react';
import { ExpenseCategory, EXPENSE_CATEGORIES } from '../types';
import {
  SupportedCurrency,
  CURRENCIES,
  formatCurrency,
  convertCurrency,
  DEFAULT_EXCHANGE_RATE_DB,
} from '../services/currency';
import { Translations } from '../services/translations';
import { Target, X, Plus, Check } from 'lucide-react';

interface SetBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateBudget: (category: ExpenseCategory, idrLimit: number) => void;
  currency: SupportedCurrency;
  ratesToIDR?: Record<SupportedCurrency, number>;
  language: 'id' | 'en';
  t: Translations;
}

export const SetBudgetModal: React.FC<SetBudgetModalProps> = ({
  isOpen,
  onClose,
  onUpdateBudget,
  currency,
  ratesToIDR = DEFAULT_EXCHANGE_RATE_DB.ratesToIDR,
  language,
  t,
}) => {
  const [selectedCategory, setSelectedCategory] =
    useState<ExpenseCategory>('Utilities & Bills');
  const [limitAmount, setLimitAmount] = useState<string>('2000000');
  const [presetApplied, setPresetApplied] = useState(false);

  if (!isOpen) return null;

  const currentCurrency = CURRENCIES[currency] || CURRENCIES.IDR;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(limitAmount);
    if (!isNaN(val) && val > 0) {
      // Convert entered limit in active currency to base IDR
      const idrLimit = convertCurrency(val, currency, 'IDR', ratesToIDR);
      onUpdateBudget(selectedCategory, idrLimit);
      onClose();
    }
  };

  const handleApplyDefaults = () => {
    const defaultCategories: { cat: ExpenseCategory; idrAmount: number }[] = [
      { cat: 'Dining & Food', idrAmount: 3000000 },
      { cat: 'Groceries', idrAmount: 4000000 },
      { cat: 'Shopping & Retail', idrAmount: 2500000 },
      { cat: 'Utilities & Bills', idrAmount: 2000000 },
      { cat: 'Travel & Transportation', idrAmount: 2000000 },
      { cat: 'Entertainment & Subscriptions', idrAmount: 1500000 },
      { cat: 'Health & Wellness', idrAmount: 1000000 },
      { cat: 'Financial & Fees', idrAmount: 2000000 },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-md rounded-2xl p-6 border border-[#A3E2FF]/30 shadow-2xl relative overflow-hidden">
        <div className="glass-content space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-white/10 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-[#2251FF]/20 text-[#6FE0FF] border border-[#6FE0FF]/30">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-editorial tracking-tight">
                  {language === 'id'
                    ? 'Atur Target Anggaran Kategori'
                    : 'Set Category Spending Target'}
                </h3>
                <p className="text-xs text-slate-300">
                  {language === 'id'
                    ? 'Tentukan batas bulanan untuk mengontrol pengeluaran'
                    : 'Establish monthly caps to prevent overspending'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Preset Action */}
          <div className="p-3 rounded-xl bg-[#2251FF]/15 border border-[#2251FF]/30 flex items-center justify-between gap-3">
            <div className="text-xs">
              <p className="font-bold text-white">
                {language === 'id'
                  ? 'Gunakan Batas Standar Rekomendasi'
                  : 'Apply Recommended Category Defaults'}
              </p>
              <p className="text-[10px] text-slate-300">
                {language === 'id'
                  ? 'Otomatis aktifkan target untuk 8 kategori utama'
                  : 'Auto-configure targets for all 8 main categories'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleApplyDefaults}
              className="px-3 py-1.5 rounded-xl bg-[#2251FF] hover:bg-[#1267D5] text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs flex items-center space-x-1"
            >
              {presetApplied ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>{presetApplied ? 'Applied!' : 'Apply All'}</span>
            </button>
          </div>

          {/* Custom Form */}
          <form onSubmit={handleSave} className="space-y-4">
            {/* Category Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                {language === 'id' ? 'Pilih Kategori' : 'Category'}
              </label>
              <select
                value={selectedCategory}
                onChange={(e) =>
                  setSelectedCategory(e.target.value as ExpenseCategory)
                }
                className="w-full px-3 py-2.5 rounded-xl bg-[#0A1120] border border-white/20 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#6FE0FF]"
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
              <label className="text-xs font-bold text-slate-300 block">
                {language === 'id'
                  ? `Batas Anggaran Bulanan (${currentCurrency.code})`
                  : `Monthly Limit (${currentCurrency.code})`}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                  {currentCurrency.symbol}
                </span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  placeholder="2000000"
                  required
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#0A1120] border border-white/20 text-xs font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#6FE0FF]"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                {t.modals.cancel}
              </button>
              <button
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
