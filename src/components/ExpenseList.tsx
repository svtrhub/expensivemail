import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Expense, BankAccount, ExpenseCategory, AnomalyRecord } from '../types';
import {
  formatCurrency,
  formatConvertedExpense,
  convertCurrency,
  SupportedCurrency,
  DEFAULT_EXCHANGE_RATE_DB,
} from '../services/currency';
import { Translations, LanguageCode } from '../services/translations';
import {
  Search,
  Filter,
  ArrowUpDown,
  Mail,
  Receipt,
  Edit2,
  Trash2,
  Zap,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  ShoppingBag,
  Utensils,
  Coffee,
  Car,
  Tv,
  HeartPulse,
  Home,
  FileText,
  HelpCircle,
  Tag,
  CreditCard,
  Plus,
  Building2,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Sliders,
  RefreshCw,
  X,
  AlertTriangle,
  Wrench,
  Sparkles,
  Download,
} from 'lucide-react';
import { AnimatedGroup } from './motion/animated-group';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
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

interface ExpenseListProps {
  expenses: Expense[];
  accounts: BankAccount[];
  selectedAccountId: string | null;
  onSelectAccount?: (id: string | null) => void;
  anomaliesMap?: Map<string, AnomalyRecord>;
  onViewEmailDetail: (expense: Expense) => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  onFixAnomaly?: (anomaly: AnomalyRecord, expense: Expense) => void;
  onBatchDeleteExpenses?: (expenseIds: string[]) => void;
  onBatchUpdateCategory?: (
    expenseIds: string[],
    newCategory: ExpenseCategory
  ) => void;
  onBatchToggleBusiness?: (expenseIds: string[], isBusiness: boolean) => void;
  onBatchToggleTax?: (expenseIds: string[], isTaxDeductible: boolean) => void;
  onSyncNow: () => void;
  onOpenAddExpense?: () => void;
  onOpenRulesModal?: () => void;
  onOpenReportModal?: () => void;
  onLoadSampleData?: () => void;
  currency: SupportedCurrency;
  ratesToIDR?: Record<SupportedCurrency, number>;
  language?: LanguageCode;
  t: Translations;
  initialFilterAnomaliesOnly?: boolean;
  categoryFilter?: string | null;
  onCategoryFilterChange?: (cat: string) => void;
  hasMoreExpenses?: boolean;
  isLoadingMore?: boolean;
  onLoadMoreExpenses?: () => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  accounts,
  selectedAccountId,
  onSelectAccount,
  anomaliesMap = new Map(),
  onViewEmailDetail,
  onEditExpense,
  onDeleteExpense,
  onFixAnomaly,
  onBatchDeleteExpenses,
  onBatchUpdateCategory,
  onBatchToggleBusiness,
  onBatchToggleTax,
  onSyncNow,
  onOpenAddExpense,
  onOpenRulesModal,
  onOpenReportModal,
  onLoadSampleData,
  currency,
  ratesToIDR = DEFAULT_EXCHANGE_RATE_DB.ratesToIDR,
  language = 'id',
  t,
  initialFilterAnomaliesOnly = false,
  categoryFilter,
  onCategoryFilterChange,
  hasMoreExpenses = false,
  isLoadingMore = false,
  onLoadMoreExpenses,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categoryFilter || 'ALL'
  );
  const [dateFilter, setDateFilter] = useState<
    'ALL' | 'TODAY' | '7DAYS' | 'THIS_MONTH'
  >('ALL');
  const [sortBy, setSortBy] = useState<
    'DATE_DESC' | 'DATE_ASC' | 'AMOUNT_DESC' | 'AMOUNT_ASC' | 'CONFIDENCE'
  >('DATE_DESC');
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const [batchCategory, setBatchCategory] =
    useState<ExpenseCategory>('Dining & Food');
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [showAnomaliesOnly, setShowAnomaliesOnly] = useState(
    initialFilterAnomaliesOnly
  );
  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialFilterAnomaliesOnly) {
      setShowAnomaliesOnly(true);
    }
  }, [initialFilterAnomaliesOnly]);

  useEffect(() => {
    if (categoryFilter !== undefined && categoryFilter !== null) {
      setSelectedCategory(categoryFilter);
    }
  }, [categoryFilter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        optionsRef.current &&
        !optionsRef.current.contains(event.target as Node)
      ) {
        setIsOptionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalAnomaliesCount = useMemo(() => {
    return expenses.filter(
      (e) => anomaliesMap.has(e.id) && !anomaliesMap.get(e.id)?.dismissed
    ).length;
  }, [expenses, anomaliesMap]);

  const getCategoryIcon = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'Dining & Food':
        return (
          <Utensils className="w-4 h-4 text-[#D97706] dark:text-amber-400" />
        );
      case 'Groceries':
        return (
          <ShoppingBag className="w-4 h-4 text-[#059669] dark:text-emerald-400" />
        );
      case 'Shopping & Retail':
        return <Tag className="w-4 h-4 text-[#0072CE] dark:text-sky-400" />;
      case 'Utilities & Bills':
        return (
          <FileText className="w-4 h-4 text-[#475569] dark:text-slate-400" />
        );
      case 'Travel & Transportation':
        return <Car className="w-4 h-4 text-[#0284C7] dark:text-cyan-400" />;
      case 'Entertainment & Subscriptions':
        return <Tv className="w-4 h-4 text-[#7C3AED] dark:text-purple-400" />;
      case 'Health & Wellness':
        return (
          <HeartPulse className="w-4 h-4 text-[#E11D48] dark:text-rose-400" />
        );
      case 'Housing & Rent':
        return <Home className="w-4 h-4 text-[#0D9488] dark:text-teal-400" />;
      default:
        return (
          <HelpCircle className="w-4 h-4 text-[#64748B] dark:text-slate-400" />
        );
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((expense) => {
        // Anomalies only filter
        if (showAnomaliesOnly) {
          const anom = anomaliesMap.get(expense.id);
          if (!anom || anom.dismissed) return false;
        }

        // Account filter
        if (selectedAccountId) {
          const selectedAcc = accounts.find((a) => a.id === selectedAccountId);
          const matchesDirectId = expense.bankAccountId === selectedAccountId;

          let matchesFallback = false;
          if (!expense.bankAccountId && selectedAcc) {
            const inst = (selectedAcc.institution || '').toLowerCase();
            const accName = (selectedAcc.name || '').toLowerCase();
            const bName = (expense.bankAccountName || '').toLowerCase();
            const pMethod = (expense.paymentMethod || '').toLowerCase();
            const mask = selectedAcc.accountNumberMask?.replace(/[^0-9]/g, '');

            matchesFallback = Boolean(
              (inst &&
                (bName.includes(inst) ||
                  inst.includes(bName) ||
                  pMethod.includes(inst))) ||
              (accName &&
                (bName.includes(accName) || pMethod.includes(accName))) ||
              (mask &&
                mask.length === 4 &&
                (pMethod.includes(mask) || bName.includes(mask)))
            );
          }

          if (!matchesDirectId && !matchesFallback) {
            return false;
          }
        }

        // Category filter
        if (
          selectedCategory !== 'ALL' &&
          expense.category !== selectedCategory
        ) {
          return false;
        }

        // Search query filter
        if (searchQuery.trim() !== '') {
          const query = searchQuery.toLowerCase();
          const matchMerchant = expense.merchant.toLowerCase().includes(query);
          const matchTitle = expense.title.toLowerCase().includes(query);
          const matchNotes = expense.notes?.toLowerCase().includes(query);
          const matchPayment = expense.paymentMethod
            ?.toLowerCase()
            .includes(query);
          const matchItem = expense.items?.some((i) =>
            i.name.toLowerCase().includes(query)
          );
          const matchEmailSubject = expense.emailMetadata?.subject
            .toLowerCase()
            .includes(query);

          if (
            !matchMerchant &&
            !matchTitle &&
            !matchNotes &&
            !matchPayment &&
            !matchItem &&
            !matchEmailSubject
          ) {
            return false;
          }
        }

        // Date filter
        if (dateFilter !== 'ALL') {
          const expDate = new Date(expense.date);
          const now = new Date();
          const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );

          if (dateFilter === 'TODAY') {
            const expDay = new Date(
              expDate.getFullYear(),
              expDate.getMonth(),
              expDate.getDate()
            );
            if (expDay.getTime() !== today.getTime()) return false;
          } else if (dateFilter === '7DAYS') {
            const sevenDaysAgo = new Date(
              today.getTime() - 7 * 24 * 3600 * 1000
            );
            if (expDate < sevenDaysAgo) return false;
          } else if (dateFilter === 'THIS_MONTH') {
            if (
              expDate.getMonth() !== now.getMonth() ||
              expDate.getFullYear() !== now.getFullYear()
            ) {
              return false;
            }
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'DATE_DESC') {
          const dateDiff =
            new Date(b.date).getTime() - new Date(a.date).getTime();
          if (dateDiff !== 0) return dateDiff;
          return (b.time || '').localeCompare(a.time || '');
        }
        if (sortBy === 'DATE_ASC') {
          const dateDiff =
            new Date(a.date).getTime() - new Date(b.date).getTime();
          if (dateDiff !== 0) return dateDiff;
          return (a.time || '').localeCompare(b.time || '');
        }
        if (sortBy === 'AMOUNT_DESC') {
          const amtA = convertCurrency(
            a.amount,
            a.currency || 'IDR',
            currency,
            ratesToIDR
          );
          const amtB = convertCurrency(
            b.amount,
            b.currency || 'IDR',
            currency,
            ratesToIDR
          );
          return amtB - amtA;
        }
        if (sortBy === 'AMOUNT_ASC') {
          const amtA = convertCurrency(
            a.amount,
            a.currency || 'IDR',
            currency,
            ratesToIDR
          );
          const amtB = convertCurrency(
            b.amount,
            b.currency || 'IDR',
            currency,
            ratesToIDR
          );
          return amtA - amtB;
        }
        if (sortBy === 'CONFIDENCE') {
          return (b.confidenceScore || 0) - (a.confidenceScore || 0);
        }
        return 0;
      });
  }, [
    expenses,
    selectedAccountId,
    selectedCategory,
    searchQuery,
    dateFilter,
    sortBy,
    showAnomaliesOnly,
    anomaliesMap,
    currency,
    ratesToIDR,
  ]);

  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.type === 'debit')
      .reduce(
        (sum, e) =>
          sum +
          convertCurrency(e.amount, e.currency || 'IDR', currency, ratesToIDR),
        0
      );
  }, [filteredExpenses, currency, ratesToIDR]);

  const isAllSelected =
    filteredExpenses.length > 0 &&
    filteredExpenses.every((e) => selectedExpenseIds.includes(e.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedExpenseIds([]);
    } else {
      setSelectedExpenseIds(filteredExpenses.map((e) => e.id));
    }
  };

  const handleToggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedExpenseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExecuteBatchDelete = () => {
    if (selectedExpenseIds.length === 0) return;
    if (onBatchDeleteExpenses) {
      onBatchDeleteExpenses(selectedExpenseIds);
    } else {
      selectedExpenseIds.forEach((id) => onDeleteExpense(id));
    }
    setSelectedExpenseIds([]);
  };

  const handleExecuteBatchCategory = () => {
    if (selectedExpenseIds.length === 0 || !onBatchUpdateCategory) return;
    onBatchUpdateCategory(selectedExpenseIds, batchCategory);
    setSelectedExpenseIds([]);
  };

  const handleExecuteBatchBusiness = (isBusiness: boolean) => {
    if (selectedExpenseIds.length === 0 || !onBatchToggleBusiness) return;
    onBatchToggleBusiness(selectedExpenseIds, isBusiness);
    setSelectedExpenseIds([]);
  };

  const handleExecuteBatchTax = (isTax: boolean) => {
    if (selectedExpenseIds.length === 0 || !onBatchToggleTax) return;
    onBatchToggleTax(selectedExpenseIds, isTax);
    setSelectedExpenseIds([]);
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 text-white transition-colors">
      <div className="glass-content">
        {/* Header & Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/10">
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-1.5">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight font-editorial">
              {t.feed.title}
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white/10 text-white border border-white/15">
              {filteredExpenses.length}{' '}
              {language === 'id' ? 'entri' : 'entries'}
            </span>
            <div className="flex items-center space-x-1.5 text-xs text-slate-400">
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-medium">
                {t.feed.totalFiltered}:
              </span>
              <span className="text-xs font-bold text-white font-mono bg-white/10 px-2.5 py-0.5 rounded border border-white/15">
                {formatCurrency(totalFilteredAmount, currency)}
              </span>
            </div>
          </div>

          {/* Action Controls: Main Feature Button + Compact Options Dropdown */}
          <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
            {/* Main Primary Action */}
            {onOpenAddExpense && (
              <button
                id="expense-list-add-manual-btn"
                onClick={onOpenAddExpense}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#2251FF]/40 hover:bg-[#2251FF]/60 text-white text-xs font-bold border border-[#2251FF]/60 hover:border-[#2251FF] backdrop-blur-xl shadow-[0_4px_20px_rgba(34,81,255,0.25)] transition-all cursor-pointer shrink-0"
                title={t.menu.addExpense}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.menu.addExpense}</span>
              </button>
            )}

            {/* Secondary Tools in a Dedicated Compact Dropdown */}
            <div className="relative" ref={optionsRef}>
              <button
                id="expense-list-tools-dropdown-btn"
                onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold shadow-xs backdrop-blur-md transition-colors cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span className="hidden sm:inline">{t.feed.moreTools}</span>
                <ChevronDown className="w-3 h-3 text-slate-300" />
              </button>

              {isOptionsOpen && (
                <div className="absolute right-0 mt-1.5 w-56 bg-[#081B2E]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.6)] p-1.5 z-40 animate-in fade-in-50 zoom-in-95 text-slate-100">
                  <button
                    onClick={() => {
                      setIsOptionsOpen(false);
                      onSyncNow();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white flex items-center space-x-2.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>{t.feed.pullNewEmails}</span>
                  </button>

                  {onOpenRulesModal && (
                    <button
                      onClick={() => {
                        setIsOptionsOpen(false);
                        onOpenRulesModal();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white flex items-center space-x-2.5 transition-colors cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>{t.feed.ingestionRules}</span>
                    </button>
                  )}

                  {onOpenReportModal && (
                    <button
                      onClick={() => {
                        setIsOptionsOpen(false);
                        onOpenReportModal();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white flex items-center space-x-2.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        {language === 'id'
                          ? 'Laporan & Ekspor'
                          : 'Statement & Export'}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category, Date & Sort Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 my-3">
          {/* Search Input */}
          <div className="relative col-span-1 sm:col-span-1">
            <input
              id="expense-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.feed.searchPlaceholder}
              className="w-full px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#2251FF]"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              id="category-filter-select"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                onCategoryFilterChange?.(e.target.value);
              }}
              style={{ colorScheme: 'dark', backgroundColor: '#071524' }}
              className="w-full px-2.5 py-1.5 bg-[#071524] border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#38BDF8] cursor-pointer [&>option]:bg-[#071524] [&>option]:text-white"
            >
              <option value="ALL" className="bg-[#071524] text-white">
                {t.feed.allCategories}
              </option>
              {EXPENSE_CATEGORIES.map((cat) => (
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

          {/* Date Filter */}
          <div className="relative">
            <select
              id="date-filter-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              style={{ colorScheme: 'dark', backgroundColor: '#071524' }}
              className="w-full px-2.5 py-1.5 bg-[#071524] border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#38BDF8] cursor-pointer [&>option]:bg-[#071524] [&>option]:text-white"
            >
              <option value="ALL" className="bg-[#071524] text-white">
                {language === 'id' ? 'Semua Tanggal' : 'All Dates'}
              </option>
              <option value="TODAY" className="bg-[#071524] text-white">
                {language === 'id' ? 'Hari Ini' : 'Today'}
              </option>
              <option value="7DAYS" className="bg-[#071524] text-white">
                {language === 'id' ? '7 Hari Terakhir' : 'Last 7 Days'}
              </option>
              <option value="THIS_MONTH" className="bg-[#071524] text-white">
                {language === 'id' ? 'Bulan Ini' : 'This Month'}
              </option>
            </select>
          </div>

          {/* Sort By */}
          <div className="relative">
            <select
              id="sort-by-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{ colorScheme: 'dark', backgroundColor: '#071524' }}
              className="w-full px-2.5 py-1.5 bg-[#071524] border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#38BDF8] cursor-pointer [&>option]:bg-[#071524] [&>option]:text-white"
            >
              <option value="DATE_DESC" className="bg-[#071524] text-white">
                {language === 'id'
                  ? 'Tanggal: Terbaru Dulu'
                  : 'Date: Newest First'}
              </option>
              <option value="DATE_ASC" className="bg-[#071524] text-white">
                {language === 'id'
                  ? 'Tanggal: Terlama Dulu'
                  : 'Date: Oldest First'}
              </option>
              <option value="AMOUNT_DESC" className="bg-[#071524] text-white">
                {language === 'id'
                  ? 'Nominal: Terbesar'
                  : 'Amount: Highest First'}
              </option>
              <option value="AMOUNT_ASC" className="bg-[#071524] text-white">
                {language === 'id'
                  ? 'Nominal: Terkecil'
                  : 'Amount: Lowest First'}
              </option>
              <option value="CONFIDENCE" className="bg-[#071524] text-white">
                {language === 'id'
                  ? 'Tingkat Akurasi AI'
                  : 'AI Match Confidence'}
              </option>
            </select>
          </div>
        </div>

        {/* Active Account Filter Banner */}
        {selectedAccountId && (
          <div className="mb-3 px-3 py-2 bg-[#2251FF]/15 border border-[#2251FF]/40 rounded-xl flex items-center justify-between text-xs text-slate-200 animate-in fade-in-50">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse"></span>
              <span>
                {language === 'id'
                  ? 'Memfilter transaksi untuk rekening:'
                  : 'Filtering transactions for account:'}{' '}
                <strong className="text-white font-semibold">
                  {accounts.find((a) => a.id === selectedAccountId)?.name ||
                    accounts.find((a) => a.id === selectedAccountId)
                      ?.institution ||
                    'Selected Account'}
                </strong>
              </span>
            </div>
            {onSelectAccount && (
              <button
                type="button"
                onClick={() => onSelectAccount(null)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer text-[11px] font-medium"
              >
                {language === 'id'
                  ? 'Tampilkan Semua Rekening'
                  : 'Show All Accounts'}
              </button>
            )}
          </div>
        )}

        {/* Batch Action Toolbar when Items Selected */}
        {selectedExpenseIds.length > 0 && (
          <div className="mb-4 p-3 bg-[#051C2C] dark:bg-[#081827] text-white rounded-xl shadow-lg border border-slate-700 dark:border-[#1E3A5F] flex flex-wrap items-center justify-between gap-3 animate-in fade-in-50 slide-in-from-top-2">
            <div className="flex items-center space-x-2.5">
              <span className="px-2 py-0.5 bg-[#2251FF] text-white rounded text-xs font-bold font-mono">
                {selectedExpenseIds.length}{' '}
                {language === 'id' ? 'dipilih' : 'selected'}
              </span>
              <span className="text-xs text-slate-300">
                {language === 'id' ? 'Tindakan massal:' : 'Batch actions:'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Batch Category Select */}
              <div className="flex items-center space-x-1">
                <select
                  value={batchCategory}
                  onChange={(e) =>
                    setBatchCategory(e.target.value as ExpenseCategory)
                  }
                  style={{ colorScheme: 'dark', backgroundColor: '#071524' }}
                  className="bg-[#071524] border border-[#2251FF]/40 text-white text-xs rounded-lg px-2 py-1 focus:outline-none [&>option]:bg-[#071524] [&>option]:text-white"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option
                      key={c}
                      value={c}
                      className="bg-[#071524] text-white"
                    >
                      {t.categories[c] || c}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleExecuteBatchCategory}
                  className="px-2.5 py-1 bg-[#2251FF] hover:bg-[#1267D5] rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  {language === 'id' ? 'Ubah Kategori' : 'Update Category'}
                </button>
              </div>

              {/* Mark Business */}
              <button
                type="button"
                onClick={() => handleExecuteBatchBusiness(true)}
                className="px-2.5 py-1 bg-amber-600/80 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors cursor-pointer"
              >
                {language === 'id' ? 'Set Bisnis' : 'Set Business'}
              </button>

              {/* Mark Tax Deductible */}
              <button
                type="button"
                onClick={() => handleExecuteBatchTax(true)}
                className="px-2.5 py-1 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors cursor-pointer"
              >
                {language === 'id' ? 'Set Pajak' : 'Set Tax-Deductible'}
              </button>

              {/* Delete Selected */}
              <button
                type="button"
                onClick={handleExecuteBatchDelete}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
              >
                {language === 'id' ? 'Hapus' : 'Delete'}
              </button>

              {/* Deselect All */}
              <button
                type="button"
                onClick={() => setSelectedExpenseIds([])}
                className="text-xs text-slate-400 hover:text-white underline ml-1 cursor-pointer"
              >
                {language === 'id' ? 'Batal' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        {/* Select All Toggle Bar */}
        {filteredExpenses.length > 0 && (
          <div className="flex items-center justify-between pb-2 px-1 text-xs text-[#64748B] dark:text-slate-400">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="flex items-center space-x-2 text-[#64748B] dark:text-slate-400 hover:text-[#051C2C] dark:hover:text-white font-medium cursor-pointer"
            >
              {isAllSelected ? (
                <CheckSquare className="w-4 h-4 text-[#2251FF] dark:text-[#38BDF8]" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {isAllSelected ? t.feed.deselectAll : t.feed.selectAll}
              </span>
            </button>
            <span>
              {t.feed.showingEntries} {filteredExpenses.length}{' '}
              {language === 'id' ? 'entri' : 'entries'}
            </span>
          </div>
        )}

        {/* Transaction List Feed */}
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-[#CBD5E1] dark:border-[#1E3A5F] bg-[#F8F9FA] dark:bg-[#112842] my-2 transition-colors">
            <div className="w-12 h-12 rounded-full bg-[#F0F4F8] dark:bg-[#163354] text-[#2251FF] dark:text-[#38BDF8] flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#051C2C] dark:text-white">
              {showAnomaliesOnly
                ? t.feed.noAnomaliesFound
                : t.feed.noExpensesFound}
            </h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {showAnomaliesOnly
                ? t.feed.noAnomaliesDesc
                : t.feed.noExpensesDesc}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              {showAnomaliesOnly ? (
                <button
                  onClick={() => setShowAnomaliesOnly(false)}
                  className="px-4 py-2 bg-[#051C2C] dark:bg-[#2251FF] hover:bg-[#0D2E78] dark:hover:bg-[#1267D5] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  {t.feed.viewAllExpenses}
                </button>
              ) : (
                <>
                  <button
                    onClick={onSyncNow}
                    className="px-4 py-2 bg-[#2251FF] hover:bg-[#1267D5] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    {t.feed.runSyncNow}
                  </button>
                  {onOpenAddExpense && (
                    <button
                      onClick={onOpenAddExpense}
                      className="px-4 py-2 bg-white dark:bg-[#0D2238] hover:bg-[#F8F9FA] dark:hover:bg-[#163354] border border-[#CBD5E1] dark:border-[#1E3A5F] text-[#051C2C] dark:text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#2251FF] dark:text-[#38BDF8]" />
                      <span>{t.feed.addManualExpense}</span>
                    </button>
                  )}
                  {onLoadSampleData && (
                    <button
                      onClick={onLoadSampleData}
                      className="px-4 py-2 bg-[#F0F4F8] dark:bg-[#163354] hover:bg-[#E2E8F0] dark:hover:bg-[#1E4373] border border-[#CBD5E1] dark:border-[#2A486F] text-[#2251FF] dark:text-[#38BDF8] rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {language === 'id'
                          ? 'Muat Data Contoh'
                          : 'Load Sample Data'}
                      </span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <AnimatedGroup className="space-y-2" preset="slide" staggerCap={10}>
            {filteredExpenses.map((expense) => {
              const hasEmailSource = !!expense.emailMetadata;
              const isSelected = selectedExpenseIds.includes(expense.id);
              const anomaly = anomaliesMap.get(expense.id);
              const isAnomaly = anomaly && !anomaly.dismissed;

              return (
                <div
                  key={expense.id}
                  id={`expense-row-${expense.id}`}
                  className={`group p-3.5 sm:p-4 rounded-xl border transition-[color,border-color,box-shadow] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
                    isSelected
                      ? 'bg-[#F0F4F8] dark:bg-[#163354] border-[#2251FF] dark:border-[#38BDF8] shadow-xs'
                      : isAnomaly
                        ? 'bg-[#FEFDF9] dark:bg-[#1a1c1a] hover:bg-amber-50/40 dark:hover:bg-amber-950/30 border-amber-300/90 dark:border-amber-700/70 shadow-2xs hover:border-amber-400'
                        : 'bg-white/5 backdrop-blur-xl hover:bg-white/10 border-white/15 hover:border-white/25 shadow-lg'
                  }`}
                >
                  {/* Left: Checkbox + Icon & Merchant Details */}
                  <div className="flex items-start space-x-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={(e) => handleToggleSelectRow(expense.id, e)}
                      className="mt-2 text-slate-300 hover:text-[#38BDF8] cursor-pointer shrink-0 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg hover:bg-white/10"
                      aria-label={`Select transaction ${expense.merchant}`}
                    >
                      {isSelected ? (
                        <CheckSquare
                          className="w-4 h-4 text-[#38BDF8]"
                          aria-hidden="true"
                        />
                      ) : (
                        <Square
                          className="w-4 h-4 text-slate-400 group-hover:text-slate-200"
                          aria-hidden="true"
                        />
                      )}
                    </button>

                    <div
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isAnomaly
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                          : 'bg-white/10 border-white/15 group-hover:bg-white/20'
                      }`}
                      aria-hidden="true"
                    >
                      {getCategoryIcon(expense.category)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h4
                          className="text-xs sm:text-sm font-bold text-white tracking-tight truncate max-w-[200px] sm:max-w-xs"
                          title={expense.merchant}
                        >
                          {expense.merchant}
                        </h4>

                        {/* Anomaly Detection Highlight Badge */}
                        {isAnomaly && (
                          <div className="inline-flex items-center space-x-1.5">
                            <button
                              type="button"
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/30 text-amber-200 border border-amber-500/50 shadow-xs cursor-pointer hover:bg-amber-500/40 transition-colors"
                              title={anomaly.reason}
                              onClick={() => onViewEmailDetail(expense)}
                              aria-label={`View anomaly reason: ${anomaly.reason}`}
                            >
                              <AlertTriangle
                                className="w-2.5 h-2.5 text-amber-300"
                                aria-hidden="true"
                              />
                              <span className="tabular-nums font-mono">
                                {language === 'id' ? 'Lonjakan' : 'Spike'} +
                                {Math.round(anomaly.percentageAboveAverage)}% (
                                {anomaly.multiplier.toFixed(1)}x)
                              </span>
                            </button>

                            {onFixAnomaly && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onFixAnomaly(anomaly, expense);
                                }}
                                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-all cursor-pointer active:scale-95"
                                title={
                                  language === 'id'
                                    ? 'Perbaiki anomali ini'
                                    : 'Fix this anomaly'
                                }
                                aria-label="Fix anomaly"
                              >
                                <Wrench
                                  className="w-2.5 h-2.5"
                                  aria-hidden="true"
                                />
                                <span>
                                  {language === 'id' ? 'Perbaiki' : 'Fix'}
                                </span>
                              </button>
                            )}
                          </div>
                        )}

                        {expense.isRecurring && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-200 border border-purple-500/40">
                            <Zap
                              className="w-2.5 h-2.5 mr-0.5"
                              aria-hidden="true"
                            />
                            {t.feed.subscriptionTag}
                          </span>
                        )}

                        {expense.isBusinessExpense && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-200 border border-amber-500/40">
                            {t.feed.businessTag}
                          </span>
                        )}

                        {expense.isTaxDeductible && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-500/40">
                            {t.feed.taxTag}
                          </span>
                        )}

                        {hasEmailSource && (
                          <button
                            id={`view-email-source-${expense.id}`}
                            onClick={() => onViewEmailDetail(expense)}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors cursor-pointer"
                            title="View source email receipt snippet"
                            aria-label="View source email receipt"
                          >
                            <Mail
                              className="w-2.5 h-2.5 text-[#38BDF8]"
                              aria-hidden="true"
                            />
                            <span className="tabular-nums font-mono">
                              AI Parsed (
                              {Math.round(
                                (expense.confidenceScore || 0.95) * 100
                              )}
                              %)
                            </span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 mt-1 text-xs text-slate-300 font-semibold flex-wrap gap-y-1">
                        <span className="tabular-nums font-mono">
                          {expense.date}
                        </span>
                        {expense.time && (
                          <span className="tabular-nums font-mono">
                            • {expense.time}
                          </span>
                        )}
                        <span>•</span>
                        <span className="text-white font-bold">
                          {t.categories[expense.category] || expense.category}
                        </span>
                        {expense.bankAccountName && (
                          <>
                            <span>•</span>
                            <span className="text-slate-300 font-medium">
                              {expense.bankAccountName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center justify-between sm:justify-end space-x-4 pl-12 sm:pl-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/10 shrink-0">
                    <div className="text-right">
                      {(() => {
                        const conv = formatConvertedExpense(
                          expense.amount,
                          expense.currency,
                          currency,
                          ratesToIDR
                        );
                        return (
                          <>
                            <div
                              className={`text-sm sm:text-base font-bold font-mono tracking-tight tabular-nums text-readability-shadow ${
                                expense.type === 'credit'
                                  ? 'text-emerald-400'
                                  : isAnomaly
                                    ? 'text-amber-300'
                                    : 'text-white'
                              }`}
                            >
                              {expense.type === 'credit' ? '+' : '-'}
                              {conv.formatted}
                            </div>
                            {conv.isConverted && conv.originalFormatted && (
                              <span
                                className="text-[10px] font-mono text-slate-200 bg-white/10 px-1 py-0.5 rounded border border-white/15 block mt-0.5 tabular-nums"
                                title={`Original: ${conv.originalFormatted}`}
                              >
                                Orig: {conv.originalFormatted}
                              </span>
                            )}
                            {!conv.isConverted && (
                              <span className="text-[11px] text-slate-300 block font-medium">
                                {expense.paymentMethod || 'Card / QRIS'}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    <div className="flex items-center space-x-1">
                      {isAnomaly && onFixAnomaly && (
                        <button
                          onClick={() => onFixAnomaly(anomaly, expense)}
                          className="p-1.5 rounded hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                          title={
                            language === 'id'
                              ? 'Perbaiki Anomali'
                              : 'Fix Anomaly'
                          }
                          aria-label="Fix anomaly details"
                        >
                          <Wrench className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      )}

                      {hasEmailSource && (
                        <button
                          onClick={() => onViewEmailDetail(expense)}
                          className="p-1.5 rounded hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                          title={t.feed.viewReceipt}
                          aria-label="View receipt"
                        >
                          <ExternalLink
                            className="w-3.5 h-3.5"
                            aria-hidden="true"
                          />
                        </button>
                      )}

                      <button
                        id={`edit-expense-${expense.id}`}
                        onClick={() => onEditExpense(expense)}
                        className="p-1.5 rounded hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                        title={t.feed.edit}
                        aria-label="Edit transaction"
                      >
                        <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>

                      <button
                        id={`delete-expense-${expense.id}`}
                        onClick={() => onDeleteExpense(expense.id)}
                        className="p-1.5 rounded hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                        title={t.feed.delete}
                        aria-label="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </AnimatedGroup>
        )}

        {/* Cursor Pagination Control (Phase 3) */}
        {hasMoreExpenses && onLoadMoreExpenses && (
          <div className="mt-4 pt-3 border-t border-white/10 flex justify-center">
            <button
              id="load-more-expenses-btn"
              onClick={onLoadMoreExpenses}
              disabled={isLoadingMore}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-xs"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#38BDF8] ${isLoadingMore ? 'animate-spin' : ''}`}
              />
              <span>
                {isLoadingMore
                  ? 'Memuat data...'
                  : 'Muat Lebih Banyak Transaksi (Cursor Page)'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
