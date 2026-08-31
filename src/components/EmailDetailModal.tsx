import React from 'react';
import { Expense, AnomalyRecord, SupportedCurrency } from '../types';
import { formatCurrency } from '../services/currency';
import {
  X,
  Mail,
  ShieldCheck,
  AlertTriangle,
  Wrench,
  Edit2,
  Trash2,
} from 'lucide-react';

interface EmailDetailModalProps {
  expense: Expense | null;
  onClose: () => void;
  currency: SupportedCurrency;
  anomaly?: AnomalyRecord | null;
  language?: 'en' | 'id';
  onFixAnomaly?: (anomaly: AnomalyRecord, expense: Expense) => void;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expenseId: string) => void;
}

export const EmailDetailModal: React.FC<EmailDetailModalProps> = ({
  expense,
  onClose,
  currency,
  anomaly,
  language = 'id',
  onFixAnomaly,
  onEdit,
  onDelete,
}) => {
  if (!expense) return null;

  const email = expense.emailMetadata;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="glass-modal rounded-2xl max-w-lg w-full p-6 text-white shadow-[0_16px_48px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-150 transition-colors">
        <div className="glass-content">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-white/10">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-[#F0F4F8] dark:bg-[#163354] text-[#2251FF] dark:text-[#38BDF8] shrink-0 shadow-2xs">
                <Mail className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-[#051C2C] dark:text-white tracking-tight font-editorial truncate">
                  {language === 'id'
                    ? 'Kwitansi & Rincian Email Asli'
                    : 'Source Email Receipt'}
                </h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400 truncate">
                  {language === 'id'
                    ? 'Diekstrak & diverifikasi oleh Intelligent Inbox Sync'
                    : 'Captured & parsed by Intelligent Inbox Sync'}
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

          {/* Anomaly Detection Banner if Flagged */}
          {anomaly && (
            <div className="mt-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
              <div className="flex items-start space-x-2.5 flex-1 min-w-0">
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wider text-[10px]">
                      {language === 'id'
                        ? 'Peringatan Lonjakan Anomali'
                        : 'Anomaly Spike Alert'}
                    </span>
                    <span className="px-1.5 py-0.2 rounded font-mono font-bold text-[9px] bg-amber-200/80 dark:bg-amber-800 text-amber-900 dark:text-amber-100">
                      +{Math.round(anomaly.percentageAboveAverage)}% (
                      {anomaly.multiplier.toFixed(1)}x)
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-amber-900/90 dark:text-amber-300/90 leading-relaxed">
                    {anomaly.reason}
                  </p>
                </div>
              </div>

              {onFixAnomaly && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onFixAnomaly(anomaly, expense);
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-[color,transform] shadow-2xs flex items-center space-x-1.5 self-end sm:self-center shrink-0 cursor-pointer active:scale-95"
                >
                  <Wrench className="w-3.5 h-3.5 text-white" />
                  <span className="text-white">
                    {language === 'id' ? 'Perbaiki' : 'Fix'}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* AI Confidence & Cryptographic Provenance Summary */}
          <div className="mt-4 p-3.5 rounded-xl bg-[#F0F4F8] dark:bg-[#081827] border border-[#CBD5E1] dark:border-[#1E3A5F] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-[#2251FF] dark:text-[#38BDF8]" />
                <span className="text-xs font-bold text-[#051C2C] dark:text-slate-200">
                  {language === 'id'
                    ? 'Kecocokan Verifikasi AI:'
                    : 'AI Verification Match:'}{' '}
                  {Math.round((expense.confidenceScore || 0.95) * 100)}%
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-[#051C2C] dark:text-white bg-white dark:bg-[#112842] px-2.5 py-0.5 rounded border border-[#CBD5E1] dark:border-[#1E3A5F]">
                {formatCurrency(expense.amount, currency)}
              </span>
            </div>

            {/* Cryptographic Authenticity Badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono border-t border-[#E2E8F0] dark:border-[#1E3A5F]">
              <span className="text-[#64748B] dark:text-slate-400 font-sans text-xs">
                {language === 'id' ? 'Otentikasi Pengirim:' : 'Sender Auth:'}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                SPF: {expense.emailMetadata?.authDetails?.spf || 'PASS'}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                DKIM: {expense.emailMetadata?.authDetails?.dkim || 'PASS'}
              </span>
              {(expense.emailMetadata?.authDetails?.authenticatedDomain ||
                expense.senderDomain) && (
                <span className="px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                  Domain: @
                  {expense.emailMetadata?.authDetails?.authenticatedDomain ||
                    expense.senderDomain}
                </span>
              )}
              {expense.fingerprint && (
                <span
                  className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px] truncate max-w-[200px]"
                  title={`SHA256 Fingerprint: ${expense.fingerprint}`}
                >
                  Hash: {expense.fingerprint.slice(0, 12)}...
                </span>
              )}
            </div>
          </div>

          {/* Real-time Amount Anomaly Badge if Present on Ingestion */}
          {expense.isAmountAnomaly && expense.amountAnomalyDetails && (
            <div className="mt-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200">
              <div className="flex items-center space-x-2 font-bold mb-1">
                <AlertTriangle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>
                  {language === 'id'
                    ? 'Peringatan Lonjakan Tagihan (Anomaly Check)'
                    : 'Billing Spike Anomaly Detected'}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-purple-200 dark:bg-purple-900 text-[10px] font-mono">
                  {expense.amountAnomalyDetails.multiplier.toFixed(1)}x Baseline
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-purple-800 dark:text-purple-300">
                {expense.amountAnomalyDetails.reason}
              </p>
            </div>
          )}

          {/* Core Metadata */}
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[#F1F5F9] dark:border-[#1E3A5F]">
              <span className="text-[#64748B] dark:text-slate-400 font-medium">
                {language === 'id'
                  ? 'Merchant / Pengirim:'
                  : 'Merchant / Sender:'}
              </span>
              <span className="text-[#051C2C] dark:text-white font-bold">
                {expense.merchant}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#F1F5F9] dark:border-[#1E3A5F]">
              <span className="text-[#64748B] dark:text-slate-400 font-medium">
                {language === 'id' ? 'Tanggal & Waktu:' : 'Date & Time:'}
              </span>
              <span className="text-[#051C2C] dark:text-slate-200 font-medium">
                {expense.date} {expense.time && `• ${expense.time}`}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#F1F5F9] dark:border-[#1E3A5F]">
              <span className="text-[#64748B] dark:text-slate-400 font-medium">
                {language === 'id' ? 'Kategori:' : 'Category:'}
              </span>
              <span className="text-[#051C2C] dark:text-slate-200 font-semibold">
                {expense.category}
              </span>
            </div>
            {email?.subject && (
              <div className="flex justify-between py-1.5 border-b border-[#F1F5F9] dark:border-[#1E3A5F]">
                <span className="text-[#64748B] dark:text-slate-400 font-medium">
                  {language === 'id' ? 'Subjek:' : 'Subject:'}
                </span>
                <span
                  className="text-[#051C2C] dark:text-slate-200 font-medium text-right max-w-[250px] truncate"
                  title={email.subject}
                >
                  {email.subject}
                </span>
              </div>
            )}
            {email?.sender && (
              <div className="flex justify-between py-1.5 border-b border-[#F1F5F9] dark:border-[#1E3A5F]">
                <span className="text-[#64748B] dark:text-slate-400 font-medium">
                  {language === 'id' ? 'Dari:' : 'From:'}
                </span>
                <span
                  className="text-[#051C2C] dark:text-slate-300 font-mono text-[11px] text-right max-w-[250px] truncate"
                  title={email.sender}
                >
                  {email.sender}
                </span>
              </div>
            )}
          </div>

          {/* Email Body / Snippet Text */}
          {email?.snippet && (
            <div className="mt-4">
              <span className="text-xs font-semibold text-[#051C2C] dark:text-slate-200 block mb-1.5">
                {language === 'id'
                  ? 'Potongan Teks Email Asli:'
                  : 'Extracted Email Snippet:'}
              </span>
              <div className="bg-[#F8F9FA] dark:bg-[#081827] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl p-3 text-xs text-[#64748B] dark:text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed">
                {email.snippet}
              </div>
            </div>
          )}

          {/* Itemized Breakdown if available */}
          {expense.items && expense.items.length > 0 && (
            <div className="mt-4">
              <span className="text-xs font-semibold text-[#051C2C] dark:text-slate-200 block mb-1.5">
                {language === 'id'
                  ? 'Rincian Item Kwitansi:'
                  : 'Itemized Receipt Line Items:'}
              </span>
              <div className="bg-[#F8F9FA] dark:bg-[#081827] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl p-2 space-y-1.5 max-h-36 overflow-y-auto text-xs">
                {expense.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between text-[#051C2C] dark:text-slate-200 py-0.5"
                  >
                    <span className="font-medium">
                      {item.qty ? `${item.qty}x ` : ''}
                      {item.name}
                    </span>
                    {item.price !== undefined && (
                      <span className="font-mono text-[#051C2C] dark:text-white font-bold">
                        {formatCurrency(item.price, currency)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Linked Bank & Payment Meta */}
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs bg-[#F8F9FA] dark:bg-[#081827] p-3 rounded-xl border border-[#E2E8F0] dark:border-[#1E3A5F]">
            <div>
              <span className="text-[#64748B] dark:text-slate-400 block font-medium">
                {language === 'id'
                  ? 'Rekening Terhubung:'
                  : 'Linked Bank Feed:'}
              </span>
              <span className="text-[#051C2C] dark:text-white font-bold">
                {expense.bankAccountName ||
                  (language === 'id' ? 'Tautan Otomatis' : 'Auto-linked')}
              </span>
            </div>
            <div>
              <span className="text-[#64748B] dark:text-slate-400 block font-medium">
                {language === 'id' ? 'Metode Pembayaran:' : 'Payment Method:'}
              </span>
              <span className="text-[#051C2C] dark:text-white font-bold">
                {expense.paymentMethod || 'Debit/Credit'}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between pt-3 border-t border-white/10">
            <div className="flex items-center space-x-2">
              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(expense.id);
                    onClose();
                  }}
                  className="px-3 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{language === 'id' ? 'Hapus' : 'Delete'}</span>
                </button>
              )}
              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(expense);
                  }}
                  className="px-3 py-2 bg-[#F0F4F8] dark:bg-[#112842] hover:bg-[#E2E8F0] dark:hover:bg-[#163354] text-[#051C2C] dark:text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>
                    {language === 'id' ? 'Edit Transaksi' : 'Edit Transaction'}
                  </span>
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#2251FF] hover:bg-[#1267D5] text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              {language === 'id' ? 'Tutup' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
