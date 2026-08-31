import React from 'react';
import { SupportedCurrency, CURRENCIES } from '../services/currency';
import { LanguageCode, Translations } from '../services/translations';
import { ThemeMode } from '../types';
import {
  X,
  Settings,
  Clock,
  Coins,
  Globe,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: SupportedCurrency;
  onSelectCurrency: (c: SupportedCurrency) => void;
  language: LanguageCode;
  onSelectLanguage: (l: LanguageCode) => void;
  theme?: ThemeMode;
  onSelectTheme?: (t: ThemeMode) => void;
  autoSyncEnabled: boolean;
  onToggleAutoSync: () => void;
  autoSyncIntervalSec: number;
  onSetAutoSyncInterval: (sec: number) => void;
  onResetData: () => void;
  onLoadSampleData?: () => void;
  t: Translations;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currency,
  onSelectCurrency,
  language,
  onSelectLanguage,
  autoSyncEnabled,
  onToggleAutoSync,
  autoSyncIntervalSec,
  onSetAutoSyncInterval,
  onResetData,
  onLoadSampleData,
  t,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="glass-modal rounded-2xl max-w-lg w-full p-6 text-white shadow-[0_16px_48px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-150 transition-colors">
        <div className="glass-content">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-[#F0F4F8] dark:bg-[#163354] text-[#2251FF] dark:text-[#60A5FA] shrink-0 shadow-2xs">
                <Settings className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-[#051C2C] dark:text-[#F8FAFC] tracking-tight font-editorial truncate">
                  {t.modals.settingsTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {t.modals.settingsSubtitle}
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

          {/* Settings Form */}
          <div className="my-5 space-y-4">
            {/* Default Currency */}
            <div className="p-3.5 bg-[#F8F9FA] dark:bg-[#112842] rounded-xl border border-[#E2E8F0] dark:border-[#1E3A5F] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Coins className="w-4 h-4 text-[#2251FF] dark:text-[#60A5FA]" />
                  <span className="text-xs font-bold text-[#051C2C] dark:text-[#F8FAFC]">
                    {t.modals.defaultCurrency}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-[#2251FF] dark:text-[#60A5FA]">
                  {CURRENCIES[currency]?.flag} {currency} (
                  {CURRENCIES[currency]?.symbol})
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {(
                  [
                    'IDR',
                    'USD',
                    'EUR',
                    'SGD',
                    'MYR',
                    'JPY',
                    'GBP',
                    'AUD',
                  ] as SupportedCurrency[]
                ).map((c) => (
                  <button
                    key={c}
                    onClick={() => onSelectCurrency(c)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border flex items-center justify-center space-x-1 transition-colors cursor-pointer ${
                      currency === c
                        ? 'bg-[#2251FF] border-[#2251FF] text-white shadow-2xs'
                        : 'bg-white dark:bg-[#081729] border-[#CBD5E1] dark:border-[#2A486F] text-slate-700 dark:text-slate-300 hover:bg-[#F0F4F8] dark:hover:bg-[#163354]'
                    }`}
                  >
                    <span>{CURRENCIES[c]?.flag}</span>
                    <span>{c}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Language Selection */}
            <div className="p-3.5 bg-[#F8F9FA] dark:bg-[#112842] rounded-xl border border-[#E2E8F0] dark:border-[#1E3A5F] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-[#2251FF] dark:text-[#60A5FA]" />
                  <span className="text-xs font-bold text-[#051C2C] dark:text-[#F8FAFC]">
                    {t.modals.defaultLanguage}
                  </span>
                </div>
                <span className="text-xs font-bold text-[#2251FF] dark:text-[#60A5FA]">
                  {language === 'id' ? 'Bahasa Indonesia' : 'English (US)'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => onSelectLanguage('id')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center space-x-2 transition-colors cursor-pointer ${
                    language === 'id'
                      ? 'bg-[#2251FF] border-[#2251FF] text-white shadow-2xs'
                      : 'bg-white dark:bg-[#081729] border-[#CBD5E1] dark:border-[#2A486F] text-slate-700 dark:text-slate-300 hover:bg-[#F0F4F8] dark:hover:bg-[#163354]'
                  }`}
                >
                  <span>🇮🇩</span>
                  <span>Bahasa Indonesia (ID)</span>
                </button>
                <button
                  onClick={() => onSelectLanguage('en')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center space-x-2 transition-colors cursor-pointer ${
                    language === 'en'
                      ? 'bg-[#2251FF] border-[#2251FF] text-white shadow-2xs'
                      : 'bg-white dark:bg-[#081729] border-[#CBD5E1] dark:border-[#2A486F] text-slate-700 dark:text-slate-300 hover:bg-[#F0F4F8] dark:hover:bg-[#163354]'
                  }`}
                >
                  <span>🇺🇸</span>
                  <span>English (US)</span>
                </button>
              </div>
            </div>

            {/* Auto-Sync Configuration */}
            <div className="p-3.5 bg-[#F8F9FA] dark:bg-[#112842] rounded-xl border border-[#E2E8F0] dark:border-[#1E3A5F] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-[#2251FF] dark:text-[#60A5FA]" />
                  <span className="text-xs font-bold text-[#051C2C] dark:text-[#F8FAFC]">
                    {t.modals.autoSyncInterval}
                  </span>
                </div>
                <button
                  onClick={onToggleAutoSync}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    autoSyncEnabled
                      ? 'bg-[#F0F4F8] dark:bg-[#163354] text-[#2251FF] dark:text-[#60A5FA] border border-[#C5DCF5] dark:border-[#2A486F]'
                      : 'bg-slate-100 dark:bg-[#081729] text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {autoSyncEnabled
                    ? t.currencyModal.enabled
                    : t.currencyModal.paused}
                </button>
              </div>

              <div className="flex items-center space-x-2">
                {[15, 30, 45, 60, 120].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => onSetAutoSyncInterval(sec)}
                    className={`flex-1 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                      autoSyncIntervalSec === sec
                        ? 'bg-[#051C2C] dark:bg-[#2251FF] text-white'
                        : 'bg-white dark:bg-[#081729] border border-[#CBD5E1] dark:border-[#2A486F] text-slate-600 dark:text-slate-300 hover:bg-[#F0F4F8] dark:hover:bg-[#163354]'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* Sample Data & Reset */}
            <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#1E3A5F] space-y-2.5">
              {onLoadSampleData && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#051C2C] dark:text-[#F8FAFC]">
                      {language === 'id'
                        ? 'Muat Data Contoh / Demo'
                        : 'Load Sample / Demo Data'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'id'
                        ? 'Isi dashboard dengan rekening & transaksi simulasi'
                        : 'Populate dashboard with realistic mock bank accounts & expenses'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onLoadSampleData();
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-[#F0F4F8] dark:bg-[#163354] hover:bg-[#E2E8F0] dark:hover:bg-[#1E4373] text-[#2251FF] dark:text-[#38BDF8] border border-[#CBD5E1] dark:border-[#2A486F] rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {language === 'id' ? 'Muat Data Demo' : 'Load Demo Data'}
                    </span>
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-xs font-bold text-[#051C2C] dark:text-[#F8FAFC]">
                    {t.modals.resetDemoData}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t.modals.resetDesc}
                  </p>
                </div>
                <button
                  onClick={() => {
                    onResetData();
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-[#112842] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-300 border border-[#CBD5E1] dark:border-[#2A486F] rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.modals.resetDemoData}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-white/10 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#051C2C] dark:bg-[#2251FF] hover:bg-[#0D2E78] dark:hover:bg-[#3B82F6] text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer"
            >
              {t.modals.done}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
