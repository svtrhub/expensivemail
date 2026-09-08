import React, { useState } from 'react';
import { BankAccount } from '../types';
import {
  formatCurrency,
  SupportedCurrency,
  CURRENCIES,
} from '../services/currency';
import { Translations } from '../services/translations';
import {
  INDONESIAN_MOBILE_BANKS,
  IndonesianMobileBankInfo,
} from '../services/indonesianBanks';
import {
  X,
  CreditCard,
  Building2,
  Plus,
  Trash2,
  Smartphone,
  Wallet,
  Sparkles,
  Check,
} from 'lucide-react';

interface BankModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: BankAccount[];
  onAddAccount: (account: Omit<BankAccount, 'id'>) => void;
  onDeleteAccount: (id: string) => void;
  currency: SupportedCurrency;
  t: Translations;
}

export const BankModal: React.FC<BankModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onAddAccount,
  onDeleteAccount,
  currency,
  t,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [accountNumberMask, setAccountNumberMask] = useState('');
  const [type, setType] = useState<BankAccount['type']>('checking');
  const [balance, setBalance] = useState('0');
  const [color, setColor] = useState('#0072CE');

  if (!isOpen) return null;

  const handleSelectPreset = (preset: IndonesianMobileBankInfo) => {
    setSelectedPresetId(preset.id);
    setName(preset.appName);
    setInstitution(preset.affiliatedBank);
    setColor(preset.brandColor);
    setType(preset.accountTypeDefault);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const numBalance = parseFloat(balance) || 0;

    onAddAccount({
      name: name.trim() || institution || 'Rekening Baru',
      institution: institution.trim() || 'Bank / E-Wallet',
      accountNumberMask: accountNumberMask.trim() || '•••• 0000',
      type,
      balance: numBalance,
      currency: currency,
      color,
      iconName:
        type === 'digital_wallet'
          ? 'Wallet'
          : type === 'credit'
            ? 'CreditCard'
            : 'Smartphone',
      active: true,
      lastSyncedAt: new Date().toISOString(),
    });

    setName('');
    setInstitution('');
    setAccountNumberMask('');
    setBalance('0');
    setIsAdding(false);
  };

  const currencyConfig = CURRENCIES[currency] || CURRENCIES.IDR;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="glass-modal rounded-2xl max-w-xl w-full p-6 text-white shadow-[0_16px_48px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-150 transition-colors">
        <div className="glass-content">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-[#F0F4F8] dark:bg-[#163354] text-[#2251FF] dark:text-[#38BDF8] shrink-0 shadow-2xs">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-[#051C2C] dark:text-white tracking-tight font-editorial truncate">
                  {t.accounts.title} & Mobile Apps
                </h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400 truncate">
                  Recognize Indonesian mobile banking apps (wondr, myBCA,
                  Livin', BRImo, BYOND, balé)
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

          {/* Existing Accounts List */}
          <div className="my-4 space-y-2.5 max-h-52 overflow-y-auto pr-1">
            {accounts.length === 0 ? (
              <div
                id="bank-modal-empty-accounts"
                className="p-4 text-center rounded-xl bg-[#F8F9FA] dark:bg-[#081827] border border-dashed border-[#CBD5E1] dark:border-[#1E3A5F]"
              >
                <Building2 className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-[#051C2C] dark:text-white">
                  Belum ada rekening atau kartu terhubung
                </p>
                <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">
                  Tambahkan rekening mobile banking atau dompet digital Anda di
                  bawah.
                </p>
              </div>
            ) : (
              accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3 rounded-xl bg-[#F8F9FA] dark:bg-[#081827] border border-[#E2E8F0] dark:border-[#1E3A5F] flex items-center justify-between hover:border-[#2251FF]/40 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0"
                      style={{ backgroundColor: acc.color }}
                    >
                      {acc.name.includes('wondr') ? (
                        <Smartphone className="w-4 h-4" />
                      ) : acc.name.includes('GoPay') ||
                        acc.name.includes('OVO') ||
                        acc.name.includes('DANA') ? (
                        <Wallet className="w-4 h-4" />
                      ) : (
                        <Building2 className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h4 className="text-xs font-bold text-[#051C2C] dark:text-white">
                          {acc.name}
                        </h4>
                      </div>
                      <p className="text-[11px] text-[#64748B] dark:text-slate-400 font-mono">
                        {acc.institution} • {acc.accountNumberMask}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-[#051C2C] dark:text-white">
                        {formatCurrency(acc.balance, currency)}
                      </span>
                      <span className="block text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                        Live Sync
                      </span>
                    </div>

                    <button
                      onClick={() => onDeleteAccount(acc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                      title="Remove Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Account Form or Toggle Button */}
          {isAdding ? (
            <form
              onSubmit={handleCreate}
              className="p-4 bg-[#F8F9FA] dark:bg-[#081827] rounded-xl border border-[#CBD5E1] dark:border-[#1E3A5F] space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#2251FF] dark:text-[#38BDF8] flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pilih Aplikasi Mobile Banking Indonesia:</span>
                </h4>
              </div>

              {/* Quick Preset Selector */}
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-white dark:bg-[#0D2238] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-lg">
                {INDONESIAN_MOBILE_BANKS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors flex items-center space-x-1 cursor-pointer ${
                        isSelected
                          ? 'bg-[#2251FF] text-white shadow-xs'
                          : 'bg-slate-50 dark:bg-[#163354] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E4373] border border-slate-200 dark:border-[#1E3A5F]'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: preset.brandColor }}
                      />
                      <span>{preset.appName}</span>
                      {isSelected && (
                        <Check className="w-3 h-3 text-white ml-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#051C2C] dark:text-slate-200 block mb-1">
                    Nama Akun / Kartu:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. wondr by BNI Taplus"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#0D2238] border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-lg text-xs text-[#051C2C] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2251FF]"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#051C2C] dark:text-slate-200 block mb-1">
                    Bank / Lembaga Terafiliasi:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bank Negara Indonesia (BNI)"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#0D2238] border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-lg text-xs text-[#051C2C] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2251FF]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#051C2C] dark:text-slate-200 block mb-1">
                    Masking No. Rekening:
                  </label>
                  <input
                    type="text"
                    placeholder="•••• 7812"
                    value={accountNumberMask}
                    onChange={(e) => setAccountNumberMask(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#0D2238] border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-lg text-xs text-[#051C2C] dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#2251FF]"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-200 block mb-1">
                    Tipe Rekening:
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    style={{ colorScheme: 'dark', backgroundColor: '#071524' }}
                    className="w-full px-2.5 py-1.5 bg-[#071524] border border-white/20 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#38BDF8] [&>option]:bg-[#071524] [&>option]:text-white"
                  >
                    <option
                      value="checking"
                      className="bg-[#071524] text-white"
                    >
                      Tabungan / Mobile App
                    </option>
                    <option value="credit" className="bg-[#071524] text-white">
                      Kartu Kredit
                    </option>
                    <option value="savings" className="bg-[#071524] text-white">
                      Deposito / Savings
                    </option>
                    <option
                      value="digital_wallet"
                      className="bg-[#071524] text-white"
                    >
                      E-Wallet (GoPay/OVO/DANA)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#051C2C] dark:text-slate-200 block mb-1">
                    Saldo ({currencyConfig.symbol}):
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#0D2238] border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-lg text-xs text-[#051C2C] dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#2251FF]"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-[#112842] hover:bg-slate-200 dark:hover:bg-[#163354] text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-[#2251FF] hover:bg-[#1267D5] text-white rounded-lg text-xs font-bold cursor-pointer shadow-2xs"
                >
                  Save Account
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-[#CBD5E1] dark:border-[#1E3A5F] hover:border-[#2251FF] bg-[#F8F9FA] dark:bg-[#081827] hover:bg-[#F0F4F8] dark:hover:bg-[#112842] text-xs font-bold text-[#051C2C] dark:text-white flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4 text-[#2251FF] dark:text-[#38BDF8]" />
              <span>Link Akun Mobile Banking / E-Wallet Baru</span>
            </button>
          )}

          {/* Footer */}
          <div className="mt-5 pt-3 border-t border-white/10 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#2251FF] hover:bg-[#1267D5] text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
