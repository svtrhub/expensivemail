import React from 'react';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';
import { Translations, LanguageCode } from '../services/translations';
import { SupportedCurrency } from '../services/currency';
import { Sparkles, Calendar } from 'lucide-react';
import { TextEffect } from './motion/text-effect';

interface DashboardGreetingProps {
  user: User | null;
  userProfile?: UserProfile | null;
  language: LanguageCode;
  currency: SupportedCurrency;
  t: Translations;
  totalExpensesCount: number;
  activeAccountsCount: number;
}

export const DashboardGreeting: React.FC<DashboardGreetingProps> = ({
  user,
  userProfile,
  language,
  currency,
  t,
  totalExpensesCount,
  activeAccountsCount,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (language === 'id') {
      if (hour < 11) return 'Selamat Pagi';
      if (hour < 15) return 'Selamat Siang';
      if (hour < 18) return 'Selamat Sore';
      return 'Selamat Malam';
    } else {
      if (hour < 12) return 'Good Morning';
      if (hour < 18) return 'Good Afternoon';
      return 'Good Evening';
    }
  };

  const displayName =
    userProfile?.fullName ||
    user?.displayName?.split(' ')[0] ||
    (language === 'id' ? 'Pengguna' : 'User');

  const greeting = getGreeting();

  const formattedDate = new Intl.DateTimeFormat(
    language === 'id' ? 'id-ID' : 'en-US',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  ).format(new Date());

  return (
    <div className="glass-panel mb-6 rounded-2xl p-4 sm:p-5 transition-colors">
      <div className="glass-content flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold font-editorial text-[#051C2C] dark:text-[#F8FAFC] tracking-tight">
              <TextEffect preset="fade-in-blur" per="word">
                {`${greeting}, ${displayName}`}
              </TextEffect>
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#2251FF]/20 text-[#60A5FA] border border-[#2251FF]/40">
              <Sparkles
                className="w-3 h-3 mr-1 text-[#60A5FA]"
                aria-hidden="true"
              />
              Live
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 dark:text-slate-200">
            {language === 'id' ? (
              <>
                Ada{' '}
                <strong className="font-bold text-white tabular-nums font-mono">
                  {totalExpensesCount}
                </strong>{' '}
                transaksi tercatat dari{' '}
                <strong className="font-bold text-white tabular-nums font-mono">
                  {activeAccountsCount}
                </strong>{' '}
                akun terhubung.
              </>
            ) : (
              <>
                Tracking{' '}
                <strong className="font-bold text-white tabular-nums font-mono">
                  {totalExpensesCount}
                </strong>{' '}
                transactions across{' '}
                <strong className="font-bold text-white tabular-nums font-mono">
                  {activeAccountsCount}
                </strong>{' '}
                linked accounts.
              </>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-slate-200 font-semibold text-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-300" aria-hidden="true" />
          <span className="capitalize">{formattedDate}</span>
        </div>
      </div>
    </div>
  );
};
