import React, { useState, useEffect } from 'react';
import { Expense, BankAccount, ExpenseCategory } from '../types';
import { SupportedCurrency, CURRENCIES } from '../services/currency';
import { Translations } from '../services/translations';
import { X, Edit2, Trash2 } from 'lucide-react';

interface EditExpenseModalProps {
  expense: Expense | null;
  onClose: () => void;
  onSave: (updated: Expense) => void;
  onDelete?: (expenseId: string) => void;
  accounts: BankAccount[];
  currency: SupportedCurrency;
  language?: 'en' | 'id';
  t: Translations;
}

const CATEGORIES: ExpenseCategory[] = [
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

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  expense,
  onClose,
  onSave,
  onDelete,
  accounts,
  currency: defaultCurrency,
  language = 'id',
  t,
}) => {
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] =
    useState<SupportedCurrency>(defaultCurrency);
  const [category, setCategory] = useState<ExpenseCategory>('Dining & Food');
  const [date, setDate] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (expense) {
      setMerchant(expense.merchant);
      setAmount(expense.amount.toString());
      setSelectedCurrency(
        (expense.currency as SupportedCurrency) || defaultCurrency
      );
      setCategory(expense.category);
      setDate(expense.date);
      setBankAccountId(expense.bankAccountId || '');
      setIsRecurring(expense.isRecurring);
      setNotes(expense.notes || '');
      setErrorMsg('');
    }
  }, [expense, defaultCurrency]);

  if (!expense) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg(
        language === 'id'
          ? 'Silakan masukkan jumlah nominal yang valid (lebih dari 0).'
          : 'Please enter a valid amount greater than 0.'
      );
      return;
    }

    const matchedAccount = accounts.find((a) => a.id === bankAccountId);
    const updatedBankAccountId = bankAccountId
      ? matchedAccount?.id || bankAccountId
      : undefined;
    const updatedBankAccountName = matchedAccount
      ? `${matchedAccount.name} (${matchedAccount.accountNumberMask})`
      : bankAccountId
        ? expense.bankAccountName
        : undefined;

    onSave({
      ...expense,
      merchant: merchant.trim() || expense.merchant,
      amount: numAmount,
      currency: selectedCurrency,
      category,
      date,
      bankAccountId: updatedBankAccountId,
      bankAccountName: updatedBankAccountName,
      isRecurring,
      notes: notes.trim(),
      verifiedByUser: true,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="glass-modal rounded-2xl max-w-lg w-full p-6 text-white shadow-[0_16px_48px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-150 transition-colors">
        <div className="glass-content">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-[#F0F4F8] dark:bg-[#163354] text-[#2251FF] dark:text-[#38BDF8] shrink-0 shadow-2xs">
                <Edit2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-[#051C2C] dark:text-white tracking-tight font-editorial truncate">
                  {t.modals.editExpenseTitle}
                </h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400 truncate">
                  {language === 'id'
                    ? 'Ubah kategori, jumlah nominal, atau sumber rekening'
                    : 'Modify category, amount, or payment source'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#051C2C] dark:hover:text-white hover:bg-[#F0F4F8] dark:hover:bg-[#163354] transition-colors cursor-pointer shrink-0 ml-3"
              title="Close"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#051C2C] dark:text-slate-200 block mb-1">
                  {t.modals.merchantLabel}:
                </label>
                <input
                  type="text"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#F8F9FA] dark:bg-[#0A1C30] border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-lg text-xs text-[#051C2C] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2251FF]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#051C2C] dark:text-slate-200 block mb-1">
                  {language === 'id'
                    ? 'Nominal & Mata Uang:'
                    : 'Amount & Currency:'}
                </label>
                <div className="flex space-x-1.5">
                  <select
                    value={selectedCurrency}
                    onChange={(e) =>
                      setSelectedCurrency(e.target.value as SupportedCurrency)
                    }
                    style={{ colorScheme: 'dark', backgroundColor: '#071524' }}
                    className="px-2 py-2 bg-[#071524] border border-white/20 rounded-lg text-xs font-bold text-[#38BDF8] focus:outline-none focus:ring-1 focus:ring-[#38BDF8] shrink-0 [&>option]:bg-[#071524] [&>option]:text-white"
                  >
                    {(Object.keys(CURRENCIES) as SupportedCurrency[]).map(
                      (code) => (
                        <option
                          key={code}
                          value={code}
                          className="bg-[#071524] text-white"
                        >
                          {CURRENCIES[code].symbol} {code}
                        </option>
                      )
                    )}
                  </select>
                  <input
                    id="edit-expense-amount-input"
                    type="number"
                    step="any"
                    min="0"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    required
                    placeholder="0"
                    className="w-full px-3 py-2 bg-[#071524] border border-white/20 rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#38BDF8]"
                  />
                </div>
                {errorMsg && (
                  <p className="text-[11px] text-rose-400 mt-1 font-medium">
                    {errorMsg}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1">
                  {t.modals.categoryLabel}:
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as ExpenseCategory)
                  }
                  style={{ colorScheme: 'dark', backgroundColor: '#071524' }}
                  className="w-full px-3 py-2 bg-[#071524] border border-white/20 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#38BDF8] [&>option]:bg-[#071524] [&>option]:text-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option
                      key={cat}
                      value={cat}
                      className="bg-[#071524] text-white"
                    >
                      {t.categories[cat] || cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1">
                  {t.modals.dateLabel}:
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="w-full px-3 py-2 bg-[#071524] border border-white/20 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#38BDF8]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-200 block mb-1">
                {t.modals.bankAccountLabel}:
              </label>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                style={{ colorScheme: 'dark', backgroundColor: '#071524' }}
                className="w-full px-3 py-2 bg-[#071524] border border-white/20 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#38BDF8] [&>option]:bg-[#071524] [&>option]:text-white"
              >
                <option value="" className="bg-[#071524] text-white">
                  {language === 'id'
                    ? '(Tanpa Rekening Terhubung)'
                    : '(No Linked Account)'}
                </option>
                {accounts.map((acc) => (
                  <option
                    key={acc.id}
                    value={acc.id}
                    className="bg-[#071524] text-white"
                  >
                    {acc.name} ({acc.accountNumberMask})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#051C2C] dark:text-slate-200 block mb-1">
                {t.modals.notesLabel}:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  language === 'id'
                    ? 'Contoh: Pembelian operasional'
                    : 'e.g. Operational purchase'
                }
                className="w-full px-3 py-2 bg-[#F8F9FA] dark:bg-[#0A1C30] border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-lg text-xs text-[#051C2C] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2251FF]"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="edit-is-recurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="rounded border-[#CBD5E1] dark:border-[#1E3A5F] text-[#2251FF] focus:ring-[#2251FF]"
              />
              <label
                htmlFor="edit-is-recurring"
                className="text-xs text-slate-700 dark:text-slate-300 select-none cursor-pointer"
              >
                {t.modals.recurringCheck}
              </label>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div>
                {onDelete && expense && (
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(expense.id);
                      onClose();
                    }}
                    className="px-3 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.feed.delete}</span>
                  </button>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 dark:bg-[#112842] hover:bg-slate-200 dark:hover:bg-[#163354] text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {t.modals.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2251FF] hover:bg-[#1267D5] text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  {t.modals.save}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
