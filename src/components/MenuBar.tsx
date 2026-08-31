import React, { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  SupportedCurrency,
  CURRENCIES,
  formatCurrency,
} from '../services/currency';
import { LanguageCode, Translations } from '../services/translations';
import { ChevronDown, Check, Zap, Sliders, FileText } from 'lucide-react';

interface MenuBarProps {
  user: User | null;
  currency: SupportedCurrency;
  onSelectCurrency: (c: SupportedCurrency) => void;
  language: LanguageCode;
  onSelectLanguage: (l: LanguageCode) => void;
  t: Translations;
  onOpenAccountModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenCurrencyModal: () => void;
  onOpenLanguageModal: () => void;
  onOpenRulesModal?: () => void;
  onOpenReportModal?: () => void;
  onLogin: () => void;
  onLogout: () => void;
  hasGmailAccess: boolean;
  totalAccountBalance: number;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  user,
  currency,
  onSelectCurrency,
  language,
  onSelectLanguage,
  t,
  onOpenSettingsModal,
  onOpenCurrencyModal,
  onOpenLanguageModal,
  onOpenRulesModal,
  onOpenReportModal,
  hasGmailAccess,
  totalAccountBalance,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const currentCurrencyConfig = CURRENCIES[currency] || CURRENCIES.IDR;

  return (
    <div
      ref={menuRef}
      className="bg-[#051C2C]/50 border-b border-white/10 text-xs text-slate-200 select-none sticky top-12 sm:top-14 md:top-16 z-30 backdrop-blur-xl transition-all"
    >
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 flex items-center justify-between h-8 sm:h-9">
        {/* Left Side: Dense Status & Quick Standards Selectors */}
        <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
          {/* Real-time Ingestion Indicator */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 px-1.5 sm:px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] sm:text-[11px] font-medium text-white shrink-0 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#60A5FA] animate-pulse" />
            <span className="hidden sm:inline">Feed:</span>
            <span className="font-semibold text-[#60A5FA]">
              {hasGmailAccess ? 'Gmail API' : 'Multi-Feed'}
            </span>
          </div>

          {/* Quick Currency Selector Popover */}
          <div className="relative">
            <button
              id="menu-bar-currency-btn"
              onClick={() => toggleDropdown('currency')}
              className={`flex items-center space-x-1 px-1.5 sm:px-2 py-0.5 rounded transition-all cursor-pointer text-[10px] sm:text-[11px] font-semibold backdrop-blur-md ${
                openDropdown === 'currency'
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'hover:bg-white/10 text-slate-200 border border-transparent'
              }`}
              title="Quick Currency Switcher"
            >
              <span>{currentCurrencyConfig.flag}</span>
              <span className="font-mono">{currentCurrencyConfig.code}</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-300" />
            </button>

            {openDropdown === 'currency' && (
              <div className="absolute left-0 mt-1 w-52 rounded-xl bg-[#081B2E]/90 backdrop-blur-2xl border border-white/15 shadow-[0_12px_36px_rgba(0,0,0,0.5)] p-1.5 z-50 max-h-64 overflow-y-auto animate-in fade-in-50 zoom-in-95">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Standard Currencies
                </div>
                {(Object.keys(CURRENCIES) as SupportedCurrency[]).map(
                  (code) => {
                    const item = CURRENCIES[code];
                    const isSelected = currency === code;
                    return (
                      <button
                        key={code}
                        onClick={() => {
                          onSelectCurrency(code);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#F0F4F8] dark:bg-[#163354] text-[#051C2C] dark:text-white font-bold'
                            : 'hover:bg-[#F0F4F8] dark:hover:bg-[#112842] text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span>{item.flag}</span>
                          <span className="font-semibold text-[#051C2C] dark:text-white">
                            {item.code}
                          </span>
                          <span className="text-slate-400 dark:text-slate-400 text-[10px]">
                            ({item.symbol})
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="w-3 h-3 text-[#2251FF] dark:text-[#38BDF8]" />
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </div>

          {/* Quick Language Selector */}
          <div className="relative">
            <button
              id="menu-bar-languages-btn"
              onClick={() => toggleDropdown('languages')}
              className={`flex items-center space-x-1 px-1.5 sm:px-2 py-0.5 rounded transition-colors cursor-pointer text-[10px] sm:text-[11px] font-semibold ${
                openDropdown === 'languages'
                  ? 'bg-[#F0F4F8] dark:bg-[#163354] text-[#051C2C] dark:text-white'
                  : 'hover:bg-[#F0F4F8] dark:hover:bg-[#163354] text-slate-700 dark:text-slate-200'
              }`}
              title="Quick Language Switcher"
            >
              <span>{language === 'id' ? '🇮🇩' : '🇺🇸'}</span>
              <span>{language === 'id' ? 'ID' : 'EN'}</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400 dark:text-slate-400" />
            </button>

            {openDropdown === 'languages' && (
              <div className="absolute left-0 mt-1 w-44 rounded-xl bg-[#081B2E]/90 backdrop-blur-2xl border border-white/15 shadow-[0_12px_36px_rgba(0,0,0,0.5)] p-1.5 z-50 animate-in fade-in-50 zoom-in-95 text-slate-100">
                <button
                  onClick={() => {
                    onSelectLanguage('id');
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                    language === 'id'
                      ? 'bg-[#2251FF]/30 text-white font-bold border border-[#2251FF]/40'
                      : 'hover:bg-white/10 text-slate-200'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <span>🇮🇩</span>
                    <span>Bahasa Indonesia</span>
                  </span>
                  {language === 'id' && (
                    <Check className="w-3 h-3 text-[#38BDF8]" />
                  )}
                </button>
                <button
                  onClick={() => {
                    onSelectLanguage('en');
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                    language === 'en'
                      ? 'bg-[#2251FF]/30 text-white font-bold border border-[#2251FF]/40'
                      : 'hover:bg-white/10 text-slate-200'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <span>🇺🇸</span>
                    <span>English (US)</span>
                  </span>
                  {language === 'en' && (
                    <Check className="w-3 h-3 text-[#38BDF8]" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Total Managed Liquidity & Preferences Trigger */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-300 shrink-0">
          {onOpenRulesModal && (
            <button
              onClick={onOpenRulesModal}
              className="hidden sm:flex items-center space-x-1 px-1.5 py-0.5 rounded hover:bg-[#F0F4F8] dark:hover:bg-[#163354] text-slate-600 dark:text-slate-300 hover:text-[#2251FF] dark:hover:text-[#38BDF8] transition-colors cursor-pointer"
              title="Kelola Aturan Smart Ingestion"
            >
              <Zap className="w-3 h-3 text-[#2251FF] dark:text-[#38BDF8]" />
              <span className="hidden lg:inline font-medium">Smart Rules</span>
            </button>
          )}

          {onOpenReportModal && (
            <button
              onClick={onOpenReportModal}
              className="hidden sm:flex items-center space-x-1 px-1.5 py-0.5 rounded hover:bg-[#F0F4F8] dark:hover:bg-[#163354] text-slate-600 dark:text-slate-300 hover:text-[#2251FF] dark:hover:text-[#38BDF8] transition-colors cursor-pointer"
              title="Buat Laporan Rekapitulasi & Klaim Kantor"
            >
              <FileText className="w-3 h-3 text-[#2251FF] dark:text-[#38BDF8]" />
              <span className="hidden lg:inline font-medium">Statement</span>
            </button>
          )}

          <div className="flex items-center space-x-1">
            <span className="text-slate-400 dark:text-slate-400 hidden md:inline">
              Total Saldo:
            </span>
            <span className="font-mono font-bold text-[#051C2C] dark:text-white bg-[#F8F9FA] dark:bg-[#112842] px-1.5 sm:px-2 py-0.5 rounded border border-[#E2E8F0] dark:border-[#1E3A5F]">
              {formatCurrency(totalAccountBalance, currency, true)}
            </span>
          </div>

          <button
            onClick={onOpenSettingsModal}
            className="p-1 rounded hover:bg-[#F0F4F8] dark:hover:bg-[#163354] text-slate-500 dark:text-slate-400 hover:text-[#051C2C] dark:hover:text-white transition-colors cursor-pointer"
            title="General Preferences"
          >
            <Sliders className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#2251FF] dark:text-[#38BDF8]" />
          </button>
        </div>
      </div>
    </div>
  );
};
