import React from 'react';
import { SupportedCurrency, formatCurrency } from '../services/currency';
import { LanguageCode } from '../services/translations';
import { ThemeMode } from '../types';
import {
  Mail,
  ArrowRight,
  AlertTriangle,
  Coins,
  CheckCircle2,
  ChevronRight,
  UserPlus,
  ArrowUpRight,
  Activity,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { InView } from './motion/in-view';
import { TextEffect } from './motion/text-effect';
import bluecosmosBg from '../assets/bluecosmos.webp';

interface LandingPageProps {
  onGetStarted: () => void;
  onGoogleSignIn: () => void;
  onExploreDemo: () => void;
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  currency: SupportedCurrency;
  onCurrencyChange: (curr: SupportedCurrency) => void;
  isAuthenticating?: boolean;
  theme?: ThemeMode;
  onSelectTheme?: (theme: ThemeMode) => void;
  onToggleTheme?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onGoogleSignIn,
  onExploreDemo,
  language,
  onLanguageChange,
  currency,
  isAuthenticating = false,
}) => {
  const isID = language === 'id';

  return (
    <div className="min-h-[100dvh] text-[#E2E8F0] flex flex-col font-sans selection:bg-[#2251FF] selection:text-white relative overflow-x-hidden bg-[#051C2C]">
      {/* Static Background Image Layer — GPU Accelerated & Eagerly Decoded */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none transform-gpu will-change-transform">
        <img
          src={bluecosmosBg}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="async"
          loading="eager"
          className="w-full h-full object-cover object-center opacity-85 transform-gpu"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#2251FF]/25 via-transparent to-[#051C2C]/80 pointer-events-none" />
      </div>

      {/* Top Accent Rule */}
      <div className="h-1 w-full bg-[#2251FF] relative z-20" />

      {/* Header */}
      <header className="relative z-20 border-b border-[rgba(163,226,255,0.20)] bg-[#051C2C]/50 backdrop-blur-2xl backdrop-saturate-[185%] sticky top-0 px-4 sm:px-6 lg:px-8 py-3 transition-all duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-editorial text-lg sm:text-xl font-bold tracking-tight text-white">
              Expensive<span className="text-[#2251FF]">Mail</span>
            </span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Language Selector */}
            <div className="flex items-center rounded-lg bg-white/5 backdrop-blur-md border border-[rgba(163,226,255,0.20)] p-0.5 text-xs font-semibold text-white">
              <button
                onClick={() => onLanguageChange('id')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  language === 'id'
                    ? 'bg-[#2251FF] text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-[#94A3B8] hover:text-[#051C2C] dark:hover:text-white'
                }`}
                title="Bahasa Indonesia"
              >
                ID
              </button>
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  language === 'en'
                    ? 'bg-[#2251FF] text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-[#94A3B8] hover:text-[#051C2C] dark:hover:text-white'
                }`}
                title="English (US)"
              >
                EN
              </button>
            </div>

            {/* Sign In Button */}
            <button
              id="landing-google-signin-top-btn"
              onClick={onGoogleSignIn}
              disabled={isAuthenticating}
              className="hidden md:inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/12 text-white text-xs font-semibold border border-white/15 hover:border-[#2251FF]/40 backdrop-blur-xl transition-all cursor-pointer disabled:opacity-50 shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                />
              </svg>
              <span>{isID ? 'Masuk' : 'Sign In'}</span>
            </button>

            {/* Get Started Button */}
            <button
              id="landing-create-account-top-btn"
              onClick={onGetStarted}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-[#2251FF]/35 hover:bg-[#2251FF]/50 text-white text-xs font-bold shadow-[0_4px_20px_rgba(34,81,255,0.25)] border border-[#2251FF]/50 hover:border-[#2251FF] backdrop-blur-xl transition-all cursor-pointer active:scale-[0.98]"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isID ? 'Daftar' : 'Get Started'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-16 flex-1 flex flex-col">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#2251FF]/20 border border-[#2251FF]/40 text-[#60A5FA] text-[11px] font-mono font-bold uppercase tracking-wider mb-5 backdrop-blur-md">
            <Activity
              className="w-3.5 h-3.5 text-[#60A5FA]"
              aria-hidden="true"
            />
            <span>
              {isID
                ? 'EKSTRAKSI STRUK EMAIL & DETEKSI PENGELUARAN'
                : 'RECEIPT EXTRACTION & EXPENSE RADAR'}
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white font-editorial tracking-tight leading-[1.1] sm:leading-[1.1] max-w-3xl mx-auto text-readability-shadow">
            <TextEffect preset="fade-in-blur" per="word">
              {isID ? 'Buku Kas Email Otomatis' : 'Your Automatic Email Ledger'}
            </TextEffect>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-200 max-w-2xl mx-auto font-medium leading-relaxed text-balance text-readability-shadow">
            {isID
              ? 'ExpensiveMail membaca aktivitas transaksi Anda dari email dan mencatatnya secara otomatis. Dapatkan wawasan keuangan, notifikasi lonjakan harga, dan konversi mata uang secara real-time.'
              : 'ExpensiveMail reads your transaction activity from email and records it automatically. Get financial insights, price spike alerts, and real-time currency conversion.'}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-xl mx-auto w-full">
            <button
              id="landing-hero-build-account-btn"
              onClick={onGetStarted}
              className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-[#2251FF]/40 hover:bg-[#2251FF]/60 backdrop-blur-xl border border-[#2251FF]/60 hover:border-[#2251FF] text-white font-bold text-sm shadow-[0_4px_25px_rgba(34,81,255,0.35)] hover:shadow-[0_0_35px_rgba(34,81,255,0.6)] transition-all duration-200 cursor-pointer flex items-center justify-center space-x-2.5 active:scale-[0.98] group min-h-[48px]"
              aria-label="Get Started with ExpensiveMail"
            >
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              <span>{isID ? 'Mulai Sekarang' : 'Get Started'}</span>
              <ArrowRight
                className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                aria-hidden="true"
              />
            </button>

            <button
              id="landing-hero-google-btn"
              onClick={onGoogleSignIn}
              disabled={isAuthenticating}
              className="w-full sm:w-auto px-5 py-3.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white font-semibold text-sm border border-white/20 hover:border-white/35 transition-all duration-200 cursor-pointer flex items-center justify-center space-x-2.5 disabled:opacity-50 shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:scale-[0.98] min-h-[48px]"
              aria-label="Sign in with Google"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                />
              </svg>
              <span>
                {isID ? 'Masuk dengan Google' : 'Sign in with Google'}
              </span>
            </button>
          </div>

          <div className="mt-4">
            <button
              id="landing-hero-demo-btn"
              onClick={onExploreDemo}
              className="text-xs text-slate-500 dark:text-[#94A3B8] hover:text-[#2251FF] dark:hover:text-[#38BDF8] font-semibold underline underline-offset-4 transition-colors cursor-pointer inline-flex items-center space-x-1"
            >
              <span>
                {isID
                  ? 'Lihat buku kas dalam mode demo'
                  : 'Open interactive sample ledger'}
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* EXHIBIT 1: REAL-TIME LEDGER PREVIEW */}
        <section className="mt-12 max-w-5xl mx-auto w-full">
          <InView
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <div className="glass-card rounded-2xl overflow-hidden transition-colors text-white">
              <div className="glass-content">
                <div className="bg-white/5 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2.5">
                    <span className="px-2 py-0.5 rounded-xs font-mono font-bold bg-white/10 text-[#38BDF8] border border-white/15">
                      EXHIBIT 1
                    </span>
                    <span className="font-bold text-white tracking-tight">
                      {isID
                        ? 'Tinjauan Pembukuan dan Deteksi Anomali'
                        : 'Parsed Receipts and Outlier Log'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 font-mono text-[11px] text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>
                      {isID
                        ? 'STATUS: SINKRONISASI AKTIF'
                        : 'STATUS: SYNC ACTIVE'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-white/10 divide-y sm:divide-y-0 sm:divide-x divide-white/10 bg-white/5 backdrop-blur-md">
                  <div className="p-4 sm:p-5">
                    <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {isID
                        ? 'Total Pengeluaran Bulan Ini'
                        : 'Monthly Spending'}
                    </p>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-xl sm:text-2xl font-bold font-editorial text-white">
                        {formatCurrency(14850000, currency)}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-400 font-mono">
                        +12.4% vs bulan lalu
                      </span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5">
                    <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {isID ? 'Akurasi Pengenalan Data' : 'Parser Accuracy'}
                    </p>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-xl sm:text-2xl font-bold font-editorial text-white">
                        99.4%
                      </span>
                      <span className="text-[11px] font-bold text-[#38BDF8] font-mono">
                        BCA, Mandiri, Apple
                      </span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 bg-amber-500/10">
                    <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300 mb-1 flex items-center space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {isID ? 'Anomali Perlu Ditinjau' : 'Flagged Outliers'}
                      </span>
                    </p>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-xl sm:text-2xl font-bold font-editorial text-amber-200">
                        1 Transaksi
                      </span>
                      <span className="text-[11px] font-bold text-amber-400 font-mono">
                        3.2x di atas rata-rata
                      </span>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-slate-300 font-mono text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-4">
                          {isID ? 'Tanggal' : 'Date'}
                        </th>
                        <th className="py-3 px-4">
                          {isID
                            ? 'Merchant dan Rincian'
                            : 'Merchant and Details'}
                        </th>
                        <th className="py-3 px-4">
                          {isID ? 'Kategori' : 'Category'}
                        </th>
                        <th className="py-3 px-4 text-right">
                          {isID ? 'Nominal' : 'Amount'}
                        </th>
                        <th className="py-3 px-4 text-center">
                          {isID ? 'Sumber' : 'Source'}
                        </th>
                        <th className="py-3 px-4 text-center">
                          {isID ? 'Status' : 'Status'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#162E4D] font-sans">
                      <tr className="hover:bg-[#F8F9FA] dark:hover:bg-[#112842] transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-[#94A3B8]">
                          2026-08-21
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#051C2C] dark:text-white">
                            GrabFood Indonesia
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                            Makan siang tim (GoPay)
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/20">
                            Food & Dining
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#051C2C] dark:text-white">
                          Rp 184.500
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-[10px] text-slate-500 dark:text-[#94A3B8]">
                          gmail_sync
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                            <span>Tercatat</span>
                          </span>
                        </td>
                      </tr>

                      <tr className="bg-amber-50/70 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors border-l-2 border-l-amber-500">
                        <td className="py-3 px-4 font-mono text-amber-800 dark:text-amber-200">
                          2026-08-20
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-amber-950 dark:text-amber-100 flex items-center space-x-1.5">
                            <span>Apple Store Billing</span>
                            <span className="px-1.5 py-0.2 rounded-xs text-[9px] font-bold uppercase bg-amber-500 text-black">
                              Lonjakan
                            </span>
                          </div>
                          <div className="text-[11px] text-amber-700 dark:text-amber-300/80">
                            Langganan tahunan (Kartu Jenius)
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                            Software & IT
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-900 dark:text-amber-200">
                          $ 299.00{' '}
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            (Rp 4.784.000)
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-[10px] text-amber-700 dark:text-amber-300/70">
                          gmail_sync
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Perlu Dicek</span>
                          </span>
                        </td>
                      </tr>

                      <tr className="hover:bg-[#F8F9FA] dark:hover:bg-[#112842] transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-[#94A3B8]">
                          2026-08-19
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#051C2C] dark:text-white">
                            Bank Central Asia (BCA)
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                            Transfer Virtual Account Tokopedia
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/20">
                            Office Equipment
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#051C2C] dark:text-white">
                          Rp 1.450.000
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-[10px] text-slate-500 dark:text-[#94A3B8]">
                          bca_notif
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                            <span>Tercatat</span>
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-[#F8F9FA] dark:bg-[#0A1C30] border-t border-[#CBD5E1] dark:border-[#1E3A5F] flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-[#94A3B8]">
                  <span className="font-mono text-[11px]">
                    {isID
                      ? 'Aturan kategori dan akun diterapkan otomatis'
                      : 'Category and account rules applied automatically'}
                  </span>
                  <button
                    onClick={onExploreDemo}
                    className="text-[#2251FF] dark:text-[#38BDF8] hover:underline font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                  >
                    <span>
                      {isID
                        ? 'Buka Buku Kas Lengkap'
                        : 'View Full Ledger in Demo'}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </InView>
        </section>

        {/* 3 CORE CAPABILITIES */}
        <section className="mt-16 max-w-5xl mx-auto w-full">
          <InView
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <div className="text-center mb-8">
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#2251FF] mb-2">
                {isID ? 'FITUR UTAMA' : 'CORE CAPABILITIES'}
              </h2>
              <p className="text-xl sm:text-2xl font-bold font-editorial text-[#051C2C] dark:text-white">
                {isID
                  ? 'Pencatatan langsung, deteksi lonjakan harga, dan hitungan multi-valas'
                  : 'Direct receipt capture, outlier alerts, and multi-currency balances'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
              <div className="p-6 rounded-xl bg-white dark:bg-[#0D2238] border border-[#CBD5E1] dark:border-[#1E3A5F] flex flex-col justify-between hover:border-[#2251FF] shadow-xs transition-colors">
                <div>
                  <div className="font-mono text-xs font-bold text-[#2251FF] mb-2">
                    01
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] dark:bg-[#0A1C30] text-[#2251FF] dark:text-[#38BDF8] flex items-center justify-center mb-4 border border-[#BFDBFE] dark:border-[#1E3A5F]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-[#051C2C] dark:text-white font-editorial mb-2">
                    {isID
                      ? 'Ekstraksi Email Otomatis'
                      : 'Automatic Email Extraction'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-[#CBD5E1] leading-relaxed">
                    {isID
                      ? 'Sistem membaca email notifikasi transaksi dari bank dan merchant lalu mencatat nominal, tanggal, dan nama toko tanpa perlu input manual.'
                      : 'Extracts amount, date, and vendor details from incoming bank notices and invoices without manual typing.'}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-[#E2E8F0] dark:border-[#1E3A5F] flex items-center space-x-1.5 text-[11px] font-mono text-[#2251FF] dark:text-[#38BDF8] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {isID ? 'Sinkronisasi langsung' : 'Direct inbox sync'}
                  </span>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-white dark:bg-[#0D2238] border border-[#CBD5E1] dark:border-[#1E3A5F] flex flex-col justify-between hover:border-amber-500/60 shadow-xs transition-colors">
                <div>
                  <div className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 mb-2">
                    02
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-[#0A1C30] text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 border border-amber-200 dark:border-[#1E3A5F]">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-[#051C2C] dark:text-white font-editorial mb-2">
                    {isID ? 'Peringatan Anomali' : 'Outlier and Spike Alerts'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-[#CBD5E1] leading-relaxed">
                    {isID
                      ? 'Menandai pengeluaran yang jauh di atas rata-rata kategori, tagihan ganda, atau kenaikan biaya langganan agar Anda bisa langsung memperbaikinya.'
                      : 'Flags expenses that exceed your typical category average, repeated charges, or subscription price increases.'}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-[#E2E8F0] dark:border-[#1E3A5F] flex items-center space-x-1.5 text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isID ? 'Koreksi 1 klik' : '1-click adjustments'}</span>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-white dark:bg-[#0D2238] border border-[#CBD5E1] dark:border-[#1E3A5F] flex flex-col justify-between hover:border-emerald-500/60 shadow-xs transition-colors">
                <div>
                  <div className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                    03
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-[#0A1C30] text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-200 dark:border-[#1E3A5F]">
                    <Coins className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-[#051C2C] dark:text-white font-editorial mb-2">
                    {isID
                      ? 'Kurs Valas dan Ekspor'
                      : 'Live Currencies and Export'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-[#CBD5E1] leading-relaxed">
                    {isID
                      ? 'Mendukung konversi IDR, USD, SGD, EUR, dan JPY secara otomatis dengan opsi ekspor ke file CSV atau Excel yang siap pakai.'
                      : 'Converts IDR, USD, SGD, EUR, and JPY using current exchange rates, with easy export to CSV or Excel.'}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-[#E2E8F0] dark:border-[#1E3A5F] flex items-center space-x-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isID ? 'Format siap ekspor' : 'Export ready'}</span>
                </div>
              </div>
            </div>
          </InView>
        </section>

        {/* FINAL CTA */}
        <section className="mt-16 max-w-4xl mx-auto w-full">
          <InView
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <div className="p-8 sm:p-10 rounded-2xl bg-[#0D2E78]/30 backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.4)] text-center relative overflow-hidden">
              <h3 className="text-2xl sm:text-3xl font-bold font-editorial text-white mb-3">
                {isID
                  ? 'Mulai atur pengeluaran Anda hari ini'
                  : 'Start tracking your expenses today'}
              </h3>
              <p className="text-xs sm:text-sm text-[#CBD5E1] max-w-xl mx-auto mb-6">
                {isID
                  ? 'Buat akun Anda atau langsung coba buku kas contoh tanpa registrasi.'
                  : 'Create an account or test our features immediately with the sample ledger.'}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={onGetStarted}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#2251FF]/35 hover:bg-[#2251FF]/50 backdrop-blur-xl border border-[#2251FF]/50 hover:border-[#2251FF] text-white font-bold text-xs shadow-[0_4px_20px_rgba(34,81,255,0.25)] transition-all duration-200 cursor-pointer flex items-center justify-center space-x-2 active:scale-[0.98]"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isID ? 'Buat Akun' : 'Create Account'}</span>
                </button>
                <button
                  onClick={onExploreDemo}
                  className="w-full sm:w-auto px-5 py-3 rounded-full bg-white/8 hover:bg-white/15 backdrop-blur-xl text-white font-bold text-xs border border-white/15 hover:border-white/25 transition-all duration-200 cursor-pointer flex items-center justify-center space-x-2 active:scale-[0.98] group"
                >
                  <span>{isID ? 'Buka Mode Demo' : 'Open Demo Mode'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </InView>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#CBD5E1] dark:border-[#1E3A5F] bg-[#F1F5F9] dark:bg-[#03131E] py-6 px-4 text-xs text-slate-600 dark:text-[#64748B] transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 font-mono text-[11px]">
            <span className="font-bold text-[#051C2C] dark:text-[#CBD5E1] font-editorial">
              ExpensiveMail
            </span>
            <span>•</span>
            <span>Pencatatan Keuangan dan Struk Email</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-600 dark:text-[#94A3B8]">
            <button
              onClick={onGetStarted}
              className="hover:text-[#051C2C] dark:hover:text-white transition-colors cursor-pointer"
            >
              {isID ? 'Buat Akun' : 'Create Account'}
            </button>
            <button
              onClick={onGoogleSignIn}
              className="hover:text-[#051C2C] dark:hover:text-white transition-colors cursor-pointer"
            >
              {isID ? 'Masuk' : 'Sign In'}
            </button>
            <button
              onClick={onExploreDemo}
              className="hover:text-[#051C2C] dark:hover:text-white transition-colors cursor-pointer"
            >
              {isID ? 'Mode Demo' : 'Demo Mode'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
