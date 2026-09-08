import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { BankAccount, UserProfile } from '../types';
import { formatCurrency, SupportedCurrency } from '../services/currency';
import { Translations } from '../services/translations';
import {
  X,
  User as UserIcon,
  Building2,
  LogOut,
  Edit2,
  Check,
  UserPlus,
} from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  userProfile?: UserProfile | null;
  accounts: BankAccount[];
  currency: SupportedCurrency;
  t: Translations;
  onLogin: () => void;
  onLogout: () => void;
  onOpenCreateAccount: () => void;
  onUpdateProfile?: (updatedProfile: UserProfile) => void;
  hasGmailAccess: boolean;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  user,
  userProfile,
  accounts,
  currency,
  t,
  onLogout,
  onOpenCreateAccount,
  onUpdateProfile,
  hasGmailAccess,
}) => {
  const [customName, setCustomName] = useState<string>(() => {
    try {
      return (
        userProfile?.fullName ||
        localStorage.getItem('app_user_profile_name') ||
        user?.displayName ||
        ''
      );
    } catch {
      return userProfile?.fullName || user?.displayName || '';
    }
  });

  const [companyName, setCompanyName] = useState<string>(
    userProfile?.companyName || ''
  );
  const [jobTitle, setJobTitle] = useState<string>(userProfile?.jobTitle || '');
  const [phoneNumber, setPhoneNumber] = useState<string>(
    userProfile?.phoneNumber || ''
  );
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setCustomName(userProfile.fullName);
      setCompanyName(userProfile.companyName || '');
      setJobTitle(userProfile.jobTitle || '');
      setPhoneNumber(userProfile.phoneNumber || '');
    } else if (user?.displayName) {
      setCustomName(user.displayName);
    }
  }, [userProfile, user]);

  if (!isOpen) return null;

  const handleSaveProfile = () => {
    if (customName.trim()) {
      try {
        localStorage.setItem('app_user_profile_name', customName.trim());
      } catch (e) {
        console.warn('Failed to save user name to localStorage:', e);
      }

      if (userProfile && onUpdateProfile) {
        const updated: UserProfile = {
          ...userProfile,
          fullName: customName.trim(),
          companyName: companyName.trim(),
          jobTitle: jobTitle.trim(),
          phoneNumber: phoneNumber.trim(),
          updatedAt: new Date().toISOString(),
        };
        onUpdateProfile(updated);
      }
    }
    setIsEditing(false);
  };

  const totalAssets = accounts
    .filter((a) => a.type !== 'credit')
    .reduce((sum, a) => sum + a.balance, 0);

  const totalCreditOwed = accounts
    .filter((a) => a.type === 'credit')
    .reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="glass-modal rounded-2xl max-w-lg w-full p-5 sm:p-6 text-white shadow-[0_16px_48px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-150 relative overflow-hidden transition-colors">
        <div className="glass-content">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-[#F0F4F8] dark:bg-[#163354] text-[#2251FF] dark:text-[#38BDF8] shadow-2xs shrink-0">
                <UserIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-[#051C2C] dark:text-white tracking-tight font-editorial truncate">
                  Account Profile & Settings
                </h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400 truncate">
                  Account profile, authorization & preferences
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

          {/* User Card */}
          <div className="mb-4 p-4 rounded-xl bg-[#F8F9FA] dark:bg-[#081827] border border-[#E2E8F0] dark:border-[#1E3A5F]">
            <div className="flex items-start space-x-3.5">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full border-2 border-[#2251FF]"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#F0F4F8] dark:bg-[#163354] border border-[#CBD5E1] dark:border-[#1E3A5F] text-[#051C2C] dark:text-white font-bold flex items-center justify-center text-lg font-editorial shrink-0">
                  {(customName?.trim() || 'U').charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#64748B] dark:text-slate-400 block mb-0.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="e.g. Nama Pengguna"
                        className="px-2 py-1 text-xs border border-[#2251FF] rounded bg-white dark:bg-[#0D2238] font-bold text-[#051C2C] dark:text-white w-full focus:outline-none ring-1 ring-[#2251FF]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-[#64748B] dark:text-slate-400 block mb-0.5">
                          Job Title
                        </label>
                        <input
                          type="text"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          placeholder="e.g. Operations Manager"
                          className="px-2 py-1 text-xs border border-[#CBD5E1] dark:border-[#1E3A5F] rounded bg-white dark:bg-[#0D2238] text-slate-700 dark:text-slate-200 w-full"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-[#64748B] dark:text-slate-400 block mb-0.5">
                          Company
                        </label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g. Perusahaan"
                          className="px-2 py-1 text-xs border border-[#CBD5E1] dark:border-[#1E3A5F] rounded bg-white dark:bg-[#0D2238] text-slate-700 dark:text-slate-200 w-full"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={handleSaveProfile}
                        className="px-3 py-1 bg-[#2251FF] text-white rounded text-xs font-bold hover:bg-[#1267D5] flex items-center space-x-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-[#051C2C] dark:text-white truncate">
                        {customName || user?.displayName || 'Personal Account'}
                      </h4>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-1 text-slate-400 hover:text-[#2251FF] dark:hover:text-white transition-colors cursor-pointer"
                        title="Edit Profile"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                    {(jobTitle || companyName) && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {jobTitle} {jobTitle && companyName ? '•' : ''}{' '}
                        <span className="text-[#051C2C] dark:text-white font-semibold">
                          {companyName}
                        </span>
                      </p>
                    )}
                    <p className="text-[11px] text-[#64748B] dark:text-slate-400 font-mono mt-0.5">
                      {user?.email || userProfile?.email || 'No email attached'}
                    </p>
                  </div>
                )}

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>
                      {hasGmailAccess
                        ? 'Gmail Read-Only Active'
                        : 'Demo Mode Active'}
                    </span>
                  </span>
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F0F4F8] dark:bg-[#163354] text-[#051C2C] dark:text-white border border-[#CBD5E1] dark:border-[#1E3A5F]">
                    <Building2 className="w-3 h-3 text-[#2251FF] dark:text-[#38BDF8]" />
                    <span>
                      {userProfile?.entityType
                        ? userProfile.entityType.toUpperCase()
                        : 'CORPORATE'}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Assets Summary */}
          <div className="space-y-2 mb-4">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
              Connected Liquidity Overview
            </h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-[#F8F9FA] dark:bg-[#081827] rounded-xl border border-[#E2E8F0] dark:border-[#1E3A5F]">
                <span className="text-[#64748B] dark:text-slate-400 block text-[11px] font-medium">
                  Total Bank & Wallet:
                </span>
                <span className="text-sm font-bold font-mono text-[#051C2C] dark:text-white">
                  {formatCurrency(totalAssets, currency)}
                </span>
              </div>
              <div className="p-3 bg-[#F8F9FA] dark:bg-[#081827] rounded-xl border border-[#E2E8F0] dark:border-[#1E3A5F]">
                <span className="text-[#64748B] dark:text-slate-400 block text-[11px] font-medium">
                  Credit Balances:
                </span>
                <span className="text-sm font-bold font-mono text-amber-700 dark:text-amber-400">
                  {formatCurrency(totalCreditOwed, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Linked Institutions */}
          <div className="space-y-1.5 mb-4 max-h-36 overflow-y-auto pr-1">
            {accounts.length === 0 ? (
              <div className="px-3 py-3 bg-[#F8F9FA] dark:bg-[#081827] rounded-lg border border-dashed border-[#E2E8F0] dark:border-[#1E3A5F] text-center text-xs text-[#64748B] dark:text-slate-400">
                No bank accounts or digital wallets linked yet.
              </div>
            ) : (
              accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="px-3 py-2 bg-[#F8F9FA] dark:bg-[#081827] rounded-lg border border-[#E2E8F0] dark:border-[#1E3A5F] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: acc.color }}
                    />
                    <span className="text-[#051C2C] dark:text-white font-semibold">
                      {acc.name}
                    </span>
                  </div>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                    {formatCurrency(acc.balance, currency)}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Action Controls */}
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenCreateAccount();
                }}
                className="px-3 py-1.5 bg-[#2251FF] hover:bg-[#1267D5] text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <UserPlus className="w-3.5 h-3.5 text-white" />
                <span>Create / Switch Account</span>
              </button>

              {user && (
                <button
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.menu.logout}</span>
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-100 dark:bg-[#112842] hover:bg-slate-200 dark:hover:bg-[#163354] text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
