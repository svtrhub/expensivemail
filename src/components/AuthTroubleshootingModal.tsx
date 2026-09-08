import React, { useState } from 'react';
import { ParsedAuthError } from '../services/firebaseAuth';
import { LanguageCode } from '../services/translations';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  X,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface AuthTroubleshootingModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: ParsedAuthError | null;
  language: LanguageCode;
  onRetryGoogleSignIn: () => void;
  onContinueDemo: () => void;
  onStandardGoogleSignIn?: () => void;
}

export const AuthTroubleshootingModal: React.FC<
  AuthTroubleshootingModalProps
> = ({
  isOpen,
  onClose,
  error,
  language,
  onRetryGoogleSignIn,
  onContinueDemo,
  onStandardGoogleSignIn,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const isID = language === 'id';

  if (!isOpen || !error) return null;

  const currentHost =
    typeof window !== 'undefined' ? window.location.hostname : '';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const activeProjectId =
    (firebaseConfig as any)?.projectId || 'expensivemail-391e7';
  const consentScreenUrl = `https://console.cloud.google.com/apis/credentials/consent?project=${activeProjectId}`;

  const handleCopyDomain = () => {
    if (!currentHost) return;
    navigator.clipboard.writeText(currentHost);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleOpenNewTab = () => {
    if (typeof window !== 'undefined') {
      window.open(currentUrl, '_blank');
    }
  };

  return (
    <div
      id="auth-troubleshooting-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-troubleshoot-title"
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-[#07192C] border border-[#1E3A5F] shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E3A5F]/70 bg-[#0B2540]/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="auth-troubleshoot-title"
                className="text-base font-bold text-white tracking-tight"
              >
                {isID
                  ? 'Bantuan Autentikasi Google'
                  : 'Google Sign-In Diagnostics'}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Project: {activeProjectId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Main Error Callout */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2">
            <div className="flex items-start space-x-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-amber-200">
                  {isID ? error.messageId : error.messageEn}
                </h3>
                <p className="text-xs text-amber-300/80 mt-1 leading-relaxed">
                  {isID ? error.actionableStepId : error.actionableStepEn}
                </p>
              </div>
            </div>
          </div>

          {/* Verification / Test User Error Instructions */}
          {error.isVerificationError && (
            <div className="space-y-3.5 p-4 rounded-xl bg-[#092036] border border-[#16385C]">
              <div className="flex items-center justify-between text-xs text-slate-200 font-semibold">
                <span className="text-blue-300">
                  {isID
                    ? 'Cara Mengatasi (Dua Pilihan):'
                    : 'How to Resolve (Two Options):'}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  OAuth Consent Screen
                </span>
              </div>

              {/* Option 1: Quick Standard Login */}
              <div className="p-3.5 rounded-lg bg-[#0d2847] border border-[#204975] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300">
                    {isID
                      ? 'Pilihan 1: Masuk Langsung (Tanpa Izin Gmail)'
                      : 'Option 1: Sign In Immediately (Standard)'}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    {isID ? 'Instan & Bebas Blokir' : 'Instant & No Block'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {isID
                    ? 'Masuk menggunakan profil Google standar Anda untuk menyimpan data ke Firestore, memindai struk AI, dan mengelola anggaran keuangan tanpa perlu verifikasi Google Cloud.'
                    : 'Sign in with your standard Google profile to persist data to Firestore, scan receipts with AI, and manage budgets without needing Google Cloud verification.'}
                </p>
                {onStandardGoogleSignIn && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onStandardGoogleSignIn();
                    }}
                    className="w-full mt-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      {isID
                        ? 'Masuk Standar Sekarang'
                        : 'Sign In Standard Mode'}
                    </span>
                  </button>
                )}
              </div>

              {/* Option 2: Add to Test Users */}
              <div className="p-3.5 rounded-lg bg-[#081a2e] border border-[#1b3e64] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300">
                    {isID
                      ? 'Pilihan 2: Aktifkan Sync Gmail (Tambahkan Test User)'
                      : 'Option 2: Enable Live Gmail Sync (Add Test User)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {isID
                    ? 'Google memblokir scope gmail.readonly jika aplikasi masih dalam tahap Testing, kecuali email Anda terdaftar di Test Users Google Cloud.'
                    : 'Google restricts gmail.readonly scope during Testing unless your email is listed in Google Cloud Test Users.'}
                </p>

                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300 leading-normal pl-1">
                  <li>
                    {isID
                      ? 'Buka Google Cloud OAuth Consent Screen:'
                      : 'Open Google Cloud OAuth Consent Screen:'}{' '}
                    <a
                      href={consentScreenUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline inline-flex items-center ml-1 text-xs font-mono"
                    >
                      Buka Konsol{' '}
                      <ExternalLink className="w-3 h-3 ml-0.5 inline" />
                    </a>
                  </li>
                  <li>
                    {isID
                      ? 'Gulir ke bawah ke bagian "Test users" (Pengguna uji coba).'
                      : 'Scroll down to the "Test users" section.'}
                  </li>
                  <li>
                    {isID
                      ? 'Klik "+ ADD USERS" dan masukkan email Google Anda.'
                      : 'Click "+ ADD USERS" and enter your Google account email.'}
                  </li>
                  <li>
                    {isID
                      ? 'Klik "SAVE" (Simpan), lalu coba login kembali di aplikasi ini.'
                      : 'Click "SAVE", then retry sign-in on this application.'}
                  </li>
                  <li>
                    {isID
                      ? 'Saat muncul peringatan "Google belum memverifikasi aplikasi ini", klik Lanjutan (Advanced) -> Buka expensivemail-391e7 (tidak aman) -> Lanjutkan.'
                      : 'When prompted with "Google hasn\'t verified this app", click Advanced -> Go to expensivemail-391e7 (unsafe) -> Continue.'}
                  </li>
                </ol>

                <div className="pt-2">
                  <a
                    href={consentScreenUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-lg bg-blue-600/30 hover:bg-blue-600/40 border border-blue-500/40 text-blue-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>
                      {isID
                        ? 'Buka Pengaturan Test Users di Google Cloud'
                        : 'Open Test Users in Google Cloud Console'}
                    </span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Domain Instructions if Domain is unauthorized */}
          {error.isDomainError && (
            <div className="space-y-3 p-4 rounded-xl bg-[#092036] border border-[#16385C]">
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                <span>
                  {isID
                    ? 'Domain Pratinjau Saat Ini:'
                    : 'Current Preview Domain:'}
                </span>
                <span className="text-[11px] text-blue-400 font-mono">
                  {isID ? 'Salin domain ini' : 'Copy this domain'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-[#051424] border border-[#1B3B60] text-xs font-mono text-cyan-300 select-all truncate">
                  {currentHost}
                </code>
                <button
                  type="button"
                  onClick={handleCopyDomain}
                  className="px-3 py-2 rounded-lg bg-[#2251FF] hover:bg-[#1C44DE] text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-300" />
                      <span>{isID ? 'Disalin' : 'Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{isID ? 'Salin' : 'Copy'}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-xs text-slate-400 space-y-1.5 pt-2 border-t border-[#16385C]">
                <p className="font-semibold text-slate-300">
                  {isID
                    ? 'Langkah di Firebase Console:'
                    : 'Steps in Firebase Console:'}
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 leading-normal">
                  <li>
                    {isID
                      ? `Buka Firebase Console -> project ${activeProjectId}`
                      : `Open Firebase Console -> project ${activeProjectId}`}
                  </li>
                  <li>
                    {isID
                      ? 'Pilih Authentication -> Settings -> Authorized Domains'
                      : 'Navigate to Authentication -> Settings -> Authorized Domains'}
                  </li>
                  <li>
                    {isID
                      ? 'Klik Add Domain dan tempelkan domain di atas'
                      : 'Click Add Domain and paste the domain above'}
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* Popup Blocked Instructions */}
          {error.isPopupBlocked && (
            <div className="p-4 rounded-xl bg-[#092036] border border-[#16385C] space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                {isID
                  ? 'Browser Anda atau pembatas iframe memblokir popup Google Sign-In. Anda dapat membuka pratinjau di tab browser penuh untuk menyelesaikan autentikasi.'
                  : 'Your browser or iframe sandbox blocked the Google Sign-In popup. You can open the preview in a full browser tab to authenticate.'}
              </p>
              <button
                type="button"
                onClick={handleOpenNewTab}
                className="w-full px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-blue-400" />
                <span>
                  {isID ? 'Buka di Tab Baru' : 'Open Preview in New Tab'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 px-6 py-4 border-t border-[#1E3A5F]/70 bg-[#0B2540]/60">
          <button
            type="button"
            onClick={() => {
              onClose();
              onContinueDemo();
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {isID ? 'Masuk Mode Demo Interaktif' : 'Explore Demo Ledger'}
            </span>
          </button>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-transparent hover:bg-white/5 text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              {isID ? 'Tutup' : 'Close'}
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onRetryGoogleSignIn();
              }}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#2251FF] hover:bg-[#1C44DE] text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-lg cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isID ? 'Coba Lagi' : 'Retry Sign In'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
