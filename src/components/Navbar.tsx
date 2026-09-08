import React, { useState, useRef, useEffect } from 'react';
import {
  RefreshCw,
  Plus,
  Zap,
  Inbox,
  CreditCard,
  Building2,
  ShieldCheck,
  ChevronDown,
  Coins,
  Globe,
  Settings,
  Download,
  RotateCcw,
  User as UserIcon,
  LogOut,
  UserPlus,
  SlidersHorizontal,
  FileText,
  Check,
  Bell,
  AlertTriangle,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { UserProfile, ThemeMode } from '../types';
import {
  SupportedCurrency,
  CURRENCIES,
  formatCurrency,
} from '../services/currency';
import { Translations, LanguageCode } from '../services/translations';

interface NavbarProps {
  user: User | null;
  userProfile?: UserProfile | null;
  hasGmailAccess: boolean;
  isSyncing: boolean;
  autoSyncEnabled: boolean;
  onToggleAutoSync: () => void;
  onSyncNow: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onOpenCreateAccount: () => void;
  onOpenAddModal: () => void;
  onOpenSyncLogs: () => void;
  onOpenBankManager: () => void;
  onOpenRulesModal?: () => void;
  onOpenReportModal?: () => void;
  pendingReviewCount?: number;
  onOpenProvenanceQueue?: () => void;
  lastSynced: Date | null;
  totalSyncedCount?: number;
  totalAccountBalance?: number;
  activeAccountsCount?: number;
  activeAnomaliesCount?: number;
  onOpenAnomaliesList?: () => void;
  currency: SupportedCurrency;
  onSelectCurrency?: (c: SupportedCurrency) => void;
  language?: LanguageCode;
  onSelectLanguage?: (l: LanguageCode) => void;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
  onSelectTheme?: (theme: ThemeMode) => void;
  t: Translations;
  onOpenSettingsModal: () => void;
  onOpenAccountModal: () => void;
  onOpenCurrencyModal: () => void;
  onOpenLanguageModal?: () => void;
  onOpenLandingPage?: () => void;
  onExportCSV?: () => void;
  onResetData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  userProfile,
  hasGmailAccess,
  isSyncing,
  autoSyncEnabled,
  onToggleAutoSync,
  onSyncNow,
  onLogin,
  onLogout,
  onOpenCreateAccount,
  onOpenAddModal,
  onOpenSyncLogs,
  onOpenBankManager,
  onOpenRulesModal,
  onOpenReportModal,
  pendingReviewCount = 0,
  onOpenProvenanceQueue,
  lastSynced,
  totalAccountBalance,
  activeAccountsCount = 0,
  activeAnomaliesCount = 0,
  onOpenAnomaliesList,
  currency,
  language = 'id',
  theme = 'light',
  onToggleTheme,
  onSelectTheme,
  t,
  onOpenAccountModal,
  onOpenCurrencyModal,
  onOpenSettingsModal,
  onOpenLanguageModal,
  onOpenLandingPage,
  onExportCSV,
  onResetData,
}) => {
  const [isExpenseSyncOpen, setIsExpenseSyncOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const expenseSyncRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const currentCurrency = CURRENCIES[currency] || CURRENCIES.IDR;
  const displayName =
    userProfile?.fullName ||
    user?.displayName ||
    (language === 'id' ? 'Pengguna' : 'User');
  const displayEmail = userProfile?.email || user?.email || '';
  const displayInitial = (displayName || 'U').charAt(0).toUpperCase();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        expenseSyncRef.current &&
        !expenseSyncRef.current.contains(event.target as Node)
      ) {
        setIsExpenseSyncOpen(false);
      }
      if (
        toolsMenuRef.current &&
        !toolsMenuRef.current.contains(event.target as Node)
      ) {
        setIsToolsOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      id="app-header"
      className="sticky top-2 sm:top-3 z-40 max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 transition-all"
    >
      <div className="glass-navbar w-full rounded-full px-4 sm:px-6 py-1.5 sm:py-2 transition-all animate-island-glow">
        <div className="relative z-10 flex items-center justify-between h-10 sm:h-12 gap-1.5 sm:gap-2">
          {/* Brand Wordmark & Executive Badge (Dense & Clean) */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 min-w-0 shrink">
            {onOpenLandingPage ? (
              <button
                onClick={onOpenLandingPage}
                className="flex items-center space-x-1 sm:space-x-1.5 min-w-0 shrink hover:opacity-85 transition-opacity cursor-pointer text-left focus:outline-none"
                title={
                  language === 'id'
                    ? 'Lihat Halaman Utama / Landing Page'
                    : 'View Landing Page'
                }
              >
                <span className="font-editorial text-sm sm:text-base md:text-lg font-bold tracking-tight text-white truncate">
                  Expensive Mail
                </span>
                <span
                  className="inline-flex items-center justify-center p-0.5 sm:p-1 rounded-md bg-[#0D2E78]/60 text-[#60A5FA] border border-[#1E40AF]/60 shrink-0 backdrop-blur-md"
                  title={
                    language === 'id'
                      ? 'Keamanan Terverifikasi'
                      : 'Verified Security'
                  }
                  aria-label="Security Badge"
                >
                  <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </span>
              </button>
            ) : (
              <>
                <span className="font-editorial text-sm sm:text-base md:text-lg font-bold tracking-tight text-white truncate">
                  Expensive Mail
                </span>
                <span
                  className="inline-flex items-center justify-center p-0.5 sm:p-1 rounded-md bg-[#0D2E78]/60 text-[#60A5FA] border border-[#1E40AF]/60 shrink-0 backdrop-blur-md"
                  title={
                    language === 'id'
                      ? 'Keamanan Terverifikasi'
                      : 'Verified Security'
                  }
                  aria-label="Security Badge"
                >
                  <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </span>
              </>
            )}
          </div>

          {/* Right Action Bar: Unified Expense & Sync Button + Dedicated Tools Dropdown + Theme Slider + Account */}
          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
            {/* Live Feed Status Pill (Desktop only) */}
            <div className="hidden xl:flex items-center bg-[#0D2E78]/35 backdrop-blur-xl h-8 md:h-9 px-2.5 rounded-xl border border-white/10 text-[11px] text-[#E2E8F0] space-x-1.5 shrink-0 transition-colors">
              <span
                className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-[#2251FF] animate-ping' : hasGmailAccess ? 'bg-[#2251FF]' : 'bg-[#107C41]'}`}
              />
              <span className="font-medium whitespace-nowrap">
                {isSyncing
                  ? language === 'id'
                    ? 'Memindai…'
                    : 'Scanning…'
                  : hasGmailAccess
                    ? t.menu.connectedGmail
                    : language === 'id'
                      ? 'Live Ingestion'
                      : 'Live Sync Active'}
              </span>
              {lastSynced && !isSyncing && (
                <span className="text-[#94A3B8] border-l border-white/10 pl-1.5 font-mono text-[10px]">
                  {new Date(lastSynced).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>

            {/* UNIFIED PRIMARY ACTION: "Expense & Sync" Combined Button with Quick Options */}
            <div className="relative" ref={expenseSyncRef}>
              <div className="inline-flex items-center rounded-xl bg-[#2251FF]/35 hover:bg-[#2251FF]/50 backdrop-blur-xl text-white shadow-[0_4px_20px_rgba(34,81,255,0.25)] transition-all overflow-hidden border border-[#2251FF]/50 hover:border-[#2251FF]">
                {/* Main Action Button */}
                <button
                  id="unified-expense-sync-btn"
                  onClick={() => setIsExpenseSyncOpen(!isExpenseSyncOpen)}
                  className="h-8 sm:h-9 px-2.5 sm:px-3 inline-flex items-center space-x-1.5 text-xs font-bold transition-all cursor-pointer active:scale-95 shrink-0"
                  title={
                    language === 'id'
                      ? 'Tambah Pengeluaran & Sinkronkan Email'
                      : 'Add Expense & Sync Inbox'
                  }
                  aria-label="Expense and Sync Hub"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 shrink-0 ${isSyncing ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  <span className="whitespace-nowrap text-[11px] sm:text-xs font-bold tracking-tight">
                    {isSyncing
                      ? language === 'id'
                        ? 'Memindai…'
                        : 'Syncing…'
                      : language === 'id'
                        ? 'Catat & Sinkron'
                        : 'Expense & Sync'}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 text-white/80 transition-transform duration-200 ${isExpenseSyncOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>
              </div>

              {/* Expense and Sync Dropdown Hub */}
              {isExpenseSyncOpen && (
                <div className="glass-dropdown absolute right-0 top-full mt-1.5 w-56 sm:w-64 max-w-[calc(100vw-1.5rem)] rounded-2xl p-2 z-50 animate-popover text-xs">
                  <div className="px-2.5 py-1.5 border-b border-white/10 mb-1">
                    <p className="font-bold text-[#051C2C] dark:text-[#F8FAFC] text-xs font-editorial">
                      {language === 'id'
                        ? 'Catat & Sinkronisasi'
                        : 'Expense & Ingestion'}
                    </p>
                  </div>

                  {/* Option 1: Sync Inbox & Bank Feeds */}
                  <button
                    id="menu-sync-inbox-action"
                    onClick={() => {
                      setIsExpenseSyncOpen(false);
                      onSyncNow();
                    }}
                    disabled={isSyncing}
                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-[#F0F4F8] dark:hover:bg-[#112842] flex items-center space-x-2.5 transition-colors cursor-pointer group disabled:opacity-50"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#2251FF] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`}
                      />
                    </div>
                    <p className="font-semibold text-[#051C2C] dark:text-white text-xs leading-tight truncate flex-1 min-w-0">
                      {t.menu.syncInbox}
                    </p>
                  </button>

                  {/* Option 2: Add Manual Expense / OCR */}
                  <button
                    id="menu-add-expense-action"
                    onClick={() => {
                      setIsExpenseSyncOpen(false);
                      onOpenAddModal();
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-[#F0F4F8] dark:hover:bg-[#112842] flex items-center space-x-2.5 transition-colors cursor-pointer group mt-0.5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#051C2C] dark:bg-white text-white dark:text-[#051C2C] flex items-center justify-center shrink-0 shadow-2xs">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                    <p className="font-semibold text-[#051C2C] dark:text-white text-xs leading-tight truncate flex-1 min-w-0">
                      {t.menu.addExpense}
                    </p>
                  </button>
                </div>
              )}
            </div>

            {/* Live Flagged Sender Review Queue Pill Button if items pending */}
            {pendingReviewCount > 0 && onOpenProvenanceQueue && (
              <button
                id="navbar-provenance-queue-pill-btn"
                onClick={onOpenProvenanceQueue}
                className="h-8 sm:h-9 px-2 sm:px-2.5 inline-flex items-center space-x-1.5 rounded-xl bg-amber-500/30 backdrop-blur-xl border border-amber-400/50 hover:bg-amber-500/45 text-amber-100 font-bold text-xs shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all cursor-pointer animate-pulse shrink-0"
                title={
                  language === 'id'
                    ? `${pendingReviewCount} email perlu verifikasi domain`
                    : `${pendingReviewCount} emails in sender review queue`
                }
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                <span className="font-mono">{pendingReviewCount}</span>
                <span className="hidden lg:inline text-[11px]">
                  {language === 'id' ? 'Verifikasi' : 'Review'}
                </span>
              </button>
            )}

            {/* DEDICATED DROPDOWN MENU FOR COMPLEX / ADVANCED FEATURES */}
            <div className="relative" ref={toolsMenuRef}>
              <button
                id="main-tools-menu-btn"
                onClick={() => setIsToolsOpen(!isToolsOpen)}
                className={`h-8 sm:h-9 w-8 sm:w-auto px-0 sm:px-2.5 inline-flex items-center justify-center space-x-0 sm:space-x-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shrink-0 active:scale-95 backdrop-blur-xl ${
                  isToolsOpen
                    ? 'bg-[#2251FF]/45 border-[#2251FF] text-white shadow-[0_0_20px_rgba(34,81,255,0.35)]'
                    : 'bg-white/5 hover:bg-white/12 border-white/15 hover:border-[#2251FF]/40 text-[#E2E8F0] hover:text-white shadow-[0_4px_16px_rgba(0,0,0,0.2)]'
                }`}
                title={
                  language === 'id'
                    ? 'Buka Fitur & Alat'
                    : 'Open Tools & Configuration'
                }
                aria-label="Operations Menu"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" />
                <span className="hidden md:inline text-[11px] whitespace-nowrap">
                  {language === 'id' ? 'Fitur & Alat' : 'Tools'}
                </span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 hidden sm:inline ${isToolsOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dedicated Grouped Dropdown Panel */}
              {isToolsOpen && (
                <div className="glass-dropdown absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] max-h-[calc(100vh-5.5rem)] overflow-y-auto rounded-2xl p-2 z-[100] origin-top-right shadow-2xl text-xs">
                  {/* Dropdown Header */}
                  <div className="px-2.5 py-2 border-b border-white/10 mb-1.5 flex items-center justify-between">
                    <h4 className="font-bold text-[#F8FAFC] font-editorial text-xs tracking-tight">
                      {language === 'id'
                        ? 'Pusat Alat & Fitur'
                        : 'Operations & Tools'}
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F0F4F8] dark:bg-[#163354] text-[#051C2C] dark:text-[#F8FAFC] font-bold border border-[#CBD5E1] dark:border-[#2A486F]">
                      {currentCurrency.code} • {language.toUpperCase()}
                    </span>
                  </div>

                  {/* FINANCIAL DATA & AUTOMATION TOOLS */}
                  <div className="space-y-1">
                    {/* Connected Bank Accounts */}
                    <button
                      id="menu-open-bank-manager"
                      onClick={() => {
                        setIsToolsOpen(false);
                        onOpenBankManager();
                      }}
                      className="w-full px-2.5 py-2 rounded-lg hover:bg-[#F8F9FA] dark:hover:bg-[#112842] text-[#2D3748] dark:text-[#CBD5E1] hover:text-[#051C2C] dark:hover:text-white flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#F0F4F8] dark:bg-[#163354] text-[#2251FF] dark:text-[#60A5FA] flex items-center justify-center shrink-0 border border-[#E2E8F0] dark:border-[#2A486F]">
                          <CreditCard className="w-3.5 h-3.5" />
                        </div>
                        <p className="font-semibold text-[#051C2C] dark:text-[#F8FAFC] text-xs leading-tight truncate">
                          {language === 'id'
                            ? 'Rekening Bank & Kartu'
                            : 'Connected Bank Accounts'}
                        </p>
                      </div>
                      {typeof totalAccountBalance === 'number' && (
                        <span className="text-[10px] font-mono font-bold text-[#051C2C] dark:text-[#F8FAFC] bg-[#F0F4F8] dark:bg-[#163354] px-2 py-0.5 rounded border border-[#E2E8F0] dark:border-[#2A486F] shrink-0 ml-2">
                          {formatCurrency(totalAccountBalance, currency, true)}
                        </span>
                      )}
                    </button>

                    {/* Smart Ingestion Rules */}
                    {onOpenRulesModal && (
                      <button
                        id="menu-open-rules-modal"
                        onClick={() => {
                          setIsToolsOpen(false);
                          onOpenRulesModal();
                        }}
                        className="w-full px-2.5 py-2 rounded-lg hover:bg-[#F8F9FA] dark:hover:bg-[#112842] text-[#2D3748] dark:text-[#CBD5E1] hover:text-[#051C2C] dark:hover:text-white flex items-center justify-between transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
                            <Zap className="w-3.5 h-3.5" />
                          </div>
                          <p className="font-semibold text-[#051C2C] dark:text-[#F8FAFC] text-xs leading-tight truncate">
                            {language === 'id'
                              ? 'Smart Ingestion Rules'
                              : 'Ingestion Rules Engine'}
                          </p>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 border border-amber-200 dark:border-amber-800 shrink-0 ml-2">
                          Auto
                        </span>
                      </button>
                    )}

                    {/* Email Ingestion Logs & AI Parser */}
                    <button
                      id="menu-open-sync-drawer"
                      onClick={() => {
                        setIsToolsOpen(false);
                        onOpenSyncLogs();
                      }}
                      className="w-full px-2.5 py-2 rounded-lg hover:bg-[#F8F9FA] dark:hover:bg-[#112842] text-[#2D3748] dark:text-[#CBD5E1] hover:text-[#051C2C] dark:hover:text-white flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#F0F4F8] dark:bg-[#163354] text-[#2251FF] dark:text-[#60A5FA] flex items-center justify-center shrink-0 border border-[#E2E8F0] dark:border-[#2A486F]">
                          <Inbox className="w-3.5 h-3.5" />
                        </div>
                        <p className="font-semibold text-[#051C2C] dark:text-[#F8FAFC] text-xs leading-tight truncate">
                          {language === 'id'
                            ? 'Log Email & Parser'
                            : 'Email Ingestion Logs & Parser'}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#F8F9FA] dark:bg-[#112842] text-[#2D3748] dark:text-[#CBD5E1] border border-[#E2E8F0] dark:border-[#1E3A5F] shrink-0 ml-2">
                        Logs
                      </span>
                    </button>

                    {/* Sender Provenance & Review Queue */}
                    {onOpenProvenanceQueue && (
                      <button
                        id="menu-open-provenance-queue"
                        onClick={() => {
                          setIsToolsOpen(false);
                          onOpenProvenanceQueue();
                        }}
                        className="w-full px-2.5 py-2 rounded-lg hover:bg-[#F8F9FA] dark:hover:bg-[#112842] text-[#2D3748] dark:text-[#CBD5E1] hover:text-[#051C2C] dark:hover:text-white flex items-center justify-between transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                              pendingReviewCount > 0
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                : 'bg-[#F0F4F8] dark:bg-[#163354] text-[#2251FF] dark:text-[#60A5FA] border-[#E2E8F0] dark:border-[#2A486F]'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </div>
                          <p className="font-semibold text-[#051C2C] dark:text-[#F8FAFC] text-xs leading-tight truncate">
                            {language === 'id'
                              ? 'Verifikasi Domain Pengirim'
                              : 'Sender Provenance & Queue'}
                          </p>
                        </div>
                        {pendingReviewCount > 0 ? (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500 text-white shrink-0 ml-2 animate-pulse font-mono">
                            {pendingReviewCount}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0 ml-2">
                            Secure
                          </span>
                        )}
                      </button>
                    )}

                    {/* Auto-Sync Toggle Item */}
                    <div className="px-2.5 py-2 rounded-lg bg-[#F8F9FA] dark:bg-[#112842] border border-[#E2E8F0] dark:border-[#1E3A5F] flex items-center justify-between my-0.5">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#F0F4F8] dark:bg-[#163354] text-[#2251FF] dark:text-[#60A5FA] flex items-center justify-center shrink-0 border border-[#E2E8F0] dark:border-[#2A486F]">
                          <Zap
                            className={`w-3.5 h-3.5 ${autoSyncEnabled ? 'text-[#2251FF] dark:text-[#60A5FA]' : 'text-slate-400'}`}
                          />
                        </div>
                        <p className="font-semibold text-[#051C2C] dark:text-[#F8FAFC] text-xs leading-tight truncate">
                          {language === 'id'
                            ? 'Pemindaian Otomatis (45s)'
                            : 'Autonomous Auto-Sync (45s)'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={onToggleAutoSync}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors shrink-0 ml-2 ${
                          autoSyncEnabled
                            ? 'bg-[#2251FF] text-white shadow-2xs'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
                        }`}
                      >
                        {autoSyncEnabled ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>

                  {/* STANDARDS & PREFERENCES */}
                  <div className="pt-1.5 mt-1 border-t border-[#E2E8F0] dark:border-[#1E3A5F] space-y-1">
                    {/* Currency Modal */}
                    <button
                      onClick={() => {
                        setIsToolsOpen(false);
                        onOpenCurrencyModal();
                      }}
                      className="w-full px-2.5 py-2 rounded-lg hover:bg-[#F8F9FA] dark:hover:bg-[#112842] text-[#2D3748] dark:text-[#CBD5E1] hover:text-[#051C2C] dark:hover:text-white flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#F0F4F8] dark:bg-[#163354] text-[#2251FF] dark:text-[#60A5FA] flex items-center justify-center shrink-0 border border-[#E2E8F0] dark:border-[#2A486F]">
                          <Coins className="w-3.5 h-3.5" />
                        </div>
                        <p className="font-semibold text-[#051C2C] dark:text-[#F8FAFC] text-xs leading-tight truncate">
                          {language === 'id'
                            ? 'Mata Uang Standar'
                            : 'Display Currency'}
                        </p>
                      </div>
                      <span className="font-bold text-[#051C2C] dark:text-[#F8FAFC] font-mono text-[11px] bg-[#F8F9FA] dark:bg-[#163354] px-2 py-0.5 rounded border border-[#E2E8F0] dark:border-[#2A486F] shrink-0 ml-2">
                        {currentCurrency.flag} {currentCurrency.code}
                      </span>
                    </button>

                    {/* Language Modal */}
                    <button
                      onClick={() => {
                        setIsToolsOpen(false);
                        if (onOpenLanguageModal) {
                          onOpenLanguageModal();
                        }
                      }}
                      className="w-full px-2.5 py-2 rounded-lg hover:bg-[#F8F9FA] dark:hover:bg-[#112842] text-[#2D3748] dark:text-[#CBD5E1] hover:text-[#051C2C] dark:hover:text-white flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#F0F4F8] dark:bg-[#163354] text-[#2251FF] dark:text-[#60A5FA] flex items-center justify-center shrink-0 border border-[#E2E8F0] dark:border-[#2A486F]">
                          <Globe className="w-3.5 h-3.5" />
                        </div>
                        <p className="font-semibold text-[#051C2C] dark:text-[#F8FAFC] text-xs leading-tight truncate">
                          {language === 'id'
                            ? 'Bahasa Antarmuka'
                            : 'System Language'}
                        </p>
                      </div>
                      <span className="font-bold text-[#051C2C] dark:text-[#F8FAFC] text-[11px] bg-[#F8F9FA] dark:bg-[#163354] px-2 py-0.5 rounded border border-[#E2E8F0] dark:border-[#2A486F] shrink-0 ml-2">
                        {language === 'id' ? '🇮🇩 ID' : '🇺🇸 EN'}
                      </span>
                    </button>

                    {/* General Settings */}
                    <button
                      onClick={() => {
                        setIsToolsOpen(false);
                        onOpenSettingsModal();
                      }}
                      className="w-full px-2.5 py-2 rounded-lg hover:bg-[#F8F9FA] dark:hover:bg-[#112842] text-[#2D3748] dark:text-[#CBD5E1] hover:text-[#051C2C] dark:hover:text-white flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#F0F4F8] dark:bg-[#163354] text-[#2251FF] dark:text-[#60A5FA] flex items-center justify-center shrink-0 border border-[#E2E8F0] dark:border-[#2A486F]">
                          <Settings className="w-3.5 h-3.5" />
                        </div>
                        <p className="font-semibold text-[#051C2C] dark:text-[#F8FAFC] text-xs leading-tight truncate">
                          {language === 'id'
                            ? 'Preferensi & Batas Anggaran'
                            : 'Preferences & Budget Limits'}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#F8F9FA] dark:bg-[#163354] text-[#64748B] dark:text-[#94A3B8] border border-[#E2E8F0] dark:border-[#2A486F] shrink-0 ml-2">
                        Config
                      </span>
                    </button>
                  </div>

                  {/* DATA EXPORT & UTILITIES */}
                  <div className="pt-2 mt-1.5 border-t border-white/10 flex items-center justify-between gap-2 px-1">
                    {(onOpenReportModal || onExportCSV) && (
                      <button
                        onClick={() => {
                          setIsToolsOpen(false);
                          if (onOpenReportModal) onOpenReportModal();
                          else if (onExportCSV) onExportCSV();
                        }}
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 hover:border-[#2251FF]/60 font-bold text-[11px] flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5 text-[#38BDF8]" />
                        <span>
                          {language === 'id' ? 'Ekspor Data' : 'Export Data'}
                        </span>
                      </button>
                    )}

                    {onResetData && (
                      <button
                        onClick={() => {
                          setIsToolsOpen(false);
                          onResetData();
                        }}
                        className="py-1.5 px-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 font-bold text-[11px] flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <RotateCcw className="w-3 h-3 text-rose-300" />
                        <span>
                          {language === 'id' ? 'Reset Demo' : 'Reset Data'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* SINGLE UNIFIED ACCOUNT BUTTON & DROPDOWN */}
            <div className="relative" ref={userMenuRef}>
              <button
                id="unified-account-btn"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`h-9 w-9 sm:w-auto px-0 sm:px-3 inline-flex items-center justify-center space-x-0 sm:space-x-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 active:scale-95 backdrop-blur-xl ${
                  isUserMenuOpen
                    ? 'bg-[#2251FF]/45 border-[#2251FF] text-white shadow-[0_0_20px_rgba(34,81,255,0.35)]'
                    : 'bg-white/5 hover:bg-white/12 border-white/15 hover:border-[#2251FF]/40 text-[#E2E8F0] hover:text-white shadow-[0_4px_16px_rgba(0,0,0,0.2)]'
                }`}
                title={
                  user
                    ? displayName
                    : language === 'id'
                      ? 'Menu Akun & Masuk'
                      : 'Account & Sign In'
                }
                aria-label="User Account Menu"
              >
                {user ? (
                  user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={displayName}
                      className="w-5 h-5 rounded-full ring-1 ring-white/30 shrink-0 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#2251FF] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                      {displayInitial}
                    </div>
                  )
                ) : (
                  <UserIcon className="w-4 h-4 text-[#60A5FA] shrink-0" />
                )}

                <span className="hidden sm:inline text-[11px] whitespace-nowrap max-w-[80px] sm:max-w-[110px] truncate">
                  {user
                    ? displayName.split(' ')[0]
                    : language === 'id'
                      ? 'Akun'
                      : 'Account'}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-300 transition-transform duration-200 hidden sm:inline ${isUserMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Single Unified Account Dropdown Panel */}
              {isUserMenuOpen && (
                <div className="glass-dropdown absolute right-0 top-full mt-1.5 w-60 sm:w-64 max-w-[calc(100vw-1.5rem)] rounded-2xl p-2 z-50 animate-popover text-xs shadow-2xl">
                  {user ? (
                    // Logged-in view
                    <>
                      <div className="p-2 border-b border-white/10 mb-1">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          {user.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt={displayName}
                              className="w-7 h-7 rounded-full ring-1 ring-[#2251FF]/30 object-cover shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-[#2251FF] text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {displayInitial}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#051C2C] dark:text-[#F8FAFC] truncate">
                              {displayName}
                            </p>
                            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono truncate">
                              {displayEmail}
                            </p>
                          </div>
                        </div>
                        {userProfile?.companyName && (
                          <div className="mt-1.5">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F0F4F8] dark:bg-[#163354] text-[#051C2C] dark:text-[#F8FAFC] border border-[#CBD5E1] dark:border-[#2A486F] truncate max-w-full">
                              {userProfile.companyName}
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenAccountModal();
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-[#F8F9FA] dark:hover:bg-[#112842] text-[#2D3748] dark:text-[#CBD5E1] hover:text-[#051C2C] dark:hover:text-white flex items-center space-x-2.5 transition-colors cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4 text-[#2251FF] dark:text-[#60A5FA] shrink-0" />
                        <span className="font-semibold text-[#051C2C] dark:text-[#F8FAFC] text-xs truncate">
                          {language === 'id'
                            ? 'Profil & Aturan Akun'
                            : 'Account Profile & Rules'}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenCreateAccount();
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-[#F8F9FA] dark:hover:bg-[#112842] text-[#2D3748] dark:text-[#CBD5E1] hover:text-[#051C2C] dark:hover:text-white flex items-center space-x-2.5 transition-colors cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4 text-[#2251FF] dark:text-[#60A5FA] shrink-0" />
                        <span className="font-semibold text-[#051C2C] dark:text-[#F8FAFC] text-xs truncate">
                          {language === 'id'
                            ? 'Daftar Akun Baru'
                            : 'Register New Account'}
                        </span>
                      </button>

                      <div className="pt-1 mt-1 border-t border-[#E2E8F0] dark:border-[#1E3A5F]">
                        {onOpenLandingPage && (
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onOpenLandingPage();
                            }}
                            className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-[#F8F9FA] dark:hover:bg-[#112842] text-[#2D3748] dark:text-[#CBD5E1] hover:text-[#051C2C] dark:hover:text-white flex items-center space-x-2.5 transition-colors cursor-pointer mb-0.5"
                          >
                            <Globe className="w-4 h-4 text-[#2251FF] dark:text-[#60A5FA] shrink-0" />
                            <span className="text-xs font-semibold">
                              {language === 'id'
                                ? 'Halaman Utama'
                                : 'Landing Page'}
                            </span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[#D9383A] dark:text-rose-400 flex items-center space-x-2.5 transition-colors cursor-pointer font-semibold"
                        >
                          <LogOut className="w-4 h-4 shrink-0" />
                          <span className="text-xs">{t.menu.logout}</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    // Not logged-in view: Consolidated Actions
                    <>
                      <div className="px-2.5 py-2 border-b border-[#E2E8F0] dark:border-[#1E3A5F] mb-1">
                        <h4 className="font-bold text-[#051C2C] dark:text-[#F8FAFC] font-editorial text-xs">
                          {language === 'id'
                            ? 'Akses & Akun Pengguna'
                            : 'Account & Access'}
                        </h4>
                      </div>

                      {/* Primary Option 1: Google Sign-In */}
                      <button
                        id="google-signin-btn"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogin();
                        }}
                        className="w-full px-2.5 py-2 rounded-xl bg-[#F8F9FA] dark:bg-[#112842] hover:bg-[#F0F4F8] dark:hover:bg-[#163354] border border-[#E2E8F0] dark:border-[#1E3A5F] hover:border-[#2251FF] text-[#2D3748] dark:text-[#E2E8F0] hover:text-[#051C2C] dark:hover:text-white flex items-center space-x-2.5 transition-colors cursor-pointer mb-1 group"
                      >
                        <div className="w-5 h-5 rounded bg-white dark:bg-[#081729] border border-[#E2E8F0] dark:border-[#1E3A5F] flex items-center justify-center shrink-0 shadow-2xs">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                            <path
                              fill="#EA4335"
                              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                            />
                            <path
                              fill="#4285F4"
                              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                            />
                            <path
                              fill="#34A853"
                              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                            />
                          </svg>
                        </div>
                        <span className="font-semibold text-[#051C2C] dark:text-[#F8FAFC] text-xs truncate">
                          {t.menu.loginWithGoogle}
                        </span>
                      </button>

                      {/* Primary Option 2: Create Account Profile */}
                      <button
                        id="create-account-nav-btn"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenCreateAccount();
                        }}
                        className="w-full px-2.5 py-2 rounded-xl hover:bg-[#F8F9FA] dark:hover:bg-[#112842] text-[#2D3748] dark:text-[#CBD5E1] hover:text-[#051C2C] dark:hover:text-white flex items-center space-x-2.5 transition-colors cursor-pointer"
                      >
                        <div className="w-5 h-5 rounded bg-[#F0F4F8] dark:bg-[#163354] text-[#2251FF] dark:text-[#60A5FA] flex items-center justify-center shrink-0">
                          <UserPlus className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-[#051C2C] dark:text-[#F8FAFC] text-xs truncate">
                          {language === 'id'
                            ? 'Daftar Akun Baru'
                            : 'Create Account Profile'}
                        </span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
