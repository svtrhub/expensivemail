import React, { useState } from 'react';
import { SyncLog, BankAccount } from '../types';
import { formatCurrency, SupportedCurrency } from '../services/currency';
import { Translations } from '../services/translations';
import { INDONESIAN_BANK_TEMPLATES } from '../services/mockBankData';
import {
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Mail,
  Sparkles,
} from 'lucide-react';

interface MailSyncDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  syncLogs: SyncLog[];
  isSyncing: boolean;
  onSyncNow: () => void;
  autoSyncEnabled: boolean;
  onToggleAutoSync: () => void;
  knownAccounts: BankAccount[];
  onTestEmailParsed: (emailText: string) => Promise<void>;
  isTestingEmail: boolean;
  currency: SupportedCurrency;
  language?: 'en' | 'id';
  t: Translations;
}

export const MailSyncDrawer: React.FC<MailSyncDrawerProps> = ({
  isOpen,
  onClose,
  syncLogs,
  isSyncing,
  onSyncNow,
  autoSyncEnabled,
  onToggleAutoSync,
  knownAccounts,
  onTestEmailParsed,
  isTestingEmail,
  currency,
  language = 'id',
  t,
}) => {
  const [testEmailContent, setTestEmailContent] = useState('');
  const [activeTab, setActiveTab] = useState<'logs' | 'test_parser'>('logs');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  if (!isOpen) return null;

  const sampleReceipts =
    currency === 'IDR'
      ? INDONESIAN_BANK_TEMPLATES
      : [
          {
            id: 'uber_ride',
            label: 'Uber Ride Receipt',
            bank: 'Chase Bank',
            text: 'From: Uber Receipts <receipts@uber.com>\nSubject: Your trip with Uber on Tuesday\n\nThanks for riding! Total: $34.20 charged to Chase Sapphire Visa •••• 4281.\nBreakdown:\nUberX: $29.20\nDriver Tip: $5.00',
          },
          {
            id: 'apple_store',
            label: 'Apple Store Receipt',
            bank: 'Apple Card',
            text: 'From: Apple Store <no_reply@email.apple.com>\nSubject: Your invoice #MW-991204\n\nOrder Total: $14.99\nPayment Method: Apple Card (•••• 1109)\nItem: iCloud+ 2TB Monthly Storage Subscription',
          },
          {
            id: 'chase_alert',
            label: 'Chase Bank Alert',
            bank: 'Chase Bank',
            text: "From: Chase Fraud Alerts <alerts@chase.com>\nSubject: Transaction Alert: $89.50 at Trader Joe's\n\nYour Chase Debit card ending in 9104 was charged $89.50 on Aug 18, 2026 at TRADER JOE'S STORE #54.",
          },
        ];

  const handleSelectTemplate = (template: { id: string; text: string }) => {
    setSelectedTemplateId(template.id);
    setTestEmailContent(template.text);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-xl bg-[#081B2E]/95 backdrop-blur-2xl border-l border-white/15 text-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 transition-colors">
        {/* Drawer Header */}
        <div className="p-5 border-b border-white/15 flex items-center justify-between bg-white/5 backdrop-blur-md">
          <div className="flex items-center space-x-3 min-w-0">
            <div
              className="p-2.5 rounded-xl bg-[#2251FF]/20 text-[#60A5FA] shrink-0 shadow-xs"
              aria-hidden="true"
            >
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight font-editorial truncate">
                {language === 'id'
                  ? 'Sinkronisasi Email & Ekstraksi AI'
                  : 'Email Synchronization & Extraction'}
              </h2>
              <p className="text-xs text-slate-200 truncate font-medium">
                {language === 'id'
                  ? 'Audit kotak masuk otomatis dan parser cerdas transaksi'
                  : 'Autonomous mailbox reconciliation and intelligence parser'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0 ml-3 min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Close drawer"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/15 px-5 bg-white/5 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-3 text-xs font-bold border-b-2 mr-6 transition-colors cursor-pointer min-h-[44px] ${
              activeTab === 'logs'
                ? 'border-[#60A5FA] text-[#60A5FA]'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
            aria-label="Sync Logs tab"
          >
            <span className="tabular-nums font-mono">
              {language === 'id' ? 'Riwayat Sinkronisasi' : 'Sync Logs'} (
              {syncLogs.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab('test_parser')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 min-h-[44px] ${
              activeTab === 'test_parser'
                ? 'border-[#60A5FA] text-[#60A5FA]'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
            aria-label="Test AI Parser tab"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#2251FF] dark:text-[#38BDF8]" />
            <span>
              {language === 'id' ? 'Uji Parser AI' : 'AI Parser Workbench'}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F8F9FA] dark:bg-[#081827]">
          {activeTab === 'logs' ? (
            <>
              {/* Sync Controls Bar */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-[#0D2238] border border-[#CBD5E1] dark:border-[#1E3A5F] shadow-2xs">
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`}
                  />
                  <span className="text-xs font-medium text-[#64748B] dark:text-slate-400">
                    {language === 'id' ? 'Auto-Sinkronisasi:' : 'Auto-Sync:'}
                  </span>
                  <span className="text-xs font-bold text-[#2251FF] dark:text-[#38BDF8]">
                    {autoSyncEnabled
                      ? language === 'id'
                        ? 'AKTIF'
                        : 'ENABLED'
                      : language === 'id'
                        ? 'JEDA'
                        : 'PAUSED'}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={onToggleAutoSync}
                    className="text-xs text-slate-600 dark:text-slate-300 hover:text-[#051C2C] dark:hover:text-white px-2.5 py-1 bg-slate-100 dark:bg-[#163354] hover:bg-slate-200 dark:hover:bg-[#1E4373] rounded-md font-semibold cursor-pointer border border-slate-200 dark:border-[#1E3A5F]"
                  >
                    {autoSyncEnabled
                      ? language === 'id'
                        ? 'Jeda'
                        : 'Pause'
                      : language === 'id'
                        ? 'Aktifkan'
                        : 'Enable'}
                  </button>
                  <button
                    onClick={onSyncNow}
                    disabled={isSyncing}
                    className="flex items-center space-x-1 text-xs font-bold bg-[#2251FF] hover:bg-[#1267D5] text-white px-3 py-1 rounded-md transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`}
                    />
                    <span>
                      {isSyncing
                        ? language === 'id'
                          ? 'Memindai...'
                          : 'Scanning...'
                        : language === 'id'
                          ? 'Sinkron Sekarang'
                          : 'Sync Now'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Logs Timeline */}
              <div className="space-y-3">
                {syncLogs.length === 0 ? (
                  <p className="text-xs text-[#64748B] dark:text-slate-400 text-center py-8">
                    {language === 'id'
                      ? 'Belum ada riwayat sinkronisasi.'
                      : 'No sync history yet.'}
                  </p>
                ) : (
                  syncLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-xl bg-white dark:bg-[#0D2238] border border-[#CBD5E1] dark:border-[#1E3A5F] shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {log.status === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          ) : log.status === 'in_progress' ? (
                            <RefreshCw className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          )}
                          <span className="text-xs font-bold text-[#051C2C] dark:text-white">
                            {log.message}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#64748B] dark:text-slate-400 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-slate-600 dark:text-slate-300 bg-[#F8F9FA] dark:bg-[#081827] px-3 py-2 rounded-lg font-mono border border-[#E2E8F0] dark:border-[#1E3A5F]">
                        <div>
                          {language === 'id' ? 'Dipindai:' : 'Scanned:'}{' '}
                          <span className="text-[#051C2C] dark:text-white font-bold">
                            {log.emailsScanned}
                          </span>
                        </div>
                        <div>
                          {language === 'id' ? 'Tercatat:' : 'Captured:'}{' '}
                          <span className="text-[#2251FF] dark:text-[#38BDF8] font-bold">
                            {log.expensesFound}
                          </span>
                        </div>
                        <div>
                          {language === 'id' ? 'Nominal:' : 'Amount:'}{' '}
                          <span className="text-[#051C2C] dark:text-white font-bold">
                            {formatCurrency(log.totalAmountParsed, currency)}
                          </span>
                        </div>
                      </div>

                      {log.detailedItems && log.detailedItems.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {log.detailedItems.map((item, i) => (
                            <div
                              key={i}
                              className="text-[11px] flex items-center justify-between text-slate-700 dark:text-slate-300 pl-2 border-l-2 border-[#2251FF] dark:border-[#38BDF8]"
                            >
                              <span className="truncate max-w-[280px] font-medium">
                                {item.merchant} ({item.category})
                              </span>
                              <span className="font-mono text-[#051C2C] dark:text-white font-bold">
                                {formatCurrency(item.amount, currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            /* Test AI Parser Sandbox */
            <div className="space-y-4">
              <div className="p-3.5 bg-[#F0F4F8] dark:bg-[#0D2238] border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-xl text-xs text-[#051C2C] dark:text-white">
                <p className="font-bold mb-1 font-editorial">
                  {language === 'id'
                    ? 'Laboratorium Pengujian Parser AI'
                    : 'Intelligent Parsing Sandbox'}
                </p>
                <p className="text-[#64748B] dark:text-slate-400 text-[11px]">
                  {language === 'id'
                    ? 'Tempelkan notifikasi bank, kwitansi Gojek/Grab/Shopee, invoice, atau mutasi rekening untuk menguji ekstraksi data otomatis.'
                    : 'Paste any bank notification, Gojek/Grab receipt, invoice snippet, or statement below to execute unstructured data extraction.'}
                </p>
              </div>

              {/* Sample Quick Chips */}
              <div>
                <span className="text-[11px] text-[#64748B] dark:text-slate-400 block mb-1.5 font-bold">
                  {language === 'id'
                    ? 'Template Bank & E-Wallet Indonesia:'
                    : 'Sample Receipts & Bank Alerts:'}
                </span>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {sampleReceipts.map((s) => {
                    const isSelected = selectedTemplateId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectTemplate(s)}
                        className={`text-left p-2.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#F0F4F8] dark:bg-[#163354] border-[#2251FF] dark:border-[#38BDF8] text-[#051C2C] dark:text-white ring-1 ring-[#2251FF]'
                            : 'bg-white dark:bg-[#0D2238] hover:bg-[#F8F9FA] dark:hover:bg-[#112842] border-[#CBD5E1] dark:border-[#1E3A5F] text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="font-bold truncate flex items-center justify-between">
                          <span>{s.label}</span>
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2251FF] dark:bg-[#38BDF8]" />
                          )}
                        </div>
                        <div className="text-[10px] text-[#64748B] dark:text-slate-400 truncate mt-0.5">
                          {s.bank}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#051C2C] dark:text-white block mb-1.5">
                  {language === 'id'
                    ? 'Teks Email / Struk Pembayaran:'
                    : 'Email Content / Receipt Text:'}
                </label>
                <textarea
                  value={testEmailContent}
                  onChange={(e) => setTestEmailContent(e.target.value)}
                  placeholder={
                    language === 'id'
                      ? 'Tempel teks email struk atau SMS notifikasi di sini...'
                      : 'Paste email headers and body here...'
                  }
                  rows={8}
                  className="w-full p-3 bg-white dark:bg-[#0D2238] border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-xl text-xs font-mono text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#2251FF]"
                />
              </div>

              <button
                onClick={() => onTestEmailParsed(testEmailContent)}
                disabled={!testEmailContent.trim() || isTestingEmail}
                className="w-full py-2.5 rounded-xl bg-[#2251FF] hover:bg-[#1267D5] text-white text-xs font-bold shadow-2xs transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                <Sparkles
                  className={`w-4 h-4 ${isTestingEmail ? 'animate-spin' : ''}`}
                />
                <span>
                  {isTestingEmail
                    ? language === 'id'
                      ? 'Mengekstrak dengan Gemini AI...'
                      : 'Extracting with Gemini AI...'
                    : language === 'id'
                      ? 'Pindai & Masukkan ke Pengeluaran'
                      : 'Parse & Add to Expenses'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
