import React, { useState, useEffect } from 'react';
import {
  Expense,
  AnomalyRecord,
  ExpenseCategory,
  EXPENSE_CATEGORIES,
  SupportedCurrency,
  BlacklistedEmailRule,
} from '../types';
import { formatCurrency, convertCurrency } from '../services/currency';
import { LanguageCode } from '../services/translations';
import {
  AlertTriangle,
  Wrench,
  Tag,
  DollarSign,
  Users,
  CheckCircle2,
  Trash2,
  X,
  ShieldCheck,
  Check,
  Mail,
  Receipt,
  Calendar,
  Building2,
  CreditCard,
  ArrowUpRight,
  Ban,
  ShieldAlert,
  FileX,
} from 'lucide-react';

interface FixAnomalyModalProps {
  isOpen: boolean;
  onClose: () => void;
  anomaly: AnomalyRecord | null;
  expense: Expense | null;
  currency: SupportedCurrency;
  ratesToIDR: Record<SupportedCurrency, number>;
  language: LanguageCode;
  onUpdateExpense: (updatedExpense: Expense) => void;
  onSplitExpense: (
    originalExpenseId: string,
    userShare: number,
    splitDescription: string
  ) => void;
  onDismissAnomaly: (expenseId: string) => void;
  onDeleteExpense: (expenseId: string) => void;
  onFlagFalsePositive?: (
    expense: Expense,
    blacklistRule?: BlacklistedEmailRule
  ) => void;
}

type QuickTab = 'verify' | 'reclassify' | 'amount' | 'split' | 'false_positive';

export const FixAnomalyModal: React.FC<FixAnomalyModalProps> = ({
  isOpen,
  onClose,
  anomaly,
  expense,
  currency,
  ratesToIDR,
  language,
  onUpdateExpense,
  onSplitExpense,
  onDismissAnomaly,
  onDeleteExpense,
  onFlagFalsePositive,
}) => {
  const [activeTab, setActiveTab] = useState<QuickTab>('verify');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>(
    expense?.category || 'Dining & Food'
  );
  const [customAmount, setCustomAmount] = useState<string>(
    expense?.amount ? expense.amount.toString() : '0'
  );
  const [splitPeople, setSplitPeople] = useState<number>(2);
  const [customShare, setCustomShare] = useState<string>(
    expense?.amount ? Math.round(expense.amount / 2).toString() : '0'
  );
  const [verificationNote, setVerificationNote] = useState<string>(
    'Pengeluaran khusus / Jamuan resmi yang sah'
  );
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false);
  const [blacklistScope, setBlacklistScope] = useState<
    'subject_and_sender' | 'sender_only' | 'email_id_only'
  >('subject_and_sender');
  const [customBlacklistReason, setCustomBlacklistReason] = useState<string>(
    'Bukan transaksi / Penawaran promo palsu'
  );

  useEffect(() => {
    if (expense) {
      setSelectedCategory(expense.category);
      setCustomAmount(expense.amount.toString());
      setCustomShare(Math.round(expense.amount / 2).toString());
      setIsConfirmingDelete(false);
      setCustomBlacklistReason(
        language === 'id'
          ? 'Bukan transaksi / Penawaran promo diskon'
          : 'False positive receipt / Promotional offer'
      );
    }
  }, [expense, language]);

  if (!isOpen || !expense || !anomaly) return null;

  const convertedOriginal = convertCurrency(
    expense.amount,
    (expense.currency as SupportedCurrency) || 'IDR',
    currency,
    ratesToIDR
  );

  const convertedCategoryAvg = anomaly.categoryAverage;

  // 1. One-Click: Mark Legitimate / Verified
  const handleQuickVerify = () => {
    onUpdateExpense({
      ...expense,
      isAmountAnomaly: false,
      notes: expense.notes
        ? `${expense.notes} • [Terverifikasi Sah: ${verificationNote}]`
        : `[Terverifikasi Sah: ${verificationNote}]`,
    });
    onDismissAnomaly(expense.id);
    if (anomaly.expenseId && anomaly.expenseId !== expense.id) {
      onDismissAnomaly(anomaly.expenseId);
    }
    if (expense.emailId) {
      onDismissAnomaly(expense.emailId);
    }
    onClose();
  };

  // 2. One-Click: Reclassify Category
  const handleApplyCategory = (cat: ExpenseCategory) => {
    onUpdateExpense({
      ...expense,
      category: cat,
      notes: expense.notes
        ? `${expense.notes} (Kategori disesuaikan ke ${cat})`
        : `Kategori disesuaikan ke ${cat}`,
    });
    onDismissAnomaly(expense.id);
    onClose();
  };

  // 3. One-Click: Adjust Amount
  const handleSaveAmount = () => {
    const parsed = parseFloat(customAmount);
    if (isNaN(parsed) || parsed <= 0) return;

    onUpdateExpense({
      ...expense,
      amount: parsed,
      notes: expense.notes
        ? `${expense.notes} (Nominal dikoreksi dari ${expense.amount} ke ${parsed})`
        : `(Nominal dikoreksi dari ${expense.amount} ke ${parsed})`,
    });
    onDismissAnomaly(expense.id);
    onClose();
  };

  // 4. One-Click: Split Bill
  const handleApplySplit = () => {
    const parsed = parseFloat(customShare);
    if (isNaN(parsed) || parsed <= 0 || parsed > expense.amount) return;

    onSplitExpense(
      expense.id,
      parsed,
      `Patungan ${splitPeople} orang — Bagian pribadi`
    );
    onDismissAnomaly(expense.id);
    onClose();
  };

  // 5. Flag as False Positive / Block Email Rule
  const handleFlagAsFalsePositive = () => {
    let pattern =
      expense.emailMetadata?.subject || expense.title || expense.merchant || '';
    let matchField: 'sender' | 'subject' | 'any' | 'emailId' = 'any';

    if (blacklistScope === 'sender_only' && expense.emailMetadata?.sender) {
      pattern = expense.emailMetadata.sender;
      matchField = 'sender';
    } else if (
      blacklistScope === 'email_id_only' &&
      (expense.emailId || expense.id)
    ) {
      pattern = expense.emailId || expense.id;
      matchField = 'emailId';
    } else {
      // Default: match subject or merchant
      pattern =
        expense.emailMetadata?.subject ||
        expense.title ||
        expense.merchant ||
        '';
      matchField = 'subject';
    }

    const newRule: BlacklistedEmailRule = {
      id: `bl_${Date.now()}`,
      pattern: pattern.trim(),
      matchField,
      reason: customBlacklistReason.trim() || 'False receipt / promo',
      createdAt: new Date().toISOString(),
      enabled: true,
    };

    if (onFlagFalsePositive) {
      onFlagFalsePositive(expense, newRule);
    } else {
      // Fallback: Delete expense & dismiss anomaly
      onDeleteExpense(expense.id);
      onDismissAnomaly(expense.id);
    }

    onClose();
  };

  // 6. Delete Transaction
  const handleExecuteDelete = () => {
    onDeleteExpense(expense.id);
    onDismissAnomaly(expense.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="fix-anomaly-modal"
        className="glass-modal rounded-2xl max-w-xl w-full max-h-[94vh] overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.6)] border border-amber-500/30 flex flex-col transition-colors text-white"
      >
        <div className="glass-content flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Modal Header - Prioritizing Email Name & Recorded Transaction Amount */}
          <div className="bg-[#051C2C] dark:bg-[#081827] text-white p-4 sm:p-5 border-b border-white/10 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3 min-w-0 flex-1">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5 shadow-2xs">
                  <Mail className="w-5 h-5 text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 tracking-wider">
                      {language === 'id'
                        ? 'Lonjakan Anomali'
                        : 'Anomaly Detected'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      +{Math.round(anomaly.percentageAboveAverage)}% (
                      {anomaly.multiplier.toFixed(1)}x)
                    </span>
                    {expense.category && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#163354] text-[#93C5FD] border border-[#2A486F]">
                        {expense.category}
                      </span>
                    )}
                  </div>

                  {/* PRIMARY FOCUS 1: Email Name / Subject */}
                  <h3 className="text-base sm:text-lg font-bold font-editorial text-white tracking-tight mt-1.5 break-words">
                    {expense.title ||
                      expense.merchant ||
                      (language === 'id'
                        ? 'Transaksi Email'
                        : 'Email Transaction')}
                  </h3>

                  {/* Subtitle with Sender / Merchant & Date */}
                  <div className="flex items-center space-x-2 text-xs text-slate-300 mt-0.5 flex-wrap">
                    {expense.merchant && (
                      <span className="font-semibold text-amber-200">
                        {expense.merchant}
                      </span>
                    )}
                    {expense.emailMetadata?.sender &&
                      expense.emailMetadata.sender !== expense.merchant && (
                        <span className="text-slate-400 truncate max-w-xs">
                          &lt;{expense.emailMetadata.sender}&gt;
                        </span>
                      )}
                    <span className="text-slate-400 font-mono text-[11px]">
                      •{' '}
                      {new Date(expense.date).toLocaleDateString(
                        language === 'id' ? 'id-ID' : 'en-US',
                        { day: 'numeric', month: 'short', year: 'numeric' }
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                title="Close"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PRIMARY FOCUS 2: Recorded Transaction Amount Banner */}
            <div className="mt-3.5 pt-3 border-t border-[#1E3A5F]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-black/25 p-3 rounded-xl border border-white/10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {language === 'id'
                    ? 'Nominal Transaksi Dicatat'
                    : 'Recorded Transaction Amount'}
                </p>
                <p className="text-lg sm:text-xl font-mono font-extrabold text-[#60A5FA] tracking-tight">
                  {formatCurrency(convertedOriginal, currency)}
                </p>
              </div>

              <div className="flex items-center space-x-2 text-xs bg-[#0D2238] px-3 py-1.5 rounded-lg border border-[#1E3A5F]">
                <div className="text-right">
                  <p className="text-[10px] text-slate-400">
                    {language === 'id'
                      ? `Rata-rata ${expense.category}`
                      : `Avg ${expense.category}`}
                  </p>
                  <p className="font-mono font-bold text-slate-200 text-xs">
                    {formatCurrency(convertedCategoryAvg, currency)}
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-rose-400 shrink-0" />
              </div>
            </div>
          </div>

          {/* Diagnosis Card */}
          <div className="bg-amber-500/10 dark:bg-amber-950/20 border-b border-amber-500/20 p-3 sm:p-3.5 text-xs transition-colors">
            <div className="flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-[#051C2C] dark:text-amber-100 text-xs">
                  {anomaly.reason}
                </p>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  {language === 'id'
                    ? 'Pilih salah satu tindakan di bawah ini untuk memverifikasi, mengoreksi, atau mengelompokkan ulang transaksi ini.'
                    : 'Select an action below to verify, adjust, reclassify, or split this transaction.'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Choice Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 border-b border-slate-200 dark:border-[#1E3A5F] bg-[#F8F9FA] dark:bg-[#081827] p-1.5 gap-1 text-center transition-colors">
            <button
              type="button"
              onClick={() => {
                setActiveTab('verify');
                setIsConfirmingDelete(false);
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'verify'
                  ? 'bg-white dark:bg-[#153354] text-[#051C2C] dark:text-white shadow-xs border border-slate-200 dark:border-[#1E3A5F]'
                  : 'text-slate-600 dark:text-[#94A3B8] hover:text-[#051C2C] dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">
                {language === 'id' ? 'Tandai Sah' : 'Verify'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('reclassify');
                setIsConfirmingDelete(false);
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'reclassify'
                  ? 'bg-white dark:bg-[#153354] text-[#051C2C] dark:text-white shadow-xs border border-slate-200 dark:border-[#1E3A5F]'
                  : 'text-slate-600 dark:text-[#94A3B8] hover:text-[#051C2C] dark:hover:text-white'
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-[#2251FF] dark:text-[#38BDF8] shrink-0" />
              <span className="truncate">
                {language === 'id' ? 'Ganti Kategori' : 'Reclassify'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('amount');
                setIsConfirmingDelete(false);
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'amount'
                  ? 'bg-white dark:bg-[#153354] text-[#051C2C] dark:text-white shadow-xs border border-slate-200 dark:border-[#1E3A5F]'
                  : 'text-slate-600 dark:text-[#94A3B8] hover:text-[#051C2C] dark:hover:text-white'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="truncate">
                {language === 'id' ? 'Koreksi Rp' : 'Edit Amount'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('split');
                setIsConfirmingDelete(false);
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'split'
                  ? 'bg-white dark:bg-[#153354] text-[#051C2C] dark:text-white shadow-xs border border-slate-200 dark:border-[#1E3A5F]'
                  : 'text-slate-600 dark:text-[#94A3B8] hover:text-[#051C2C] dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="truncate">
                {language === 'id' ? 'Bagi Tagihan' : 'Split'}
              </span>
            </button>

            {/* TAB 5 BUTTON: Flag False Positive & Block */}
            <button
              type="button"
              id="tab-flag-false-email-btn"
              onClick={() => {
                setActiveTab('false_positive');
                setIsConfirmingDelete(false);
              }}
              className={`col-span-2 sm:col-span-1 py-2 px-2 rounded-xl text-xs font-bold transition-colors flex flex-row items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'false_positive'
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 shadow-xs border border-rose-200 dark:border-rose-800'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/30'
              }`}
            >
              <Ban className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span className="truncate">
                {language === 'id'
                  ? 'Tandai Palsu & Blokir'
                  : 'Flag False & Block'}
              </span>
            </button>
          </div>

          {/* Tab Body Content */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
            {/* TAB 1: 1-CLICK VERIFY & DISMISS */}
            {activeTab === 'verify' && (
              <div className="space-y-3.5 animate-in fade-in">
                <div className="p-3.5 bg-emerald-50/90 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-950 dark:text-emerald-100 transition-colors">
                  <p className="font-semibold text-emerald-900 dark:text-emerald-200 mb-1">
                    {language === 'id'
                      ? 'Transaksi Sah / Jamuan Khusus'
                      : 'Legitimate One-Off Purchase'}
                  </p>
                  <p className="text-emerald-800 dark:text-emerald-300 text-[11px] leading-relaxed">
                    {language === 'id'
                      ? 'Jika transaksi ini memang bernilai besar dan sah (misalnya: dinner keluarga, servis tahunan, atau sewa), klik tombol di bawah untuk mengonfirmasi dan menonaktifkan peringatan anomali ini.'
                      : 'If this expense was intentionally high (e.g. annual service, team dinner, or special event), click below to verify and dismiss this outlier alert.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    {language === 'id'
                      ? 'Catatan Verifikasi (Opsional):'
                      : 'Verification Note (Optional):'}
                  </label>
                  <input
                    type="text"
                    value={verificationNote}
                    onChange={(e) => setVerificationNote(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#0A1C30] border border-slate-300 dark:border-[#1E3A5F] rounded-xl text-xs text-[#051C2C] dark:text-white focus:ring-2 focus:ring-[#2251FF] outline-none"
                    placeholder="e.g. Jamuan makan malam penting / Belanja bulanan besar"
                  />
                </div>

                <button
                  type="button"
                  id="modal-quick-verify-btn"
                  onClick={handleQuickVerify}
                  className="w-full min-h-[46px] py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-[0_2px_10px_rgba(16,185,129,0.35)] hover:shadow-[0_4px_14px_rgba(16,185,129,0.45)] focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                  <span className="text-white font-semibold">
                    {language === 'id'
                      ? '✓ Konfirmasi Sah & Selesaikan Peringatan'
                      : '✓ Confirm Legitimate & Dismiss Alert'}
                  </span>
                </button>
              </div>
            )}

            {/* TAB 2: RECLASSIFY CATEGORY */}
            {activeTab === 'reclassify' && (
              <div className="space-y-3.5 animate-in fade-in">
                <div className="p-3 bg-[#F8F9FA] dark:bg-[#0A1C30] rounded-xl border border-slate-200 dark:border-[#1E3A5F] text-xs text-slate-600 dark:text-slate-300">
                  <p>
                    {language === 'id'
                      ? 'Pilih kategori baru yang lebih sesuai dengan transaksi ini untuk memindahkannya:'
                      : 'Select a better fitting category for this transaction:'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1 border border-slate-200 dark:border-[#1E3A5F] rounded-xl bg-slate-50/50 dark:bg-[#081827]">
                  {EXPENSE_CATEGORIES.map((cat) => {
                    const isCurrent = cat === expense.category;
                    const isSelected = cat === selectedCategory;

                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`p-2.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#2251FF] text-white border-[#2251FF] shadow-xs'
                            : isCurrent
                              ? 'bg-amber-50/90 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-500/40'
                              : 'bg-white dark:bg-[#0B1F35] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#1E3A5F] hover:bg-slate-100 dark:hover:bg-[#112842]'
                        }`}
                      >
                        <span className="truncate">{cat}</span>
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1" />
                        ) : isCurrent ? (
                          <span className="text-[10px] text-amber-700 dark:text-amber-300 shrink-0 font-normal">
                            (Saat ini)
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  id="modal-apply-category-btn"
                  onClick={() => handleApplyCategory(selectedCategory)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#2251FF] hover:bg-[#1267D5] text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span className="text-white">
                    {language === 'id'
                      ? `Pindahkan ke Kategori "${selectedCategory}"`
                      : `Reclassify to "${selectedCategory}"`}
                  </span>
                </button>
              </div>
            )}

            {/* TAB 3: ADJUST AMOUNT */}
            {activeTab === 'amount' && (
              <div className="space-y-3.5 animate-in fade-in">
                <div className="p-3 bg-[#F8F9FA] dark:bg-[#0A1C30] rounded-xl border border-slate-200 dark:border-[#1E3A5F] text-xs text-slate-600 dark:text-slate-300">
                  <p>
                    {language === 'id'
                      ? 'Koreksi nominal jika terdapat kesalahan input atau kelebihan angka nol dari struk/OCR:'
                      : 'Correct transaction amount if there was a typo or OCR parsing error:'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    {language === 'id'
                      ? 'Nominal Sebenarnya:'
                      : 'Corrected Amount:'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
                      {expense.currency || currency}
                    </span>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full pl-14 pr-4 py-2 bg-white dark:bg-[#0A1C30] border border-slate-300 dark:border-[#1E3A5F] rounded-xl text-sm font-bold font-mono text-[#051C2C] dark:text-white focus:ring-2 focus:ring-[#2251FF] outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Quick Math Shortcuts */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mr-1">
                    {language === 'id' ? 'Koreksi Cepat:' : 'Quick Fix:'}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCustomAmount(
                        Math.round(expense.amount / 10).toString()
                      )
                    }
                    className="px-2.5 py-1 bg-slate-100 dark:bg-[#112842] hover:bg-slate-200 dark:hover:bg-[#163354] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#1E3A5F] rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer"
                  >
                    ÷ 10 (Hapus 1 Nol)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCustomAmount(
                        Math.round(expense.amount / 100).toString()
                      )
                    }
                    className="px-2.5 py-1 bg-slate-100 dark:bg-[#112842] hover:bg-slate-200 dark:hover:bg-[#163354] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#1E3A5F] rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer"
                  >
                    ÷ 100 (Hapus 2 Nol)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCustomAmount(Math.round(expense.amount / 2).toString())
                    }
                    className="px-2.5 py-1 bg-slate-100 dark:bg-[#112842] hover:bg-slate-200 dark:hover:bg-[#163354] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#1E3A5F] rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer"
                  >
                    ÷ 2 (50%)
                  </button>
                </div>

                <button
                  type="button"
                  id="modal-save-amount-btn"
                  onClick={handleSaveAmount}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#2251FF] hover:bg-[#1267D5] text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span className="text-white">
                    {language === 'id'
                      ? 'Simpan Nominal Baru'
                      : 'Save Corrected Amount'}
                  </span>
                </button>
              </div>
            )}

            {/* TAB 4: SPLIT BILL */}
            {activeTab === 'split' && (
              <div className="space-y-3.5 animate-in fade-in">
                <div className="p-3 bg-[#F8F9FA] dark:bg-[#0A1C30] rounded-xl border border-slate-200 dark:border-[#1E3A5F] text-xs text-slate-600 dark:text-slate-300">
                  <p>
                    {language === 'id'
                      ? 'Jika Anda menalangi tagihan rombongan, sesuaikan agar hanya mencatat bagian pengeluaran pribadi Anda:'
                      : 'If you paid for a group, adjust the amount to record only your individual portion:'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                      {language === 'id' ? 'Jumlah Orang:' : 'Total People:'}
                    </label>
                    <div className="flex items-center space-x-1.5">
                      {[2, 3, 4, 5].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => {
                            setSplitPeople(count);
                            setCustomShare(
                              Math.round(expense.amount / count).toString()
                            );
                          }}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer border ${
                            splitPeople === count
                              ? 'bg-[#2251FF] text-white border-[#2251FF]'
                              : 'bg-white dark:bg-[#0B1F35] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#1E3A5F] hover:bg-slate-100 dark:hover:bg-[#112842]'
                          }`}
                        >
                          {count}p
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                      {language === 'id'
                        ? 'Bagian Pribadi Anda:'
                        : 'Your Share:'}
                    </label>
                    <input
                      type="number"
                      value={customShare}
                      onChange={(e) => setCustomShare(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-[#0A1C30] border border-slate-300 dark:border-[#1E3A5F] rounded-lg text-xs font-bold font-mono text-[#051C2C] dark:text-white focus:ring-2 focus:ring-[#2251FF] outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-xs flex items-center justify-between">
                  <span className="text-emerald-900 dark:text-emerald-200 font-medium">
                    {language === 'id'
                      ? 'Nominal Baru yang Dicatat:'
                      : 'New Recorded Amount:'}
                  </span>
                  <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                    {formatCurrency(parseFloat(customShare) || 0, currency)}
                  </span>
                </div>

                <button
                  type="button"
                  id="modal-apply-split-btn"
                  onClick={handleApplySplit}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#2251FF] hover:bg-[#1267D5] text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span className="text-white">
                    {language === 'id'
                      ? 'Bagi & Simpan Bagian Pribadi'
                      : 'Save Personal Share'}
                  </span>
                </button>
              </div>
            )}

            {/* TAB 5: FLAG AS FALSE POSITIVE / PROMO & BLOCK FUTURE SYNC */}
            {activeTab === 'false_positive' && (
              <div className="space-y-3.5 animate-in fade-in">
                <div className="p-3.5 bg-rose-50/90 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-500/30 text-xs text-rose-950 dark:text-rose-100 transition-colors">
                  <div className="flex items-center space-x-2 font-bold text-rose-900 dark:text-rose-200 mb-1">
                    <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>
                      {language === 'id'
                        ? 'Tandai Sebagai Bukan Transaksi / Email Palsu'
                        : 'Flag as Non-Transaction / False Email'}
                    </span>
                  </div>
                  <p className="text-rose-800 dark:text-rose-300 text-[11px] leading-relaxed">
                    {language === 'id'
                      ? 'Jika email ini adalah promo diskon palsu, voucher iklan, newsletter promosi, atau tidak pernah Anda beli, tandai di sini untuk menghapusnya dan memblokirnya agar tidak pernah terimpor lagi saat sinkronisasi email di masa depan.'
                      : 'If this email was a promotional discount pitch, false receipt, newsletter, or an unmade purchase, flag it here to permanently delete it and block future syncing.'}
                  </p>
                </div>

                {/* Email details that will be blocked */}
                <div className="bg-slate-100/80 dark:bg-[#0A1C30] p-3 rounded-xl border border-slate-200 dark:border-[#1E3A5F] space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      {language === 'id'
                        ? 'Email Terdeteksi:'
                        : 'Detected Email:'}
                    </span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                      {expense.emailMetadata?.subject || expense.title}
                    </p>
                    {expense.emailMetadata?.sender && (
                      <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {expense.emailMetadata.sender}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                      {language === 'id'
                        ? 'Cakupan Aturan Pemblokiran:'
                        : 'Blocklist Rule Scope:'}
                    </label>
                    <div className="space-y-1.5">
                      <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="blacklistScope"
                          value="subject_and_sender"
                          checked={blacklistScope === 'subject_and_sender'}
                          onChange={() =>
                            setBlacklistScope('subject_and_sender')
                          }
                          className="text-[#2251FF] focus:ring-[#2251FF]"
                        />
                        <span>
                          {language === 'id'
                            ? 'Blokir Berdasarkan Subjek & Judul Transaksi Ini'
                            : 'Block based on this Email Subject & Title'}
                        </span>
                      </label>

                      {expense.emailMetadata?.sender && (
                        <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="radio"
                            name="blacklistScope"
                            value="sender_only"
                            checked={blacklistScope === 'sender_only'}
                            onChange={() => setBlacklistScope('sender_only')}
                            className="text-[#2251FF] focus:ring-[#2251FF]"
                          />
                          <span>
                            {language === 'id'
                              ? `Blokir Semua Email dari Pengirim (${expense.emailMetadata.sender})`
                              : `Block all emails from Sender (${expense.emailMetadata.sender})`}
                          </span>
                        </label>
                      )}

                      <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="blacklistScope"
                          value="email_id_only"
                          checked={blacklistScope === 'email_id_only'}
                          onChange={() => setBlacklistScope('email_id_only')}
                          className="text-[#2251FF] focus:ring-[#2251FF]"
                        />
                        <span>
                          {language === 'id'
                            ? 'Hanya Blokir ID Email Khusus Ini'
                            : 'Block only this specific Email ID'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                      {language === 'id'
                        ? 'Alasan / Catatan Pemblokiran:'
                        : 'Reason / Note:'}
                    </label>
                    <input
                      type="text"
                      value={customBlacklistReason}
                      onChange={(e) => setCustomBlacklistReason(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-[#071727] border border-slate-300 dark:border-[#1E3A5F] rounded-lg text-xs text-[#051C2C] dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                      placeholder="e.g. Promo diskon, bukan struk resmi / tidak pernah transaksi ini"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  id="modal-flag-and-block-btn"
                  onClick={handleFlagAsFalsePositive}
                  className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold shadow-md transition-colors flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                >
                  <Ban className="w-4 h-4 text-white" />
                  <span className="text-white">
                    {language === 'id'
                      ? '✓ Hapus & Blokir Selamanya dari Sinkronisasi'
                      : '✓ Delete & Permanently Block from Future Sync'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Modal Footer with Safe In-line Delete Action */}
          <div className="bg-slate-50 dark:bg-[#081827] border-t border-white/10 px-4 py-3 flex flex-wrap items-center justify-between gap-2 transition-colors">
            {/* Delete Action with In-line confirmation */}
            {!isConfirmingDelete ? (
              <button
                type="button"
                id="fix-modal-delete-btn"
                onClick={() => setIsConfirmingDelete(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-800 font-semibold cursor-pointer transition-colors active:scale-95"
                title="Hapus transaksi ini sepenuhnya"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {language === 'id' ? 'Hapus Transaksi' : 'Delete Transaction'}
                </span>
              </button>
            ) : (
              <div className="flex items-center space-x-2 animate-in fade-in">
                <button
                  type="button"
                  id="fix-modal-confirm-delete-btn"
                  onClick={handleExecuteDelete}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white" />
                  <span className="text-white">
                    {language === 'id'
                      ? 'Yakin Hapus Sekarang'
                      : 'Confirm Delete Now'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#112842] transition-colors cursor-pointer"
                >
                  {language === 'id' ? 'Batal' : 'Cancel'}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-slate-300 dark:border-[#1E3A5F] text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-[#112842] transition-colors cursor-pointer"
            >
              {language === 'id' ? 'Tutup' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
