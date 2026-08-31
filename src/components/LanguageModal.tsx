import React from 'react';
import { LanguageCode, Translations } from '../services/translations';
import { X, Globe, Check } from 'lucide-react';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: LanguageCode;
  onSelectLanguage: (l: LanguageCode) => void;
  t: Translations;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({
  isOpen,
  onClose,
  language,
  onSelectLanguage,
  t,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="glass-modal rounded-2xl max-w-md w-full p-6 text-white shadow-[0_16px_48px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-150 transition-colors">
        <div className="glass-content">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-[#F0F4F8] dark:bg-[#163354] text-[#2251FF] dark:text-[#38BDF8] shrink-0 shadow-2xs">
                <Globe className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-[#051C2C] dark:text-white tracking-tight font-editorial truncate">
                  {t.menu.languages}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Choose interface language
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

          <div className="my-4 space-y-2.5">
            <button
              onClick={() => {
                onSelectLanguage('id');
                onClose();
              }}
              className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                language === 'id'
                  ? 'bg-[#F0F4F8] dark:bg-[#163354] border-[#2251FF] dark:border-[#38BDF8] text-[#051C2C] dark:text-white shadow-2xs'
                  : 'bg-[#F8F9FA] dark:bg-[#081827] border-[#E2E8F0] dark:border-[#1E3A5F] text-slate-700 dark:text-slate-200 hover:bg-[#F0F4F8] dark:hover:bg-[#112842]'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🇮🇩</span>
                <div className="text-left">
                  <p className="font-bold text-sm text-[#051C2C] dark:text-white">
                    Bahasa Indonesia
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bahasa Indonesia (ID) - Format Rupiah (Rp)
                  </p>
                </div>
              </div>
              {language === 'id' && (
                <div className="flex items-center space-x-1.5 text-xs text-[#2251FF] dark:text-[#38BDF8] font-bold">
                  <Check className="w-4 h-4" />
                  <span>Aktif</span>
                </div>
              )}
            </button>

            <button
              onClick={() => {
                onSelectLanguage('en');
                onClose();
              }}
              className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                language === 'en'
                  ? 'bg-[#F0F4F8] dark:bg-[#163354] border-[#2251FF] dark:border-[#38BDF8] text-[#051C2C] dark:text-white shadow-2xs'
                  : 'bg-[#F8F9FA] dark:bg-[#081827] border-[#E2E8F0] dark:border-[#1E3A5F] text-slate-700 dark:text-slate-200 hover:bg-[#F0F4F8] dark:hover:bg-[#112842]'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🇺🇸</span>
                <div className="text-left">
                  <p className="font-bold text-sm text-[#051C2C] dark:text-white">
                    English (US)
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    English (United States)
                  </p>
                </div>
              </div>
              {language === 'en' && (
                <div className="flex items-center space-x-1.5 text-xs text-[#2251FF] dark:text-[#38BDF8] font-bold">
                  <Check className="w-4 h-4" />
                  <span>Active</span>
                </div>
              )}
            </button>
          </div>

          <div className="pt-3 border-t border-white/10 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#2251FF] hover:bg-[#1267D5] text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
