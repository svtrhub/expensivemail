import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Expense, ExpenseCategory, UserProfile } from '../types';
import {
  SupportedCurrency,
  convertCurrency,
  DEFAULT_EXCHANGE_RATE_DB,
} from '../services/currency';
import { Translations } from '../services/translations';
import {
  exportExecutiveSummaryToPDF,
  exportExpensesToCSV,
  exportAuditStatementToJSON,
  buildAuditStatementJSON,
} from '../services/exportService';
import {
  Download,
  X,
  CheckCircle,
  FileDown,
  Code,
  Copy,
  Check,
  ChevronDown,
} from 'lucide-react';

interface ReportStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  userProfile: UserProfile | null;
  currency: SupportedCurrency;
  ratesToIDR?: Record<SupportedCurrency, number>;
  language?: 'en' | 'id';
  t: Translations;
}

export const ReportStatementModal: React.FC<ReportStatementModalProps> = ({
  isOpen,
  onClose,
  expenses,
  userProfile,
  currency,
  ratesToIDR = DEFAULT_EXCHANGE_RATE_DB.ratesToIDR,
  language = 'id',
  t,
}) => {
  const [dateRange, setDateRange] = useState<
    'this_month' | 'last_month' | 'last_30_days' | 'year_to_date' | 'all'
  >('this_month');
  const [filterType, setFilterType] = useState<
    'all' | 'business_only' | 'tax_deductible_only'
  >('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedJSON, setCopiedJSON] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [statementRef] = useState(
    () => `STMT-${Date.now().toString().slice(-6)}`
  );

  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setIsExportMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExportMenuOpen(false);
      }
    };

    if (isExportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExportMenuOpen]);

  const filteredExpenses = useMemo(() => {
    if (!isOpen) return [];
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    return expenses.filter((exp) => {
      const expDate = new Date(exp.date);

      // Date range filtering
      if (dateRange === 'this_month') {
        if (
          expDate.getMonth() !== thisMonth ||
          expDate.getFullYear() !== thisYear
        )
          return false;
      } else if (dateRange === 'last_month') {
        const targetMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const targetYear = thisMonth === 0 ? thisYear - 1 : thisYear;
        if (
          expDate.getMonth() !== targetMonth ||
          expDate.getFullYear() !== targetYear
        )
          return false;
      } else if (dateRange === 'last_30_days') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
        if (expDate < thirtyDaysAgo) return false;
      } else if (dateRange === 'year_to_date') {
        if (expDate.getFullYear() !== thisYear) return false;
      }

      // Business / Tax filters
      if (filterType === 'business_only' && !exp.isBusinessExpense)
        return false;
      if (filterType === 'tax_deductible_only' && !exp.isTaxDeductible)
        return false;

      // Category filter
      if (selectedCategory !== 'ALL' && exp.category !== selectedCategory)
        return false;

      return true;
    });
  }, [isOpen, expenses, dateRange, filterType, selectedCategory]);

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case 'this_month':
        return language === 'id' ? 'Bulan Ini (Aug 2026)' : 'Aug 2026';
      case 'last_month':
        return language === 'id' ? 'Bulan Lalu' : 'Last Month';
      case 'last_30_days':
        return language === 'id' ? '30 Hari Terakhir' : 'Last 30 Days';
      case 'year_to_date':
        return `YTD ${new Date().getFullYear()}`;
      case 'all':
        return language === 'id' ? 'Semua Periode' : 'All Expenses';
      default:
        return dateRange;
    }
  };

  const getFilterTypeLabel = () => {
    switch (filterType) {
      case 'business_only':
        return language === 'id'
          ? 'Klaim Bisnis / Reimbursable'
          : 'Business Claims';
      case 'tax_deductible_only':
        return language === 'id'
          ? 'Pengurang Pajak Saja'
          : 'Tax Deductible Only';
      default:
        return language === 'id' ? 'Semua Pengeluaran' : 'All Expenses';
    }
  };

  // Build the audited JSON statement model
  const auditedStatement = useMemo(() => {
    return buildAuditStatementJSON({
      expenses: filteredExpenses,
      userProfile,
      currency,
      ratesToIDR,
      periodLabel: getDateRangeLabel(),
      scopeLabel: getFilterTypeLabel(),
      statementRef,
    });
  }, [
    filteredExpenses,
    userProfile,
    currency,
    ratesToIDR,
    dateRange,
    filterType,
    statementRef,
  ]);

  if (!isOpen) return null;

  const handleExportPDF = () => {
    const success = exportExecutiveSummaryToPDF({
      expenses: filteredExpenses,
      userProfile,
      currency,
      ratesToIDR,
      language,
      dateRangeLabel: getDateRangeLabel(),
      filterTypeLabel: getFilterTypeLabel(),
      statementRef,
    });

    if (success) {
      setStatusMessage(
        language === 'id'
          ? 'Dokumen PDF Laporan berhasil diunduh!'
          : 'PDF Statement downloaded successfully!'
      );
      setTimeout(() => setStatusMessage(null), 3500);
    } else {
      setStatusMessage(
        language === 'id'
          ? 'Gagal mengunduh PDF. Silakan gunakan opsi Cetak / Print.'
          : 'PDF generation error. Please use Print option.'
      );
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleExportJSON = () => {
    const success = exportAuditStatementToJSON({
      expenses: filteredExpenses,
      userProfile,
      currency,
      ratesToIDR,
      periodLabel: getDateRangeLabel(),
      scopeLabel: getFilterTypeLabel(),
      statementRef,
    });

    if (success) {
      setStatusMessage(
        language === 'id'
          ? 'Berkas JSON Audit Keuangan berhasil diunduh!'
          : 'Audited Statement JSON exported successfully!'
      );
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const handleCopyJSON = async () => {
    try {
      const jsonStr = JSON.stringify(auditedStatement, null, 2);
      await navigator.clipboard.writeText(jsonStr);
      setCopiedJSON(true);
      setStatusMessage(
        language === 'id'
          ? 'JSON Audit berhasil disalin ke clipboard!'
          : 'Audited Statement JSON copied to clipboard!'
      );
      setTimeout(() => setCopiedJSON(false), 2000);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (e) {
      console.warn('Clipboard copy error:', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const success = exportExpensesToCSV({
      expenses: filteredExpenses,
      currency,
      ratesToIDR,
      filenamePrefix: `Expense_Statement_${statementRef}`,
    });

    if (success) {
      setStatusMessage(
        language === 'id'
          ? 'Laporan spreadsheet CSV berhasil diekspor!'
          : 'CSV spreadsheet report exported successfully!'
      );
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const {
    statement: stmtMeta,
    account,
    kpi,
    categories,
    transactions,
    categories_insight,
  } = auditedStatement;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white">
      <div
        id="report-statement-modal"
        className="glass-modal rounded-2xl max-w-5xl w-full p-4 sm:p-7 shadow-[0_16px_48px_rgba(0,0,0,0.6)] max-h-[94vh] flex flex-col animate-in fade-in-50 zoom-in-95 transition-colors text-white print:border-none print:shadow-none print:max-h-none print:p-0 print:bg-white print:text-black"
      >
        <div className="glass-content flex flex-col flex-1 min-h-0">
          {/* Header Toolbar (Hidden in Print) */}
          <div className="flex items-start justify-between pb-3.5 border-b border-white/10 gap-3 print:hidden">
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-editorial tracking-tight">
                  Expense & Reimbursement Statement
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Verified & Audited
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Official Financial Statement & Expense Audit Automated
                Verification • {stmtMeta.ref}
              </p>
            </div>

            {/* Action Toolbar */}
            <div className="flex items-center space-x-2 shrink-0">
              {/* Single Consolidated Export Dropdown */}
              <div className="relative" ref={exportMenuRef}>
                <button
                  id="report-export-dropdown-btn"
                  onClick={() => setIsExportMenuOpen((prev) => !prev)}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#2251FF]/40 hover:bg-[#2251FF]/60 text-white text-xs font-bold rounded-xl border border-[#2251FF]/60 hover:border-[#2251FF] backdrop-blur-xl shadow-[0_4px_20px_rgba(34,81,255,0.25)] transition-all cursor-pointer active:scale-95"
                  title="Export statement in multiple formats"
                  aria-haspopup="true"
                  aria-expanded={isExportMenuOpen}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Data</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isExportMenuOpen && (
                  <div
                    id="report-export-menu"
                    className="absolute right-0 mt-1.5 w-60 rounded-2xl bg-[#081B2E]/95 backdrop-blur-2xl border border-white/15 shadow-[0_16px_48px_rgba(0,0,0,0.6)] py-1.5 z-50 animate-in fade-in-50 zoom-in-95 text-slate-100"
                    role="menu"
                  >
                    <button
                      id="export-option-pdf"
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        handleExportPDF();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs font-medium hover:bg-white/10 transition-colors cursor-pointer text-left rounded-xl"
                      role="menuitem"
                    >
                      <FileDown className="w-4 h-4 text-[#38BDF8] shrink-0" />
                      <div>
                        <div className="font-semibold text-white">
                          PDF Document (.pdf)
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Official A4 Audited Statement
                        </div>
                      </div>
                    </button>

                    <button
                      id="export-option-json"
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        handleExportJSON();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs font-medium hover:bg-white/10 transition-colors cursor-pointer text-left rounded-xl"
                      role="menuitem"
                    >
                      <Code className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-white">
                          JSON Schema (.json)
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Machine-readable audit file
                        </div>
                      </div>
                    </button>

                    <button
                      id="export-option-csv"
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        handleDownloadCSV();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs font-medium hover:bg-white/10 transition-colors cursor-pointer text-left rounded-xl"
                      role="menuitem"
                    >
                      <Download className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-white">
                          CSV Spreadsheet (.csv)
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Excel / Sheets ledger table
                        </div>
                      </div>
                    </button>

                    <div className="h-px bg-white/10 my-1" />

                    <button
                      id="export-option-copy-json"
                      onClick={() => {
                        handleCopyJSON();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs font-medium hover:bg-white/10 transition-colors cursor-pointer text-left rounded-xl"
                      role="menuitem"
                    >
                      {copiedJSON ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-semibold text-white">
                          {copiedJSON
                            ? 'JSON Copied!'
                            : 'Copy JSON to Clipboard'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Copy audit schema to clipboard
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Status Toast Banner */}
          {statusMessage && (
            <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs px-3 py-1.5 rounded-lg my-2 flex items-center space-x-2 animate-in fade-in-50 print:hidden">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-medium">{statusMessage}</span>
            </div>
          )}

          {/* Filter Controls (Hidden in Print) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2.5 border-b border-white/10 print:hidden bg-white/5 backdrop-blur-xl px-3 -mx-4 sm:-mx-7 mt-0 mb-3 text-xs">
            <div>
              <label className="block text-[10.5px] font-semibold text-slate-300 mb-0.5">
                Period / Rentang Waktu
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                style={{ colorScheme: 'dark' }}
                className="w-full px-2.5 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-xs text-white focus:outline-none focus:border-[#2251FF]"
              >
                <option value="this_month" className="bg-[#051C2C] text-white">
                  Bulan Ini (Aug 2026)
                </option>
                <option value="last_month" className="bg-[#051C2C] text-white">
                  Bulan Lalu
                </option>
                <option
                  value="last_30_days"
                  className="bg-[#051C2C] text-white"
                >
                  30 Hari Terakhir
                </option>
                <option
                  value="year_to_date"
                  className="bg-[#051C2C] text-white"
                >
                  Year-to-Date (YTD 2026)
                </option>
                <option value="all" className="bg-[#051C2C] text-white">
                  Semua Transaksi Tersimpan
                </option>
              </select>
            </div>

            <div>
              <label className="block text-[10.5px] font-semibold text-slate-300 mb-0.5">
                Scope / Cakupan Audit
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                style={{ colorScheme: 'dark' }}
                className="w-full px-2.5 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-xs text-white focus:outline-none focus:border-[#2251FF]"
              >
                <option value="all" className="bg-[#051C2C] text-white">
                  Semua Pengeluaran (Personal & Bisnis)
                </option>
                <option
                  value="business_only"
                  className="bg-[#051C2C] text-white"
                >
                  Klaim Bisnis / Reimbursable Saja
                </option>
                <option
                  value="tax_deductible_only"
                  className="bg-[#051C2C] text-white"
                >
                  Pengurang Pajak (Tax Deductible) Saja
                </option>
              </select>
            </div>

            <div>
              <label className="block text-[10.5px] font-semibold text-slate-300 mb-0.5">
                Category Filter
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="w-full px-2.5 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-xs text-white focus:outline-none focus:border-[#2251FF]"
              >
                <option value="ALL" className="bg-[#051C2C] text-white">
                  Semua Kategori (MECE)
                </option>
                {Object.keys(t.categories).map((cat) => (
                  <option
                    key={cat}
                    value={cat}
                    className="bg-[#051C2C] text-white"
                  >
                    {t.categories[cat as ExpenseCategory] || cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Statement Document Canvas (Screen Preview & Exact A4 Print) */}
          <div
            id="printable-statement-content"
            className="flex-1 overflow-y-auto space-y-4 pr-1 p-3 bg-[#051C2C]/80 backdrop-blur-xl text-slate-100 font-sans print:p-0 print:overflow-visible print:bg-white print:text-black rounded-xl border border-white/15"
          >
            {/* Header Container */}
            <div className="border-b-2 border-[#051C2C] dark:border-[#2251FF] pb-2.5 mb-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
              <div>
                <div className="text-[9px] font-bold text-[#2251FF] dark:text-[#38BDF8] uppercase tracking-widest">
                  EXPENSIVE MAIL • AUTOMATED EXPENSE INTELLIGENCE
                </div>
                <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#051C2C] dark:text-white leading-tight">
                  {stmtMeta.title}
                </h1>
                <p className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">
                  {stmtMeta.subtitle}
                </p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <div className="text-xs font-bold font-mono text-[#051C2C] dark:text-white">
                  REF: {stmtMeta.ref}
                </div>
                <div className="text-[10px] text-[#64748B] dark:text-slate-400">
                  Date: {stmtMeta.date}
                </div>
                <div className="text-[10px] font-bold text-[#107C41] dark:text-emerald-400">
                  • VERIFIED & AUDITED
                </div>
              </div>
            </div>

            {/* Metadata Row Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-2.5 border-b border-[#E2E8F0] dark:border-[#1E3A5F] text-[10.5px]">
              <div>
                <span className="block text-[9px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wide">
                  REPORT OWNER
                </span>
                <span className="font-bold text-[#051C2C] dark:text-white">
                  {account.owner}
                </span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wide">
                  ACCOUNT EMAIL
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {account.email}
                </span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wide">
                  PERIOD & SCOPE
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {account.period} • {account.scope}
                </span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wide">
                  BASE CURRENCY
                </span>
                <span className="font-bold text-[#051C2C] dark:text-white">
                  {account.currency}
                </span>
              </div>
            </div>

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Box 1: Total Expenditure */}
              <div className="bg-[#F8F9FA] dark:bg-[#0D2238] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-lg p-2.5">
                <span className="text-[9px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider block">
                  TOTAL EXPENDITURE
                </span>
                <div className="text-base sm:text-lg font-bold font-mono text-[#051C2C] dark:text-white mt-0.5">
                  {kpi.total_amount}
                </div>
                <span className="text-[9.5px] text-[#64748B] dark:text-slate-400 block mt-0.5">
                  {kpi.transaction_count} verified transactions
                </span>
              </div>

              {/* Box 2: Business Claims */}
              <div className="bg-[#F0F6FF] dark:bg-[#0D2E78]/30 border border-[#C5DCFA] dark:border-[#2251FF]/40 rounded-lg p-2.5">
                <span className="text-[9px] font-bold text-[#2251FF] dark:text-[#38BDF8] uppercase tracking-wider block">
                  BUSINESS CLAIMS
                </span>
                <div className="text-base sm:text-lg font-bold font-mono text-[#2251FF] dark:text-[#38BDF8] mt-0.5">
                  {kpi.reimbursable_amount}
                </div>
                <span className="text-[9.5px] text-[#2251FF] dark:text-[#38BDF8] block mt-0.5">
                  {kpi.reimbursable_share} of total • Reimbursable
                </span>
              </div>

              {/* Box 3: Tax Deductible */}
              <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5">
                <span className="text-[9px] font-bold text-[#107C41] dark:text-emerald-400 uppercase tracking-wider block">
                  TAX DEDUCTIBLE
                </span>
                <div className="text-base sm:text-lg font-bold font-mono text-[#107C41] dark:text-emerald-400 mt-0.5">
                  {kpi.tax_deductible_amount}
                </div>
                <span className="text-[9.5px] text-[#107C41] dark:text-emerald-400 block mt-0.5">
                  Tax deduction potential
                </span>
              </div>

              {/* Box 4: Personal / Direct */}
              <div className="bg-[#F8F9FA] dark:bg-[#0D2238] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-lg p-2.5">
                <span className="text-[9px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider block">
                  PERSONAL / DIRECT
                </span>
                <div className="text-base sm:text-lg font-bold font-mono text-[#051C2C] dark:text-white mt-0.5">
                  {kpi.personal_amount}
                </div>
                <span className="text-[9.5px] text-[#64748B] dark:text-slate-400 block mt-0.5">
                  {kpi.personal_share} of total spend
                </span>
              </div>
            </div>

            {/* Section 1: Category Spend Distribution */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-xs font-bold text-[#051C2C] dark:text-white">
                  1. Category Spend Distribution
                </h3>
                <span className="text-[10px] italic text-[#64748B] dark:text-slate-400">
                  {categories_insight}
                </span>
              </div>

              <div className="border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-lg overflow-hidden shadow-2xs">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-[#051C2C] text-white text-[9.5px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-1.5">EXPENSE CATEGORY</th>
                      <th className="px-2 py-1.5 text-center">COUNT</th>
                      <th className="px-3 py-1.5 text-right">
                        AMOUNT ({currency})
                      </th>
                      <th className="px-2 py-1.5 text-right">SHARE (%)</th>
                      <th className="px-3 py-1.5 w-40">
                        DISTRIBUTION BREAKDOWN
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1E3A5F]">
                    {categories.map((cat, idx) => (
                      <tr
                        key={cat.name}
                        className={
                          idx % 2 === 1
                            ? 'bg-[#F8F9FA] dark:bg-[#0D2238]/40'
                            : 'bg-white dark:bg-[#051C2C]'
                        }
                      >
                        <td className="px-3 py-1.5 font-semibold text-[#051C2C] dark:text-slate-100">
                          {cat.name}
                        </td>
                        <td className="px-2 py-1.5 text-center text-slate-600 dark:text-slate-300 font-mono">
                          {cat.count}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono font-bold text-[#051C2C] dark:text-white">
                          {cat.amount}
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono text-slate-600 dark:text-slate-300">
                          {cat.share}
                        </td>
                        <td className="px-3 py-1.5">
                          <div className="w-full bg-[#EBF3FB] dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-[#2251FF] h-full rounded-full transition-[width,background-color] duration-500"
                              style={{
                                width: `${Math.min(Math.max(cat.percentage, 2), 100)}%`,
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {/* TOTAL CONSOLIDATED Row */}
                    <tr className="bg-slate-100 dark:bg-[#0D2238] font-bold text-[#051C2C] dark:text-white border-t-2 border-[#051C2C] dark:border-[#2251FF]">
                      <td className="px-3 py-1.5 uppercase">
                        TOTAL CONSOLIDATED
                      </td>
                      <td className="px-2 py-1.5 text-center font-mono">
                        {kpi.transaction_count}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-[#051C2C] dark:text-white">
                        {kpi.total_amount}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono">
                        100.0%
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="w-full bg-[#2251FF] h-2 rounded-full" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: Itemized Transaction Ledger */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-xs font-bold text-[#051C2C] dark:text-white">
                  2. Itemized Transaction Ledger
                </h3>
                <span className="text-[10px] text-[#64748B] dark:text-slate-400">
                  {transactions.length} parsed transactions reconciled against
                  digital receipts • Audited
                </span>
              </div>

              <div className="border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-lg overflow-hidden shadow-2xs">
                <table className="w-full text-left text-[10.5px] border-collapse">
                  <thead className="bg-[#051C2C] text-white text-[9.5px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-2.5 py-1.5">DATE</th>
                      <th className="px-3 py-1.5">MERCHANT & DESCRIPTION</th>
                      <th className="px-3 py-1.5">CATEGORY</th>
                      <th className="px-3 py-1.5">PAYMENT METHOD</th>
                      <th className="px-2 py-1.5 text-center">
                        CLAIM / STATUS
                      </th>
                      <th className="px-3 py-1.5 text-right">
                        AMOUNT ({currency})
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1E3A5F]">
                    {transactions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-4 text-center text-slate-400 text-xs"
                        >
                          No transactions recorded for this audit scope.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx, idx) => {
                        let claimStatus = 'Direct';
                        if (tx.is_reimbursable && tx.is_tax_deductible) {
                          claimStatus = 'Business • Tax';
                        } else if (tx.is_reimbursable) {
                          claimStatus = 'Business';
                        } else if (tx.is_tax_deductible) {
                          claimStatus = 'Tax';
                        }

                        return (
                          <tr
                            key={`${tx.date}-${tx.merchant}-${idx}`}
                            className={
                              idx % 2 === 1
                                ? 'bg-[#F8F9FA] dark:bg-[#0D2238]/40'
                                : 'bg-white dark:bg-[#051C2C]'
                            }
                          >
                            <td className="px-2.5 py-1.5 font-mono text-slate-600 dark:text-slate-400 text-[10px]">
                              {tx.date}
                            </td>
                            <td className="px-3 py-1.5 font-bold text-[#051C2C] dark:text-white">
                              {tx.merchant}
                            </td>
                            <td className="px-3 py-1.5 text-slate-700 dark:text-slate-300">
                              {tx.category}
                            </td>
                            <td className="px-3 py-1.5 text-slate-600 dark:text-slate-400 font-mono text-[10px]">
                              {tx.payment_method}
                            </td>
                            <td className="px-2 py-1.5 text-center">
                              {tx.is_reimbursable ? (
                                <span className="font-bold text-[#2251FF] dark:text-[#38BDF8]">
                                  {claimStatus}
                                </span>
                              ) : (
                                <span className="text-slate-500 dark:text-slate-400">
                                  {claimStatus}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono font-bold text-[#051C2C] dark:text-white">
                              <span
                                className={
                                  tx.is_reimbursable
                                    ? 'text-[#2251FF] dark:text-[#38BDF8]'
                                    : ''
                                }
                              >
                                {tx.amount}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Audit Verification Block */}
            <div className="pt-3 border-t border-[#E2E8F0] dark:border-[#1E3A5F] grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10.5px]">
              <div>
                <span className="block text-[9px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wide">
                  AUDITED BY (FINANCE & ACCOUNTING)
                </span>
                <span className="font-bold text-[#051C2C] dark:text-white block mt-0.5">
                  {auditedStatement.audit.auditor}
                </span>
                <span className="text-[9.5px] text-[#64748B] dark:text-slate-400">
                  {auditedStatement.audit.audit_note}
                </span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wide">
                  APPROVED BY
                </span>
                <span className="font-bold text-[#051C2C] dark:text-white block mt-0.5">
                  {auditedStatement.audit.approver}
                </span>
                <span className="text-[9.5px] text-[#64748B] dark:text-slate-400">
                  Report Owner • Approved
                </span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wide">
                  SYSTEM VERIFICATION
                </span>
                <span className="font-mono font-bold text-[#051C2C] dark:text-white block mt-0.5">
                  {stmtMeta.ref}-AUTH
                </span>
                <span className="text-[9.5px] text-[#64748B] dark:text-slate-400">
                  Expensive Mail Engine v2.4
                </span>
              </div>
            </div>

            {/* Footnote */}
            <div className="pt-2 text-center text-[9px] text-[#64748B] dark:text-slate-400 border-t border-dashed border-[#E2E8F0] dark:border-[#1E3A5F]">
              Expensive Mail Ledger Intelligence • Ref: {stmtMeta.ref} •
              Confidential • Prepared for Internal Accounting & Tax Filing
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
