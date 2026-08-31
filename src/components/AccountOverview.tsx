import React from 'react';
import { BankAccount } from '../types';
import {
  formatCurrency,
  convertCurrency,
  SupportedCurrency,
  DEFAULT_EXCHANGE_RATE_DB,
} from '../services/currency';
import { Translations } from '../services/translations';
import {
  CreditCard,
  Building2,
  Smartphone,
  Wallet,
  Plus,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { AnimatedGroup } from './motion/animated-group';

interface AccountOverviewProps {
  accounts: BankAccount[];
  selectedAccountId: string | null;
  onSelectAccount: (id: string | null) => void;
  onOpenAddAccount: () => void;
  isSyncing: boolean;
  currency: SupportedCurrency;
  ratesToIDR?: Record<SupportedCurrency, number>;
  t: Translations;
}

export const AccountOverview: React.FC<AccountOverviewProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccount,
  onOpenAddAccount,
  isSyncing,
  currency,
  ratesToIDR = DEFAULT_EXCHANGE_RATE_DB.ratesToIDR,
  t,
}) => {
  const getAccountIcon = (type: BankAccount['type']) => {
    switch (type) {
      case 'credit':
        return <CreditCard className="w-4 h-4" />;
      case 'checking':
      case 'savings':
        return <Building2 className="w-4 h-4" />;
      case 'digital_wallet':
        return <Wallet className="w-4 h-4" />;
      default:
        return <Smartphone className="w-4 h-4" />;
    }
  };

  return (
    <section id="bank-accounts-section" className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t.accounts.title} ({accounts.length})
          </h2>
          <Badge variant="secondary" className="gap-1.5 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            {t.accounts.activeSync}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          {selectedAccountId && (
            <Button
              variant="link"
              size="sm"
              id="clear-account-filter-btn"
              onClick={() => onSelectAccount(null)}
            >
              {t.accounts.allAccounts}
            </Button>
          )}
          <Button
            id="link-new-bank-btn"
            variant="outline"
            size="sm"
            onClick={onOpenAddAccount}
            leftIcon={
              <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            }
          >
            <span>{t.accounts.addAccount}</span>
          </Button>
        </div>
      </div>

      {/* Account Cards Grid or Empty State */}
      {accounts.length === 0 ? (
        <Card className="border-dashed p-6 sm:p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {t.accounts.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
            {t.accounts.subtitle}
          </p>
          <Button
            onClick={onOpenAddAccount}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            <span>{t.accounts.addAccount}</span>
          </Button>
        </Card>
      ) : (
        <AnimatedGroup
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
          preset="scale"
          staggerCap={8}
        >
          {accounts.map((account) => {
            const isSelected = selectedAccountId === account.id;
            const accountCurrency =
              (account.currency as SupportedCurrency) || 'IDR';
            const convertedBalance = convertCurrency(
              account.balance,
              accountCurrency,
              currency,
              ratesToIDR
            );
            const isDifferentCurrency = accountCurrency !== currency;

            return (
              <Card
                key={account.id}
                id={`account-card-${account.id}`}
                onClick={() => onSelectAccount(isSelected ? null : account.id)}
                className={`p-3.5 sm:p-4 cursor-pointer relative overflow-hidden transition-all ${
                  isSelected
                    ? 'border-[#2251FF] dark:border-[#2251FF] ring-2 ring-[#2251FF]/20 shadow-xs'
                    : 'hover:border-slate-300 dark:hover:border-[#1E3A5F]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white shadow-2xs shrink-0"
                      style={{ backgroundColor: account.color || '#051C2C' }}
                    >
                      {getAccountIcon(account.type)}
                    </div>
                    <div className="min-w-0">
                      <h3
                        className="text-xs font-bold text-white truncate"
                        title={account.name}
                      >
                        {account.name}
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-slate-300 font-semibold truncate">
                        {account.institution}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded font-mono bg-white/10 text-slate-200 border border-white/15 font-bold shrink-0">
                    {account.accountNumberMask}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-white/10 gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-300 block uppercase font-bold truncate">
                      {account.type === 'credit'
                        ? t.accounts.currentBalance
                        : t.accounts.currentBalance}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-white tracking-tight font-mono tabular-nums truncate block text-readability-shadow">
                      {formatCurrency(convertedBalance, currency)}
                    </span>
                    {isDifferentCurrency && (
                      <span className="text-[10px] text-slate-300 font-mono block tabular-nums">
                        Native:{' '}
                        {formatCurrency(account.balance, accountCurrency)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 text-xs text-[#60A5FA] font-semibold shrink-0">
                    {isSyncing ? (
                      <RefreshCw
                        className="w-3 h-3 animate-spin text-[#60A5FA]"
                        aria-hidden="true"
                      />
                    ) : (
                      <CheckCircle2
                        className="w-4 h-4 text-[#60A5FA]"
                        aria-hidden="true"
                      />
                    )}
                    <span className="text-[10px] sm:text-[11px] text-slate-300 font-semibold">
                      {isSelected ? t.accounts.filtered : t.metrics.active}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </AnimatedGroup>
      )}
    </section>
  );
};
