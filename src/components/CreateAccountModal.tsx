import React, { useState } from 'react';
import { UserProfile, EntityType } from '../types';
import {
  SupportedCurrency,
  CURRENCIES,
  formatCurrency,
} from '../services/currency';
import { LanguageCode, Translations } from '../services/translations';
import {
  X,
  User as UserIcon,
  Building2,
  Briefcase,
  Mail,
  Lock,
  Phone,
  Coins,
  Globe,
  Target,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountCreated: (
    profile: UserProfile,
    selectedBanks: string[],
    initialBudgetGoal: number
  ) => void;
  currentCurrency: SupportedCurrency;
  currentLanguage: LanguageCode;
  t: Translations;
  onOpenLogin: () => void;
}

const AVAILABLE_INSTITUTIONS = [
  {
    id: 'bca',
    name: 'Bank Central Asia (BCA)',
    type: 'checking',
    color: '#00529C',
    defaultMask: '•••• 8821',
  },
  {
    id: 'mandiri',
    name: 'Bank Mandiri',
    type: 'checking',
    color: '#003876',
    defaultMask: '•••• 1904',
  },
  {
    id: 'jenius',
    name: 'Jenius / BTPN',
    type: 'checking',
    color: '#00A4E4',
    defaultMask: '•••• 3310',
  },
  {
    id: 'bni',
    name: 'Bank Negara Indonesia (BNI)',
    type: 'checking',
    color: '#005E5D',
    defaultMask: '•••• 5520',
  },
  {
    id: 'bri',
    name: 'Bank Rakyat Indonesia (BRI)',
    type: 'checking',
    color: '#00529C',
    defaultMask: '•••• 7741',
  },
  {
    id: 'gopay',
    name: 'GoPay / GoTo Financial',
    type: 'digital_wallet',
    color: '#00AA13',
    defaultMask: '•••• 0812',
  },
  {
    id: 'shopeepay',
    name: 'ShopeePay',
    type: 'digital_wallet',
    color: '#EE4D2D',
    defaultMask: '•••• 9940',
  },
  {
    id: 'ovo',
    name: 'OVO Digital Wallet',
    type: 'digital_wallet',
    color: '#4C3494',
    defaultMask: '•••• 6401',
  },
  {
    id: 'amex',
    name: 'Corporate Platinum Card',
    type: 'credit',
    color: '#001A3D',
    defaultMask: '•••• 9002',
  },
];

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  isOpen,
  onClose,
  onAccountCreated,
  currentCurrency,
  currentLanguage,
  onOpenLogin,
}) => {
  const isID = currentLanguage === 'id';
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [entityType, setEntityType] = useState<EntityType>('personal');
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');

  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>(
    currentCurrency || 'IDR'
  );
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(
    currentLanguage || 'id'
  );
  const [monthlyBudgetGoal, setMonthlyBudgetGoal] = useState<number>(
    selectedCurrency === 'IDR' ? 10000000 : 2000
  );

  const [selectedInstitutions, setSelectedInstitutions] = useState<string[]>(
    []
  );
  const [syncCadence, setSyncCadence] = useState<
    'realtime' | 'hourly' | 'daily'
  >('realtime');
  const [largeTxThreshold, setLargeTxThreshold] = useState<number>(
    selectedCurrency === 'IDR' ? 1000000 : 150
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const toggleInstitution = (id: string) => {
    if (selectedInstitutions.includes(id)) {
      setSelectedInstitutions(
        selectedInstitutions.filter((item) => item !== id)
      );
    } else {
      setSelectedInstitutions([...selectedInstitutions, id]);
    }
  };

  const validateStep = (currentStep: number): boolean => {
    const errs: Record<string, string> = {};

    if (currentStep === 1) {
      if (!fullName.trim()) {
        errs.fullName = isID
          ? 'Nama lengkap wajib diisi'
          : 'Full name is required';
      }
      if (!email.trim() || !email.includes('@')) {
        errs.email = isID
          ? 'Email valid diperlukan untuk pembacaan struk'
          : 'Valid email is required for inbox parsing';
      }
      if (password && password.length < 6) {
        errs.password = isID
          ? 'Kata sandi minimal 6 karakter'
          : 'Password must be at least 6 characters';
      }
    } else if (currentStep === 2) {
      if (!companyName.trim() && entityType !== 'personal') {
        errs.companyName = isID
          ? 'Nama perusahaan/organisasi wajib diisi'
          : 'Organization/Company name is required';
      }
    } else if (currentStep === 3) {
      if (monthlyBudgetGoal <= 0) {
        errs.monthlyBudgetGoal = isID
          ? 'Tentukan target anggaran bulanan'
          : 'Please specify a monthly budget goal';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => (prev < 4 ? ((prev + 1) as any) : prev));
    }
  };

  const handleBack = () => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as any) : prev));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    const newProfile: UserProfile = {
      id: `usr_${Date.now()}`,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phoneNumber.trim(),
      entityType,
      companyName: companyName.trim(),
      jobTitle: jobTitle.trim(),
      defaultCurrency: selectedCurrency,
      defaultLanguage: selectedLanguage,
      monthlyBudgetGoal,
      selectedInstitutions,
      syncCadence,
      autoApprovalThreshold: 85,
      enableLargeTxAlerts: true,
      largeTxThreshold,
      enableWeeklyDigest: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAccountCreated(newProfile, selectedInstitutions, monthlyBudgetGoal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="glass-modal rounded-2xl max-w-2xl w-full p-5 sm:p-7 text-white shadow-[0_16px_48px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-150 relative overflow-hidden transition-colors">
        <div className="glass-content">
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-[#051C2C] dark:text-white tracking-tight font-editorial truncate">
                {isID ? 'Daftar Akun Baru' : 'Create Account'}
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400 truncate">
                {isID
                  ? 'Atur profil, akun bank & aturan pemindaian struk'
                  : 'Set up your profile, bank accounts & receipt parsing rules'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#051C2C] dark:hover:text-white hover:bg-[#F0F4F8] dark:hover:bg-[#163354] transition-colors cursor-pointer shrink-0 ml-3"
              title={isID ? 'Tutup' : 'Close'}
              aria-label={isID ? 'Tutup dialog' : 'Close dialog'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step Progression Indicator */}
          <div className="mb-6">
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <button
                type="button"
                onClick={() => step > 1 && setStep(1)}
                className={`pb-2 border-b-2 font-bold transition-colors text-left sm:text-center min-w-0 ${
                  step === 1
                    ? 'border-[#2251FF] text-[#2251FF] dark:text-[#38BDF8]'
                    : step > 1
                      ? 'border-emerald-600 dark:border-emerald-400 text-emerald-700 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-[#1E3A5F] text-slate-400 dark:text-slate-500'
                }`}
              >
                <span className="block text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
                  {isID ? 'Langkah 1' : 'Step 1'}
                </span>
                <span className="text-xs truncate block">
                  {isID ? '1. Identitas' : '1. Identity'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => step > 2 && setStep(2)}
                className={`pb-2 border-b-2 font-bold transition-colors text-left sm:text-center min-w-0 ${
                  step === 2
                    ? 'border-[#2251FF] text-[#2251FF] dark:text-[#38BDF8]'
                    : step > 2
                      ? 'border-emerald-600 dark:border-emerald-400 text-emerald-700 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-[#1E3A5F] text-slate-400 dark:text-slate-500'
                }`}
              >
                <span className="block text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
                  {isID ? 'Langkah 2' : 'Step 2'}
                </span>
                <span className="text-xs truncate block">
                  {isID ? '2. Entitas & Peran' : '2. Entity & Role'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => step > 3 && setStep(3)}
                className={`pb-2 border-b-2 font-bold transition-colors text-left sm:text-center min-w-0 ${
                  step === 3
                    ? 'border-[#2251FF] text-[#2251FF] dark:text-[#38BDF8]'
                    : step > 3
                      ? 'border-emerald-600 dark:border-emerald-400 text-emerald-700 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-[#1E3A5F] text-slate-400 dark:text-slate-500'
                }`}
              >
                <span className="block text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
                  {isID ? 'Langkah 3' : 'Step 3'}
                </span>
                <span className="text-xs truncate block">
                  {isID ? '3. Anggaran' : '3. Standards'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => step > 4 && setStep(4)}
                className={`pb-2 border-b-2 font-bold transition-colors text-left sm:text-center min-w-0 ${
                  step === 4
                    ? 'border-[#2251FF] text-[#2251FF] dark:text-[#38BDF8]'
                    : 'border-slate-200 dark:border-[#1E3A5F] text-slate-400 dark:text-slate-500'
                }`}
              >
                <span className="block text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
                  {isID ? 'Langkah 4' : 'Step 4'}
                </span>
                <span className="text-xs truncate block">
                  {isID ? '4. Bank & Dompet' : '4. Bank Feeds'}
                </span>
              </button>
            </div>
          </div>

          {/* Step Content */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* STEP 1: IDENTITY */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in-50 duration-150">
                <div className="p-3 bg-[#F8F9FA] dark:bg-[#081827] rounded-xl border border-[#E2E8F0] dark:border-[#1E3A5F] text-xs text-[#64748B] dark:text-slate-300 flex items-start space-x-2.5">
                  <Sparkles className="w-4 h-4 text-[#2251FF] dark:text-[#38BDF8] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    {isID
                      ? 'Profil Anda mengatur pencocokan kotak masuk otomatis, rute pemindaian struk, dan ringkasan keuangan harian.'
                      : 'Your profile details configure automated mailbox matching, receipt parser routing, and personalized daily briefings.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-[#051C2C] dark:text-slate-200 mb-1">
                      {isID ? 'Nama Lengkap' : 'Full Name'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={
                          isID ? 'cth. Budi Santoso' : 'e.g. Alex Johnson'
                        }
                        className="w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2251FF] bg-white dark:bg-[#081827] text-[#051C2C] dark:text-white font-medium"
                        required
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-[11px] text-rose-600 mt-1">
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#051C2C] dark:text-slate-200 mb-1">
                      {isID
                        ? 'Alamat Email Ingesti'
                        : 'Ingestion Email Address'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama@email.com"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2251FF] bg-white dark:bg-[#081827] text-[#051C2C] dark:text-white font-mono"
                        required
                      />
                    </div>
                    {errors.email && (
                      <p className="text-[11px] text-rose-600 mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#051C2C] dark:text-slate-200 mb-1">
                      {isID
                        ? 'Kata Sandi / PIN Keamanan'
                        : 'Security Passcode / Password'}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2251FF] bg-white dark:bg-[#081827] text-[#051C2C] dark:text-white"
                      />
                    </div>
                    <span className="text-[10px] text-[#64748B] dark:text-slate-400">
                      {isID
                        ? 'Untuk enkripsi buku kas & akses ekspor'
                        : 'For ledger encryption & export access'}
                    </span>
                    {errors.password && (
                      <p className="text-[11px] text-rose-600 mt-0.5">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#051C2C] dark:text-slate-200 mb-1">
                      {isID
                        ? 'No. Telepon / WhatsApp (Notifikasi)'
                        : 'Phone / WhatsApp (Alerts)'}
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+62 812-3456-7890"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2251FF] bg-white dark:bg-[#081827] text-[#051C2C] dark:text-white font-mono"
                      />
                    </div>
                    <span className="text-[10px] text-[#64748B] dark:text-slate-400">
                      {isID
                        ? 'Untuk notifikasi instan transaksi besar'
                        : 'For instantaneous high-value spend notices'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: ENTITY TYPE & ROLE */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in-50 duration-150">
                <div>
                  <label className="block text-xs font-bold text-[#051C2C] dark:text-slate-200 mb-2">
                    {isID
                      ? 'Cakupan Entitas Keuangan'
                      : 'Financial Entity Scope'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      {
                        id: 'corporate',
                        label: isID ? 'Eksekutif Korporat' : 'Corporate Exec',
                        desc: isID
                          ? 'Perusahaan & C-Suite'
                          : 'Enterprise & C-Suite',
                      },
                      {
                        id: 'business',
                        label: isID ? 'UKM / Bisnis' : 'SME / Startup',
                        desc: isID
                          ? 'Operasional Bisnis'
                          : 'Commercial Operations',
                      },
                      {
                        id: 'freelance',
                        label: isID ? 'Profesional' : 'Professional',
                        desc: isID
                          ? 'Konsultan / Agensi'
                          : 'Consultant / Agency',
                      },
                      {
                        id: 'personal',
                        label: isID ? 'Keuangan Pribadi' : 'Personal Wealth',
                        desc: isID
                          ? 'Keluarga & Pribadi'
                          : 'Family & Private Office',
                      },
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setEntityType(item.id as EntityType)}
                        className={`p-3 rounded-xl border text-left transition-colors cursor-pointer min-w-0 ${
                          entityType === item.id
                            ? 'border-[#2251FF] bg-[#F0F4F8] dark:bg-[#163354] ring-2 ring-[#2251FF]/20'
                            : 'border-[#E2E8F0] dark:border-[#1E3A5F] bg-white dark:bg-[#081827] hover:border-[#CBD5E1]'
                        }`}
                      >
                        <span className="font-bold text-xs text-[#051C2C] dark:text-white block truncate">
                          {item.label}
                        </span>
                        <span className="text-[10px] text-[#64748B] dark:text-slate-400 block mt-0.5 truncate">
                          {item.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-[#051C2C] dark:text-slate-200 mb-1">
                      {isID
                        ? 'Nama Perusahaan / Organisasi'
                        : 'Company / Organization Name'}
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder={
                          isID
                            ? 'cth. PT Maju Bersama'
                            : 'e.g. Enterprise Group, Tech Corp'
                        }
                        className="w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2251FF] bg-white dark:bg-[#081827] text-[#051C2C] dark:text-white"
                      />
                    </div>
                    {errors.companyName && (
                      <p className="text-[11px] text-rose-600 mt-1">
                        {errors.companyName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#051C2C] dark:text-slate-200 mb-1">
                      {isID ? 'Jabatan / Posisi' : 'Job Title / Role'}
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder={
                          isID
                            ? 'cth. Managing Director, CFO, Lead'
                            : 'e.g. Managing Director, CFO, Lead'
                        }
                        className="w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2251FF] bg-white dark:bg-[#081827] text-[#051C2C] dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: ACCOUNTING STANDARDS & BUDGETS */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in-50 duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Base Currency */}
                  <div>
                    <label className="block text-xs font-bold text-[#051C2C] dark:text-slate-200 mb-1">
                      {isID ? 'Mata Uang Utama' : 'Primary Base Currency'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Coins className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <select
                        value={selectedCurrency}
                        onChange={(e) => {
                          const newC = e.target.value as SupportedCurrency;
                          setSelectedCurrency(newC);
                          if (newC === 'IDR' && monthlyBudgetGoal < 100000) {
                            setMonthlyBudgetGoal(15000000);
                            setLargeTxThreshold(1000000);
                          } else if (
                            newC !== 'IDR' &&
                            monthlyBudgetGoal > 100000
                          ) {
                            setMonthlyBudgetGoal(3500);
                            setLargeTxThreshold(150);
                          }
                        }}
                        style={{
                          colorScheme: 'dark',
                          backgroundColor: '#071524',
                        }}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#38BDF8] bg-[#071524] text-white font-semibold cursor-pointer [&>option]:bg-[#071524] [&>option]:text-white"
                      >
                        {(Object.keys(CURRENCIES) as SupportedCurrency[]).map(
                          (code) => {
                            const c = CURRENCIES[code];
                            return (
                              <option
                                key={code}
                                value={code}
                                className="bg-[#071524] text-white"
                              >
                                {c.flag} {c.code} ({c.symbol}) - {c.name}
                              </option>
                            );
                          }
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Primary Language */}
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">
                      {isID
                        ? 'Bahasa Tampilan Standar'
                        : 'Display Language Standard'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <select
                        value={selectedLanguage}
                        onChange={(e) =>
                          setSelectedLanguage(e.target.value as LanguageCode)
                        }
                        style={{
                          colorScheme: 'dark',
                          backgroundColor: '#071524',
                        }}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#38BDF8] bg-[#071524] text-white font-semibold cursor-pointer [&>option]:bg-[#071524] [&>option]:text-white"
                      >
                        <option value="id" className="bg-[#071524] text-white">
                          🇮🇩 Bahasa Indonesia (ID)
                        </option>
                        <option value="en" className="bg-[#071524] text-white">
                          🇺🇸 English (US)
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Monthly Spending Target */}
                <div className="p-3.5 bg-[#F8F9FA] dark:bg-[#081827] rounded-xl border border-[#E2E8F0] dark:border-[#1E3A5F]">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#051C2C] dark:text-white flex items-center space-x-1.5">
                      <Target className="w-4 h-4 text-[#2251FF] dark:text-[#38BDF8]" />
                      <span>
                        {isID
                          ? 'Target Batas Pengeluaran Bulanan'
                          : 'Monthly Spending Target Benchmark'}
                      </span>
                    </label>
                    <span className="font-mono font-bold text-xs text-[#2251FF] dark:text-[#38BDF8]">
                      {formatCurrency(monthlyBudgetGoal, selectedCurrency)}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={monthlyBudgetGoal}
                    onChange={(e) =>
                      setMonthlyBudgetGoal(Number(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-lg bg-white dark:bg-[#0D2238] font-mono font-bold text-[#051C2C] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2251FF]"
                    min="0"
                    step="any"
                  />
                  <p className="text-[10px] text-[#64748B] dark:text-slate-400 mt-1">
                    {isID
                      ? 'Digunakan oleh AI untuk menghitung laju harian, batas pengeluaran aman, dan peringatan budget.'
                      : 'Used by Gemini AI to calculate daily burn rates, safety thresholds, and monthly budget pacing.'}
                  </p>
                  {errors.monthlyBudgetGoal && (
                    <p className="text-[11px] text-rose-600 mt-1">
                      {errors.monthlyBudgetGoal}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: BANK FEEDS & INGESTION SETTINGS */}
            {step === 4 && (
              <div className="space-y-4 animate-in fade-in-50 duration-150">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-[#051C2C] dark:text-slate-200">
                      {isID
                        ? 'Hubungkan Rekening Bank & Dompet Digital'
                        : 'Connect Primary Banking & Wallet Feeds'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-[#2251FF] dark:text-[#38BDF8] font-semibold">
                      {isID
                        ? `${selectedInstitutions.length} rekening dipilih`
                        : `${selectedInstitutions.length} feeds selected`}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                    {AVAILABLE_INSTITUTIONS.map((inst) => {
                      const isChecked = selectedInstitutions.includes(inst.id);
                      return (
                        <div
                          key={inst.id}
                          onClick={() => toggleInstitution(inst.id)}
                          className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                            isChecked
                              ? 'border-[#2251FF] bg-[#F0F4F8] dark:bg-[#163354]'
                              : 'border-[#E2E8F0] dark:border-[#1E3A5F] bg-white dark:bg-[#081827] hover:border-[#CBD5E1]'
                          }`}
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: inst.color }}
                            />
                            <span className="font-semibold text-[#051C2C] dark:text-white truncate">
                              {inst.name}
                            </span>
                          </div>
                          <CheckCircle2
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isChecked
                                ? 'text-[#2251FF] dark:text-[#38BDF8]'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {errors.selectedInstitutions && (
                    <p className="text-[11px] text-rose-600 mt-1">
                      {errors.selectedInstitutions}
                    </p>
                  )}
                </div>

                {/* Ingestion Cadence & Sensitivity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">
                      {isID
                        ? 'Frekuensi Pemindaian Email'
                        : 'Inbox Scan Cadence'}
                    </label>
                    <select
                      value={syncCadence}
                      onChange={(e) => setSyncCadence(e.target.value as any)}
                      style={{
                        colorScheme: 'dark',
                        backgroundColor: '#071524',
                      }}
                      className="w-full px-3 py-1.5 text-xs border border-white/20 rounded-lg bg-[#071524] text-white font-medium cursor-pointer [&>option]:bg-[#071524] [&>option]:text-white"
                    >
                      <option
                        value="realtime"
                        className="bg-[#071524] text-white"
                      >
                        {isID
                          ? 'Real-Time Berkelanjutan (45d)'
                          : 'Continuous Real-Time (45s)'}
                      </option>
                      <option
                        value="hourly"
                        className="bg-[#071524] text-white"
                      >
                        {isID
                          ? 'Pemindaian Berkala Per Jam'
                          : 'Hourly Batch Scan'}
                      </option>
                      <option value="daily" className="bg-[#071524] text-white">
                        {isID ? 'Rekap Harian' : 'Daily Summary'}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#051C2C] dark:text-slate-200 mb-1">
                      {isID
                        ? 'Batas Peringatan Transaksi Besar'
                        : 'Large Spend Alert Threshold'}
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={largeTxThreshold}
                        onChange={(e) =>
                          setLargeTxThreshold(Number(e.target.value) || 0)
                        }
                        className="w-full px-3 py-1.5 text-xs border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-lg bg-white dark:bg-[#081827] font-mono font-bold text-[#051C2C] dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Agreement Notice */}
                <div className="p-3 bg-[#F8F9FA] dark:bg-[#081827] rounded-xl border border-[#E2E8F0] dark:border-[#1E3A5F] text-[11px] text-[#64748B] dark:text-slate-300 flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <p>
                    {isID
                      ? 'Dengan mendaftar akun, data Anda disimpan dengan aman dan diproses langsung di sesi Anda, siap untuk sinkronisasi email real-time.'
                      : 'By creating an account, your data is securely stored and parsed locally in your session, ready for real-time inbox synchronization.'}
                  </p>
                </div>
              </div>
            )}

            {/* Navigation & Submission Controls */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-2">
              <div>
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-3.5 py-2 rounded-lg border border-[#CBD5E1] dark:border-[#1E3A5F] hover:bg-[#F8F9FA] dark:hover:bg-[#163354] text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center space-x-1 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{isID ? 'Kembali' : 'Back'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenLogin();
                    }}
                    className="text-xs text-[#2251FF] dark:text-[#38BDF8] hover:underline font-semibold cursor-pointer"
                  >
                    {isID
                      ? 'Sudah punya akun? Masuk'
                      : 'Already have an account? Sign In'}
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-[#112842] hover:bg-slate-200 dark:hover:bg-[#163354] text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
                >
                  {isID ? 'Batal' : 'Cancel'}
                </button>

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-4 py-2 rounded-lg bg-[#2251FF] hover:bg-[#1267D5] text-white font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
                  >
                    <span>{isID ? 'Lanjutkan' : 'Continue'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    id="submit-create-account-btn"
                    className="px-5 py-2 rounded-lg bg-[#2251FF] hover:bg-[#1267D5] text-white font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-md cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>{isID ? 'Daftar Akun' : 'Create Account'}</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
