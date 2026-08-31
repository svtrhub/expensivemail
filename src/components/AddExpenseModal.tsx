import React, { useState, useEffect } from 'react';
import {
  Expense,
  BankAccount,
  ExpenseCategory,
  EXPENSE_CATEGORIES,
} from '../types';
import {
  SupportedCurrency,
  CURRENCIES,
  formatCurrency,
  formatPresetLabel,
} from '../services/currency';
import { Translations, LanguageCode } from '../services/translations';
import {
  Plus,
  Sparkles,
  Zap,
  RotateCcw,
  Check,
  Minus,
  UtensilsCrossed,
  ShoppingBag,
  ShoppingCart,
  Zap as ZapIcon,
  Car,
  Tv,
  HeartPulse,
  Landmark,
  Home,
  Layers,
  Coins,
} from 'lucide-react';
import { Dialog } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onParseEmailText: (text: string) => Promise<void>;
  isParsing: boolean;
  accounts: BankAccount[];
  currency: SupportedCurrency;
  language?: LanguageCode;
  t: Translations;
}

const CATEGORIES: { name: ExpenseCategory; icon: any; color: string }[] = [
  { name: 'Dining & Food', icon: UtensilsCrossed, color: '#F97316' },
  { name: 'Groceries', icon: ShoppingBag, color: '#10B981' },
  { name: 'Shopping & Retail', icon: ShoppingCart, color: '#6366F1' },
  { name: 'Utilities & Bills', icon: ZapIcon, color: '#EAB308' },
  { name: 'Travel & Transportation', icon: Car, color: '#3B82F6' },
  { name: 'Entertainment & Subscriptions', icon: Tv, color: '#EC4899' },
  { name: 'Health & Wellness', icon: HeartPulse, color: '#14B8A6' },
  { name: 'Financial & Fees', icon: Landmark, color: '#8B5CF6' },
  { name: 'Housing & Rent', icon: Home, color: '#F43F5E' },
  { name: 'Other', icon: Layers, color: '#64748B' },
];

const COMMON_MERCHANTS_IDR = [
  { name: 'GoFood / GrabFood', category: 'Dining & Food' as ExpenseCategory },
  {
    name: 'Kopi Kenangan / Janji Jiwa',
    category: 'Dining & Food' as ExpenseCategory,
  },
  { name: 'Indomaret / Alfamart', category: 'Groceries' as ExpenseCategory },
  {
    name: 'Tokopedia / Shopee',
    category: 'Shopping & Retail' as ExpenseCategory,
  },
  {
    name: 'PLN / PDAM / Telkom',
    category: 'Utilities & Bills' as ExpenseCategory,
  },
  {
    name: 'Pertamina / Shell',
    category: 'Travel & Transportation' as ExpenseCategory,
  },
];

const COMMON_MERCHANTS_USD = [
  { name: 'Starbucks / Coffee', category: 'Dining & Food' as ExpenseCategory },
  {
    name: 'Uber / Lyft',
    category: 'Travel & Transportation' as ExpenseCategory,
  },
  {
    name: 'Amazon / Walmart',
    category: 'Shopping & Retail' as ExpenseCategory,
  },
  {
    name: 'Netflix / Spotify / Apple',
    category: 'Entertainment & Subscriptions' as ExpenseCategory,
  },
];

const TEMPLATE_RECEIPTS = [
  {
    id: 'bca_qris',
    label: 'BCA QRIS Notification',
    text: 'Dari: alert@bca.co.id\nSubjek: Notifikasi Pembayaran QRIS\nIsi: M-BCA: Pembayaran QRIS senilai Rp 85.000 di KOPI KENANGAN telah berhasil pada 24/10/2024 14:30 WIB.',
  },
  {
    id: 'mandiri_debit',
    label: 'Livin Mandiri Debit',
    text: 'Dari: livin@bankmandiri.co.id\nSubjek: Notifikasi Transaksi Debit Mandiri\nIsi: Kartu Debit *4491 berhasil digunakan transaksi senilai IDR 320.000 di INDOMARET HYBRID.',
  },
  {
    id: 'go-pay_gofood',
    label: 'GoPay / GoJek Receipt',
    text: 'Dari: no-reply@gojek.com\nSubjek: Bukti Pembayaran GoFood\nIsi: Pesanan GoFood di HokBen senilai Rp 112.500 telah berhasil dibayar menggunakan Saldo GoPay.',
  },
  {
    id: 'bni_wondr',
    label: 'wondr by BNI',
    text: 'Dari: transaction@bni.co.id\nSubjek: Transaksi wondr Debit\nIsi: Anda telah melakukan transaksi QRIS sebesar IDR 45.000 di KOPI TUKU.',
  },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onAddExpense,
  onParseEmailText,
  isParsing,
  accounts,
  currency,
  language = 'id',
  t,
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'paste_receipt'>(
    'manual'
  );
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Dining & Food');
  const [type, setType] = useState<'debit' | 'credit'>('debit');
  const [date, setDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [bankAccountId, setBankAccountId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [notes, setNotes] = useState('');
  const [pasteText, setPasteText] = useState('');

  useEffect(() => {
    if (isOpen && accounts.length > 0 && !bankAccountId) {
      setBankAccountId(accounts[0].id);
    }
  }, [isOpen, accounts, bankAccountId]);

  const currentCurrencyConfig = CURRENCIES[currency] || CURRENCIES.IDR;
  const presetAmounts = currentCurrencyConfig.presets;
  const commonMerchants =
    currency === 'IDR' ? COMMON_MERCHANTS_IDR : COMMON_MERCHANTS_USD;

  const handleAddPreset = (val: number) => {
    const current = parseFloat(amount) || 0;
    const newTotal =
      currency === 'IDR'
        ? Math.round(current + val)
        : parseFloat((current + val).toFixed(2));
    setAmount(newTotal.toString());
  };

  const handleClearAmount = () => {
    setAmount('');
  };

  const handleSelectMerchant = (m: {
    name: string;
    category: ExpenseCategory;
  }) => {
    setMerchant(m.name);
    setCategory(m.category);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    const matchedAccount = accounts.find((a) => a.id === bankAccountId);

    onAddExpense({
      title: `${merchant || 'Manual'} ${type === 'debit' ? 'Expense' : 'Income'}`,
      merchant: merchant.trim() || 'Manual Expense',
      amount: parsedAmount,
      currency: currency,
      category,
      date,
      type,
      bankAccountId: matchedAccount?.id,
      bankAccountName: matchedAccount
        ? `${matchedAccount.name} (${matchedAccount.accountNumberMask})`
        : 'Manual Cash',
      paymentMethod:
        matchedAccount?.name ||
        (currency === 'IDR' ? 'Tunai / QRIS' : 'Manual Cash'),
      confidenceScore: 1.0,
      isRecurring,
      recurringFrequency: isRecurring ? 'monthly' : undefined,
      notes: notes.trim(),
      tags: [category.toLowerCase().split(' ')[0]],
      source: 'manual_entry',
      verifiedByUser: true,
    });

    onClose();
  };

  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteText.trim()) return;
    await onParseEmailText(pasteText);
    setPasteText('');
    onClose();
  };

  const numAmount = parseFloat(amount) || 0;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={t.modals.addExpenseTitle}
      description={t.modals.addExpenseSubtitle}
      maxWidth="lg"
    >
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-4 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-2 text-xs font-bold transition-colors border-b-2 text-center cursor-pointer flex items-center justify-center space-x-1.5 ${
            activeTab === 'manual'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>{t.modals.manualTab}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('paste_receipt')}
          className={`flex-1 py-2 text-xs font-bold transition-colors border-b-2 text-center cursor-pointer flex items-center justify-center space-x-1.5 ${
            activeTab === 'paste_receipt'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{t.modals.pasteTab}</span>
        </button>
      </div>

      {activeTab === 'manual' ? (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          {/* Amount Input with Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t.modals.chooseAmount} ({currentCurrencyConfig.code}):
              </label>
              {numAmount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAmount}
                  className="text-[11px] text-red-500 hover:underline font-semibold cursor-pointer"
                >
                  Reset Amount
                </button>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 dark:text-slate-500 text-base">
                {currentCurrencyConfig.symbol}
              </span>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#0A1C30] border border-slate-300 dark:border-slate-700 rounded-xl text-xl font-bold font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 tabular-nums"
              />
            </div>

            {/* Currency Quick Add Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAddPreset(preset)}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer tabular-nums"
                >
                  +{formatPresetLabel(preset, currency)}
                </button>
              ))}
            </div>
          </div>

          {/* Merchant & Category Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={t.modals.merchantLabel}
              placeholder="e.g. Starbucks, Indomaret, Netflix"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              required
            />

            <Select
              label={t.modals.categoryLabel}
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Common Quick Merchants Selector */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Quick Merchant Presets:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {commonMerchants.map((m) => (
                <button
                  key={m.name}
                  type="button"
                  onClick={() => handleSelectMerchant(m)}
                  className="text-[11px] px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Account & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label={t.modals.bankAccountLabel}
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.accountNumberMask}) - {acc.institution}
                </option>
              ))}
            </Select>

            <Input
              label={t.modals.dateLabel}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Type & Recurring Options */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Type:
              </label>
              <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setType('debit')}
                  className={`px-3 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                    type === 'debit'
                      ? 'bg-red-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType('credit')}
                  className={`px-3 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                    type === 'credit'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Income
                </button>
              </div>
            </div>

            <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Recurring / Subscription</span>
            </label>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={onClose}>
              {t.modals.cancel}
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={!amount || numAmount <= 0}
            >
              <Check className="w-4 h-4 text-white" />
              <span>
                {t.modals.saveExpense} ({formatCurrency(numAmount, currency)})
              </span>
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handlePasteSubmit} className="space-y-4">
          <div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Template Receipt Samples:
            </span>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {TEMPLATE_RECEIPTS.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setPasteText(tmpl.text)}
                  className="text-[11px] px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                >
                  {tmpl.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              {language === 'id'
                ? 'Teks Struk / Email Notifikasi:'
                : 'Receipt Text / Notification Body:'}
            </label>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={
                language === 'id'
                  ? 'Contoh: Dari: alert@bca.co.id\nSubjek: Transaksi Debit Rp 150.000 di SPBU PERTAMINA pada kartu 8821'
                  : 'e.g. From: alert@bank.com\nSubject: Debit transaction of $45.00 at Starbucks'
              }
              rows={6}
              required
              className="w-full p-3 bg-white dark:bg-[#0A1C30] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={onClose}>
              {t.modals.cancel}
            </Button>
            <Button
              type="submit"
              disabled={isParsing || !pasteText.trim()}
              isLoading={isParsing}
              leftIcon={<Sparkles className="w-4 h-4 text-amber-400" />}
            >
              {isParsing
                ? language === 'id'
                  ? 'Memindai AI...'
                  : 'Parsing AI...'
                : language === 'id'
                  ? 'Pindai & Simpan'
                  : 'Parse & Save'}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
};
