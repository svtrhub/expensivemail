import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  X,
  Mail,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { AnomalyDetectionResult, AnomalyRecord } from '../types';
import { formatCurrency, SupportedCurrency } from '../services/currency';
import { LanguageCode } from '../services/translations';

interface AnomalyNotificationBannerProps {
  anomalyResult: AnomalyDetectionResult;
  currency: SupportedCurrency;
  language: LanguageCode;
  onFixAnomaly: (anomaly: AnomalyRecord) => void;
  onScrollToAnomalySection: () => void;
  onDismissBanner: () => void;
}

export const AnomalyNotificationBanner: React.FC<
  AnomalyNotificationBannerProps
> = ({
  anomalyResult,
  currency,
  language,
  onFixAnomaly,
  onScrollToAnomalySection,
  onDismissBanner,
}) => {
  const isID = language === 'id';
  const activeAnomalies = (anomalyResult?.anomalies || []).filter(
    (a) => !a.dismissed
  );

  if (!activeAnomalies || activeAnomalies.length === 0) return null;

  const topAnomaly =
    anomalyResult.highestAnomaly && !anomalyResult.highestAnomaly.dismissed
      ? anomalyResult.highestAnomaly
      : activeAnomalies[0];
  const count = activeAnomalies.length;
  const emailTitle =
    topAnomaly.expense?.emailMetadata?.subject ||
    topAnomaly.expense?.title ||
    topAnomaly.expense?.merchant ||
    topAnomaly.category;
  const senderOrMerchant =
    topAnomaly.expense?.emailMetadata?.sender ||
    topAnomaly.expense?.merchant ||
    topAnomaly.category;

  return (
    <div
      id="anomaly-inapp-notification"
      className="mb-6 rounded-2xl bg-amber-500/10 backdrop-blur-xl border border-amber-500/40 shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-white p-3.5 sm:p-4 transition-[opacity,transform] animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        {/* Left Side: Alert Icon + Email Name + Recorded Amount Focus */}
        <div className="flex items-start space-x-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-amber-500/15 dark:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0 mt-0.5 shadow-2xs">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 tracking-wider">
                {isID ? 'Notifikasi Anomali' : 'Anomaly Alert'}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                {topAnomaly.multiplier.toFixed(1)}x{' '}
                {isID ? 'di atas rata-rata' : 'above avg'}
              </span>
              {count > 1 && (
                <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">
                  • {count} {isID ? 'transaksi terdeteksi' : 'anomalies found'}
                </span>
              )}
            </div>

            {/* Email Name & Recorded Transaction Amount prominently featured */}
            <div className="mt-1.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
              <div className="flex items-center space-x-1.5 min-w-0">
                <Mail className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <h4 className="text-xs sm:text-sm font-bold text-[#051C2C] dark:text-white truncate font-editorial">
                  {emailTitle}
                </h4>
              </div>
              <div className="flex items-center space-x-1.5 shrink-0">
                <span className="text-xs font-bold font-mono text-[#2251FF] dark:text-[#60A5FA] bg-[#F0F4F8] dark:bg-[#163354] px-2 py-0.5 rounded-md border border-[#CBD5E1] dark:border-[#2A486F]">
                  {formatCurrency(topAnomaly.amount, currency)}
                </span>
                <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                  ({topAnomaly.category})
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 line-clamp-1">
              {topAnomaly.reason ||
                (isID
                  ? 'Pengeluaran ini jauh melampaui rata-rata historis.'
                  : 'This expense significantly exceeds historical category averages.')}
            </p>
          </div>
        </div>

        {/* Right Side: Action CTA Buttons */}
        <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
          <button
            id="notification-review-anomaly-btn"
            onClick={() => onFixAnomaly(topAnomaly)}
            className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold shadow-2xs transition-[color,transform] cursor-pointer active:scale-95"
            title="Review and resolve anomaly"
          >
            <span>{isID ? 'Tinjau & Koreksi' : 'Review & Fix'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            id="notification-dismiss-anomaly-btn"
            onClick={onDismissBanner}
            className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title={isID ? 'Tutup Notifikasi' : 'Dismiss Notification'}
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
