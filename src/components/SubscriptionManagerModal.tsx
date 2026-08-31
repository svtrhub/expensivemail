import React, { useState, useMemo } from 'react';
import {
  X,
  RotateCcw,
  Calendar,
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Expense, ExpenseCategory } from '../types';
import {
  formatCurrency,
  SupportedCurrency,
  convertCurrency,
} from '../services/currency';
import { Translations } from '../services/translations';

interface SubscriptionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  onUpdateExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  onOpenAddModal: () => void;
  onOpenEmailDetail?: (expense: Expense) => void;
  currency: SupportedCurrency;
  ratesToIDR: Record<SupportedCurrency, number>;
  language: 'en' | 'id';
  t: Translations;
}

export const SubscriptionManagerModal: React.FC<
  SubscriptionManagerModalProps
> = ({
  isOpen,
  onClose,
  expenses,
  onUpdateExpense,
  onDeleteExpense,
  onOpenAddModal,
  onOpenEmailDetail,
  currency,
  ratesToIDR,
  language,
  t,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'yearly'>(
    'all'
  );
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editFrequency, setEditFrequency] = useState<'monthly' | 'yearly'>(
    'monthly'
  );
  const isID = language === 'id';

  // Filter all subscription expenses
  const subscriptions = useMemo(() => {
    return expenses.filter(
      (e) =>
        e.isRecurring ||
        e.category === 'Entertainment & Subscriptions' ||
        e.tags?.some((tag) =>
          ['subscription', 'recurring', 'saas', 'monthly'].includes(
            tag.toLowerCase()
          )
        )
    );
  }, [expenses]);

  // Derived metrics
  const stats = useMemo(() => {
    let monthlyTotal = 0;
    let yearlyCount = 0;
    let monthlyCount = 0;

    subscriptions.forEach((sub) => {
      const converted = convertCurrency(
        sub.amount,
        sub.currency as SupportedCurrency,
        currency,
        ratesToIDR
      );
      if (sub.recurringFrequency === 'yearly') {
        yearlyCount++;
        monthlyTotal += converted / 12;
      } else {
        monthlyCount++;
        monthlyTotal += converted;
      }
    });

    const annualizedRunRate = monthlyTotal * 12;
    const avgPerService =
      subscriptions.length > 0 ? monthlyTotal / subscriptions.length : 0;

    return {
      monthlyTotal,
      annualizedRunRate,
      avgPerService,
      totalCount: subscriptions.length,
      yearlyCount,
      monthlyCount,
    };
  }, [subscriptions, currency, ratesToIDR]);

  // Filtered subscriptions based on search and tab
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      const matchesSearch =
        (sub.merchant || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.paymentMethod || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (filterStatus === 'yearly') return sub.recurringFrequency === 'yearly';
      if (filterStatus === 'active') return sub.isRecurring !== false;
      return true;
    });
  }, [subscriptions, searchTerm, filterStatus]);

  if (!isOpen) return null;

  const handleToggleRecurring = (sub: Expense) => {
    const updated: Expense = {
      ...sub,
      isRecurring: !sub.isRecurring,
      tags: sub.isRecurring
        ? (sub.tags || []).filter(
            (t) => t !== 'subscription' && t !== 'recurring'
          )
        : Array.from(
            new Set([...(sub.tags || []), 'subscription', 'recurring'])
          ),
    };
    onUpdateExpense(updated);
  };

  const handleSaveFrequency = (sub: Expense) => {
    const updated: Expense = {
      ...sub,
      recurringFrequency: editFrequency,
    };
    onUpdateExpense(updated);
    setEditingSubId(null);
  };

  return (
    <div
      id="subscription-manager-modal-backdrop"
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="subscription-manager-modal"
        className="glass-modal rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.6)] flex flex-col transition-colors text-white"
      >
        <div className="glass-content flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Modal Header */}
          <div className="bg-[#051C2C] text-white p-4 sm:p-5 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-[#2251FF]/20 text-[#60A5FA] border border-[#2251FF]/40 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base sm:text-lg font-bold font-editorial text-white tracking-tight">
                    {isID
                      ? 'Kelola Langganan Rutin'
                      : 'Recurring Subscriptions & SaaS'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#2251FF] text-white">
                    {subscriptions.length} {isID ? 'Layanan' : 'Services'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {isID
                    ? 'Pantau pengeluaran berulang, tagihan cloud, dan jadwal perpanjangan.'
                    : 'Track monthly recurring commitments, cloud bills, and renewal cycles.'}
                </p>
              </div>
            </div>
            <button
              id="close-subscriptions-modal-btn"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Close"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Executive Summary Metric Bar */}
          <div className="grid grid-cols-3 gap-2 p-3 sm:p-4 bg-[#F8FAFC] dark:bg-[#081827] border-b border-[#E2E8F0] dark:border-[#1E3A5F]">
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#0D2238] border border-[#E2E8F0] dark:border-[#1E3A5F] shadow-2xs">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400 block">
                {isID ? 'Total Bulanan' : 'Monthly Total'}
              </span>
              <span className="text-sm sm:text-base font-extrabold font-mono text-[#051C2C] dark:text-white mt-0.5 block truncate">
                {formatCurrency(stats.monthlyTotal, currency)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-[#0D2238] border border-[#E2E8F0] dark:border-[#1E3A5F] shadow-2xs">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400 block">
                {isID ? 'Estimasi Tahunan' : 'Annual Run-Rate'}
              </span>
              <span className="text-sm sm:text-base font-extrabold font-mono text-[#2251FF] dark:text-[#60A5FA] mt-0.5 block truncate">
                {formatCurrency(stats.annualizedRunRate, currency)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-[#0D2238] border border-[#E2E8F0] dark:border-[#1E3A5F] shadow-2xs">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400 block">
                {isID ? 'Rata-rata/Layanan' : 'Avg/Service'}
              </span>
              <span className="text-sm sm:text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block truncate">
                {formatCurrency(stats.avgPerService, currency)}
              </span>
            </div>
          </div>

          {/* Toolbar: Search, Filter Tabs, Add Button */}
          <div className="p-3 sm:p-4 border-b border-[#E2E8F0] dark:border-[#1E3A5F] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white dark:bg-[#0D2238]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  isID
                    ? 'Cari nama langganan, merchant, kartu...'
                    : 'Search subscription, merchant, card...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F0F4F8] dark:bg-[#163354] border border-[#CBD5E1] dark:border-[#2A486F] text-xs text-[#051C2C] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#2251FF]"
              />
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              <div className="inline-flex rounded-xl bg-[#F0F4F8] dark:bg-[#163354] p-0.5 border border-[#CBD5E1] dark:border-[#2A486F] text-xs">
                <button
                  type="button"
                  onClick={() => setFilterStatus('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                    filterStatus === 'all'
                      ? 'bg-white dark:bg-[#0D2238] text-[#2251FF] dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {isID ? 'Semua' : 'All'} ({subscriptions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('active')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                    filterStatus === 'active'
                      ? 'bg-white dark:bg-[#0D2238] text-[#2251FF] dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {isID ? 'Aktif' : 'Active'}
                </button>
              </div>

              <button
                id="add-new-subscription-btn"
                onClick={() => {
                  onClose();
                  onOpenAddModal();
                }}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#2251FF] hover:bg-[#1267D5] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer shrink-0"
                title={isID ? 'Tambah Langganan Baru' : 'Add Subscription'}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">
                  {isID ? 'Tambah' : 'Add'}
                </span>
              </button>
            </div>
          </div>

          {/* Subscriptions List */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 max-h-[50vh]">
            {filteredSubscriptions.length === 0 ? (
              <div className="text-center py-10 px-4 text-slate-500 dark:text-slate-400">
                <RotateCcw className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {isID
                    ? 'Tidak ada langganan yang cocok.'
                    : 'No matching recurring subscriptions found.'}
                </p>
                <p className="text-xs mt-1 text-slate-500">
                  {isID
                    ? 'Tambahkan pengeluaran rutin secara manual atau sinkronkan kotak masuk Anda.'
                    : 'Add recurring expenses manually or sync your inbox to capture receipts.'}
                </p>
              </div>
            ) : (
              filteredSubscriptions.map((sub) => {
                const convertedAmount = convertCurrency(
                  sub.amount,
                  sub.currency as SupportedCurrency,
                  currency,
                  ratesToIDR
                );
                const isEditingThis = editingSubId === sub.id;

                return (
                  <div
                    key={sub.id}
                    className={`p-3 sm:p-3.5 rounded-xl border transition-colors ${
                      sub.isRecurring !== false
                        ? 'bg-white dark:bg-[#081827] border-[#CBD5E1] dark:border-[#1E3A5F] hover:border-[#2251FF]'
                        : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      {/* Left: Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="font-bold text-xs sm:text-sm text-[#051C2C] dark:text-white truncate">
                            {sub.merchant || sub.title}
                          </span>
                          <span className="px-2 py-0.2 rounded-md text-[10px] font-mono font-bold bg-[#F0F4F8] dark:bg-[#163354] text-[#2251FF] dark:text-[#60A5FA] border border-[#CBD5E1] dark:border-[#2A486F]">
                            {sub.recurringFrequency === 'yearly'
                              ? isID
                                ? 'Tahunan'
                                : 'Yearly'
                              : isID
                                ? 'Bulanan'
                                : 'Monthly'}
                          </span>
                          {sub.isRecurring === false && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {isID ? 'Nonaktif' : 'Paused'}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {sub.title && sub.title !== sub.merchant
                            ? sub.title
                            : sub.category}
                        </p>

                        <div className="flex items-center space-x-3 mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap gap-y-1">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{sub.date}</span>
                          </span>
                          {sub.paymentMethod && (
                            <span className="flex items-center space-x-1">
                              <CreditCard className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[150px]">
                                {sub.paymentMethod}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Amount & Quick Actions */}
                      <div className="text-right shrink-0">
                        <div className="font-mono font-extrabold text-sm sm:text-base text-[#051C2C] dark:text-white">
                          {formatCurrency(convertedAmount, currency)}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {sub.currency !== currency
                            ? `${sub.currency} ${sub.amount}`
                            : ''}
                        </span>

                        {/* Action buttons */}
                        <div className="flex items-center justify-end space-x-1 mt-2">
                          {onOpenEmailDetail && sub.emailMetadata && (
                            <button
                              onClick={() => onOpenEmailDetail(sub)}
                              className="p-1 rounded-md text-slate-400 hover:text-[#2251FF] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title={
                                isID
                                  ? 'Lihat Email Struk'
                                  : 'View Email Receipt'
                              }
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleRecurring(sub)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                              sub.isRecurring !== false
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            }`}
                            title={
                              sub.isRecurring !== false
                                ? isID
                                  ? 'Jadikan Non-Rutin'
                                  : 'Pause Recurring'
                                : isID
                                  ? 'Jadikan Rutin'
                                  : 'Set as Recurring'
                            }
                          >
                            {sub.isRecurring !== false
                              ? isID
                                ? 'Jeda'
                                : 'Pause'
                              : isID
                                ? 'Aktifkan'
                                : 'Activate'}
                          </button>
                          <button
                            onClick={() => onDeleteExpense(sub.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title={isID ? 'Hapus' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-3 sm:p-4 bg-[#F8FAFC] dark:bg-[#081827] border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>
                {isID
                  ? 'Data tersimpan otomatis secara aman.'
                  : 'Subscription data securely synchronized.'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-[#051C2C] dark:bg-white text-white dark:text-[#051C2C] font-bold text-xs shadow-2xs hover:opacity-90 transition-opacity cursor-pointer"
            >
              {isID ? 'Selesai' : 'Done'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
