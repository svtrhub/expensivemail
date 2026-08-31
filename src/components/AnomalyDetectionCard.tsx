import React from 'react';
import {
  Expense,
  AnomalyRecord,
  AnomalyDetectionResult,
  SupportedCurrency,
} from '../types';
import { formatCurrency } from '../services/currency';
import { LanguageCode } from '../services/translations';
import {
  AlertTriangle,
  ShieldAlert,
  Filter,
  CheckCircle2,
  Eye,
  Wrench,
} from 'lucide-react';

interface AnomalyDetectionCardProps {
  anomalyResult: AnomalyDetectionResult;
  currency: SupportedCurrency;
  ratesToIDR: Record<SupportedCurrency, number>;
  language: LanguageCode;
  onDismissAnomaly: (expenseId: string) => void;
  onRestoreAnomaly?: (expenseId: string) => void;
  onSelectExpense: (expense: Expense) => void;
  onFixAnomaly: (anomaly: AnomalyRecord, expense: Expense) => void;
  onThresholdChange: (multiplier: number) => void;
  onFilterInFeed?: () => void;
  isFilterActiveInFeed?: boolean;
}

export const AnomalyDetectionCard: React.FC<AnomalyDetectionCardProps> = ({
  anomalyResult,
  currency,
  language,
  onDismissAnomaly,
  onSelectExpense,
  onFixAnomaly,
  onThresholdChange,
  onFilterInFeed,
  isFilterActiveInFeed = false,
}) => {
  const {
    anomalies,
    thresholdMultiplier,
    totalAnomalousSpend,
    highestAnomaly,
  } = anomalyResult;

  const activeAnomalies = anomalies.filter((a) => !a.dismissed);
  const thresholdPercent = Math.round(thresholdMultiplier * 100);

  return (
    <div
      id="anomaly-detection-module"
      className="glass-panel border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-xl text-white relative transition-colors hover:border-amber-400/50 scroll-mt-24"
    >
      <div className="glass-content space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/30 shadow-2xs shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-bold text-[#051C2C] dark:text-white font-editorial tracking-tight">
                  {language === 'id'
                    ? 'Deteksi Lonjakan & Anomali Pengeluaran'
                    : 'Outlier & Anomaly Detection'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                  {activeAnomalies.length}{' '}
                  {activeAnomalies.length === 1
                    ? language === 'id'
                      ? 'Lonjakan'
                      : 'Spike'
                    : language === 'id'
                      ? 'Lonjakan'
                      : 'Spikes'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'id'
                  ? `Mendeteksi transaksi yang ≥ ${thresholdPercent}% (${thresholdMultiplier.toFixed(1)}x) dari rata-rata historis kategori`
                  : `Flagging transactions that are ≥ ${thresholdPercent}% (${thresholdMultiplier.toFixed(1)}x) above category baseline`}
              </p>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Threshold Sensitivity Control */}
            <div className="flex items-center bg-[#F8F9FA] dark:bg-[#081827] border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-lg p-0.5 text-[11px]">
              <button
                onClick={() => onThresholdChange(1.5)}
                className={`px-2 py-1 rounded font-bold transition-colors cursor-pointer ${
                  thresholdMultiplier === 1.5
                    ? 'bg-[#2251FF] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#051C2C] dark:hover:text-white'
                }`}
                title="Sensitivitas Tinggi (150% / 1.5x rata-rata)"
              >
                150%
              </button>
              <button
                onClick={() => onThresholdChange(2.0)}
                className={`px-2 py-1 rounded font-bold transition-colors cursor-pointer ${
                  thresholdMultiplier === 2.0
                    ? 'bg-[#2251FF] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#051C2C] dark:hover:text-white'
                }`}
                title="Standar (200% / 2.0x rata-rata historis)"
              >
                200%
              </button>
              <button
                onClick={() => onThresholdChange(3.0)}
                className={`px-2 py-1 rounded font-bold transition-colors cursor-pointer ${
                  thresholdMultiplier === 3.0
                    ? 'bg-[#2251FF] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#051C2C] dark:hover:text-white'
                }`}
                title="Hanya Lonjakan Ekstrem (300% / 3.0x rata-rata)"
              >
                300%
              </button>
            </div>

            {onFilterInFeed && activeAnomalies.length > 0 && (
              <button
                onClick={onFilterInFeed}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer border ${
                  isFilterActiveInFeed
                    ? 'bg-amber-700 text-white border-amber-800'
                    : 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700'
                }`}
                title="Filter daftar transaksi untuk menampilkan anomali saja"
              >
                <Filter className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline text-white">
                  {isFilterActiveInFeed
                    ? language === 'id'
                      ? 'Filter Aktif'
                      : 'Filtered'
                    : language === 'id'
                      ? 'Filter di Feed'
                      : 'Filter in Feed'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Summary KPI Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3.5">
          <div className="bg-[#FFFBEB] dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/70 dark:border-amber-500/20">
            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
              {language === 'id'
                ? 'Total Transaksi Anomali'
                : 'Flagged Outliers'}
            </span>
            <span className="text-lg font-bold font-mono text-amber-950 dark:text-amber-100 block mt-0.5">
              {activeAnomalies.length}
            </span>
          </div>

          <div className="bg-[#FFFBEB] dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/70 dark:border-amber-500/20">
            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
              {language === 'id' ? 'Total Nilai Lonjakan' : 'Anomalous Volume'}
            </span>
            <span className="text-lg font-bold font-mono text-amber-950 dark:text-amber-100 block mt-0.5 truncate">
              {formatCurrency(totalAnomalousSpend, currency)}
            </span>
          </div>

          <div className="bg-[#FFFBEB] dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/70 dark:border-amber-500/20">
            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
              {language === 'id' ? 'Lonjakan Tertinggi' : 'Highest Spike'}
            </span>
            <span className="text-lg font-bold font-mono text-rose-700 dark:text-rose-400 block mt-0.5">
              {highestAnomaly
                ? `+${Math.round(highestAnomaly.percentageAboveAverage)}%`
                : '0%'}
            </span>
          </div>

          <div className="bg-[#FFFBEB] dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/70 dark:border-amber-500/20">
            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
              {language === 'id' ? 'Kriteria Ambang Batas' : 'Trigger Baseline'}
            </span>
            <span className="text-lg font-bold font-mono text-amber-950 dark:text-amber-100 block mt-0.5">
              ≥ {thresholdMultiplier.toFixed(1)}x ({thresholdPercent}%)
            </span>
          </div>
        </div>

        {/* Flagged Transactions Stream */}
        {activeAnomalies.length > 0 ? (
          <div className="space-y-2 mt-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300 px-1">
              <span>
                {language === 'id'
                  ? 'Daftar Transaksi yang Melebihi 200% Rata-Rata Historis:'
                  : 'Transactions Exceeding 200% Historical Baseline:'}
              </span>
              <span className="text-slate-400 dark:text-slate-400 font-normal text-[10px]">
                {language === 'id'
                  ? 'Klik "Perbaiki" untuk koreksi kategori atau nominal'
                  : 'Click "Fix" to reclassify or adjust amount'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {activeAnomalies.map((anomaly) => {
                const exp = anomaly.expense;
                if (!exp) return null;

                return (
                  <div
                    key={anomaly.expenseId}
                    className="p-3 bg-[#FEFDF8] dark:bg-[#0B1E33] hover:bg-amber-50/50 dark:hover:bg-[#102742] border border-amber-200/90 dark:border-amber-500/30 rounded-xl flex items-center justify-between transition-colors group shadow-2xs hover:border-amber-300 dark:hover:border-amber-500/50"
                  >
                    <div className="flex items-start space-x-2.5 min-w-0 flex-1 pr-2">
                      <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 mt-0.5 shrink-0">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5">
                          <h4 className="text-xs font-bold text-[#051C2C] dark:text-white truncate group-hover:text-amber-900 dark:group-hover:text-amber-200">
                            {exp.merchant || exp.title}
                          </h4>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 shrink-0">
                            +{Math.round(anomaly.percentageAboveAverage)}% (
                            {anomaly.multiplier.toFixed(1)}x)
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
                          <span className="font-mono font-bold text-[#051C2C] dark:text-white">
                            {formatCurrency(anomaly.convertedAmount, currency)}
                          </span>
                          <span className="text-slate-400">vs</span>
                          <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                            avg{' '}
                            {formatCurrency(anomaly.categoryAverage, currency)}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">
                            •
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-medium">
                            {exp.category}
                          </span>
                        </div>

                        <p className="text-[10px] text-amber-900/90 dark:text-amber-300/90 mt-1 line-clamp-1 italic">
                          {anomaly.reason}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() => onFixAnomaly(anomaly, exp)}
                        className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-[color,transform] shadow-2xs flex items-center space-x-1 cursor-pointer active:scale-95"
                        title={
                          language === 'id'
                            ? 'Perbaiki Anomali Ini'
                            : 'Fix This Anomaly'
                        }
                      >
                        <Wrench className="w-3 h-3 text-white" />
                        <span className="text-[11px] text-white">
                          {language === 'id' ? 'Perbaiki' : 'Fix'}
                        </span>
                      </button>

                      <button
                        onClick={() => onSelectExpense(exp)}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-[#2251FF] dark:hover:text-white hover:bg-white dark:hover:bg-[#163354] rounded-lg transition-colors cursor-pointer"
                        title={
                          language === 'id'
                            ? 'Lihat Detail Struk'
                            : 'View Source Receipt'
                        }
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDismissAnomaly(anomaly.expenseId)}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors cursor-pointer"
                        title={
                          language === 'id'
                            ? 'Tandai Wajar / Selesai'
                            : 'Dismiss Anomaly Alert'
                        }
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-4 px-3 bg-[#F0FDF4] dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-center flex flex-col items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mb-1" />
            <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
              {language === 'id'
                ? 'Tidak Ada Anomali Pengeluaran Terdeteksi'
                : 'No Spending Anomalies Detected'}
            </p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
              {language === 'id'
                ? `Seluruh transaksi berada dalam batas wajar (< ${thresholdPercent}% dari rata-rata historis).`
                : `All recent transactions align with historical category averages (< ${thresholdPercent}% baseline).`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
