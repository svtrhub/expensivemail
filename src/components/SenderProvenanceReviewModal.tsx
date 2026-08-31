import React, { useState, useMemo } from 'react';
import {
  PendingReviewEmail,
  UserTrustedDomainRule,
  Expense,
  SupportedCurrency,
} from '../types';
import { formatCurrency } from '../services/currency';
import { Translations } from '../services/translations';
import {
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  CheckCircle2,
  X,
  Check,
  Trash2,
  ExternalLink,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
  Lock,
  Sparkles,
} from 'lucide-react';

interface SenderProvenanceReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingEmails: PendingReviewEmail[];
  onApproveProgrammaticSender: (
    item: PendingReviewEmail,
    trustedRule: UserTrustedDomainRule
  ) => void;
  onBatchApproveSenders: (
    items: PendingReviewEmail[],
    trustedRules: UserTrustedDomainRule[]
  ) => void;
  onDismissItem: (id: string) => void;
  onBatchDismissItems: (ids: string[]) => void;
  onClearAllPending: () => void;
  userTrustedRules: UserTrustedDomainRule[];
  onRemoveTrustedRule: (domain: string) => void;
  currency: SupportedCurrency;
  language?: 'en' | 'id';
  t: Translations;
}

export const SenderProvenanceReviewModal: React.FC<
  SenderProvenanceReviewModalProps
> = ({
  isOpen,
  onClose,
  pendingEmails,
  onApproveProgrammaticSender,
  onBatchApproveSenders,
  onDismissItem,
  onBatchDismissItems,
  onClearAllPending,
  userTrustedRules,
  onRemoveTrustedRule,
  currency,
  language = 'id',
  t,
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'trusted_rules'>(
    'queue'
  );
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter pending items
  const activePendingItems = useMemo(() => {
    return pendingEmails.filter((item) => item.status === 'pending');
  }, [pendingEmails]);

  const filteredItems = useMemo(() => {
    if (selectedCategoryFilter === 'all') return activePendingItems;
    return activePendingItems.filter(
      (item) => item.reason === selectedCategoryFilter
    );
  }, [activePendingItems, selectedCategoryFilter]);

  // Group items by category to mitigate review-queue fatigue
  const countsByReason = useMemo(() => {
    const counts: Record<string, number> = {
      unverified_domain: 0,
      merchant_domain_mismatch: 0,
      cryptographic_auth_failed: 0,
      homograph_attack: 0,
      low_confidence_notification: 0,
      amount_anomaly: 0,
    };
    activePendingItems.forEach((item) => {
      if (counts[item.reason] !== undefined) {
        counts[item.reason]++;
      } else {
        counts.unverified_domain++;
      }
    });
    return counts;
  }, [activePendingItems]);

  if (!isOpen) return null;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)));
    }
  };

  const handleBatchDismissSelected = () => {
    if (selectedIds.size === 0) return;
    onBatchDismissItems(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleBatchApproveSelected = () => {
    const itemsToApprove = activePendingItems.filter((item) =>
      selectedIds.has(item.id)
    );
    if (itemsToApprove.length === 0) return;

    const rules: UserTrustedDomainRule[] = itemsToApprove.map((item) => {
      // Guard: strictly extract programmatic domain from email authenticated header, NEVER free-text
      const safeDomain =
        item.authDetails?.authenticatedDomain || item.senderDomain;
      return {
        domain: safeDomain,
        displayName: item.claimedMerchant || item.senderDomain,
        category: 'Shopping & Retail',
        trustedAt: new Date().toISOString(),
        sourceEmailId: item.emailId,
        extractedFromHeader: item.sender,
        isCryptographicallyVerified:
          item.authDetails?.spf === 'pass' || item.authDetails?.dkim === 'pass',
      };
    });

    onBatchApproveSenders(itemsToApprove, rules);
    setSelectedIds(new Set());
  };

  const handleApproveSingle = (item: PendingReviewEmail) => {
    // Guard: strictly extract programmatic domain
    const safeDomain =
      item.authDetails?.authenticatedDomain || item.senderDomain;
    const rule: UserTrustedDomainRule = {
      domain: safeDomain,
      displayName: item.claimedMerchant || item.senderDomain,
      category: 'Shopping & Retail',
      trustedAt: new Date().toISOString(),
      sourceEmailId: item.emailId,
      extractedFromHeader: item.sender,
      isCryptographicallyVerified:
        item.authDetails?.spf === 'pass' || item.authDetails?.dkim === 'pass',
    };
    onApproveProgrammaticSender(item, rule);
  };

  const getReasonBadge = (reason: PendingReviewEmail['reason']) => {
    switch (reason) {
      case 'homograph_attack':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <ShieldX className="w-3 h-3 mr-1 text-rose-600 dark:text-rose-400" />
            {language === 'id' ? 'Serangan Homograf' : 'Homograph Phishing'}
          </span>
        );
      case 'cryptographic_auth_failed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
            <ShieldAlert className="w-3 h-3 mr-1 text-red-600 dark:text-red-400" />
            {language === 'id' ? 'Gagal DKIM/SPF' : 'Cryptographic Auth Failed'}
          </span>
        );
      case 'merchant_domain_mismatch':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-3 h-3 mr-1 text-amber-600 dark:text-amber-400" />
            {language === 'id'
              ? 'Domain Tidak Cocok'
              : 'Merchant Domain Mismatch'}
          </span>
        );
      case 'amount_anomaly':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Sparkles className="w-3 h-3 mr-1 text-purple-600 dark:text-purple-400" />
            {language === 'id' ? 'Lonjakan Tagihan 10x' : 'Amount Surge 10x'}
          </span>
        );
      case 'low_confidence_notification':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Info className="w-3 h-3 mr-1 text-slate-500" />
            {language === 'id'
              ? 'Peringatan Promo/Newsletter'
              : 'Promo / Low Confidence'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <ShieldAlert className="w-3 h-3 mr-1 text-blue-600 dark:text-blue-400" />
            {language === 'id' ? 'Domain Belum Terdaftar' : 'Unverified Domain'}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="glass-modal rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col text-white shadow-[0_16px_48px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-150 transition-colors">
        <div className="glass-content flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Modal Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-[#163354] text-[#2251FF] dark:text-[#38BDF8] shrink-0 shadow-2xs">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold tracking-tight font-editorial">
                    {language === 'id'
                      ? 'Antrean Verifikasi Provenans Pengirim'
                      : 'Sender Provenance & Review Queue'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#2251FF] text-white">
                    {activePendingItems.length}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                  {language === 'id'
                    ? 'Audit kriptografis (DKIM/SPF), perlindungan homograf IDN, dan gerbang anti-spoofing sebelum masuk buku kas'
                    : 'Cryptographic DKIM/SPF audit, IDN homograph defense, and anti-spoofing hard gate before ledger insertion'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#051C2C] dark:hover:text-white hover:bg-[#F0F4F8] dark:hover:bg-[#163354] transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-[#E2E8F0] dark:border-[#1E3A5F] px-5 bg-[#F8F9FA] dark:bg-[#081827]">
            <button
              onClick={() => setActiveTab('queue')}
              className={`py-3 text-xs font-bold border-b-2 mr-6 transition-colors cursor-pointer flex items-center space-x-2 ${
                activeTab === 'queue'
                  ? 'border-[#2251FF] dark:border-[#38BDF8] text-[#2251FF] dark:text-[#38BDF8]'
                  : 'border-transparent text-[#64748B] dark:text-slate-400 hover:text-[#051C2C] dark:hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>
                {language === 'id' ? 'Antrean Email Tertahan' : 'Flagged Queue'}{' '}
                ({activePendingItems.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('trusted_rules')}
              className={`py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center space-x-2 ${
                activeTab === 'trusted_rules'
                  ? 'border-[#2251FF] dark:border-[#38BDF8] text-[#2251FF] dark:text-[#38BDF8]'
                  : 'border-transparent text-[#64748B] dark:text-slate-400 hover:text-[#051C2C] dark:hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>
                {language === 'id'
                  ? 'Domain Tepercaya Terprogram'
                  : 'Programmatic Trusted Domains'}{' '}
                ({userTrustedRules.length})
              </span>
            </button>
          </div>

          {activeTab === 'queue' ? (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Category Filter Pills (Mitigate Review-Queue Fatigue) */}
              <div className="flex flex-wrap items-center gap-1.5 pb-1">
                <button
                  onClick={() => setSelectedCategoryFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    selectedCategoryFilter === 'all'
                      ? 'bg-[#2251FF] text-white'
                      : 'bg-white dark:bg-[#112842] text-[#64748B] dark:text-slate-300 border border-[#CBD5E1] dark:border-[#1E3A5F]'
                  }`}
                >
                  {language === 'id' ? 'Semua' : 'All'} (
                  {activePendingItems.length})
                </button>
                {countsByReason.cryptographic_auth_failed > 0 && (
                  <button
                    onClick={() =>
                      setSelectedCategoryFilter('cryptographic_auth_failed')
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1 ${
                      selectedCategoryFilter === 'cryptographic_auth_failed'
                        ? 'bg-red-600 text-white'
                        : 'bg-white dark:bg-[#112842] text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50'
                    }`}
                  >
                    <ShieldAlert className="w-3 h-3" />
                    <span>
                      {language === 'id' ? 'Gagal DKIM/SPF' : 'Auth Failed'} (
                      {countsByReason.cryptographic_auth_failed})
                    </span>
                  </button>
                )}
                {countsByReason.homograph_attack > 0 && (
                  <button
                    onClick={() =>
                      setSelectedCategoryFilter('homograph_attack')
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1 ${
                      selectedCategoryFilter === 'homograph_attack'
                        ? 'bg-rose-600 text-white'
                        : 'bg-white dark:bg-[#112842] text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                    }`}
                  >
                    <ShieldX className="w-3 h-3" />
                    <span>
                      {language === 'id' ? 'Homograf Phishing' : 'Homograph'} (
                      {countsByReason.homograph_attack})
                    </span>
                  </button>
                )}
                {countsByReason.merchant_domain_mismatch > 0 && (
                  <button
                    onClick={() =>
                      setSelectedCategoryFilter('merchant_domain_mismatch')
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1 ${
                      selectedCategoryFilter === 'merchant_domain_mismatch'
                        ? 'bg-amber-600 text-white'
                        : 'bg-white dark:bg-[#112842] text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>
                      {language === 'id'
                        ? 'Ketidakcocokan Merchant'
                        : 'Mismatch'}{' '}
                      ({countsByReason.merchant_domain_mismatch})
                    </span>
                  </button>
                )}
                {countsByReason.unverified_domain > 0 && (
                  <button
                    onClick={() =>
                      setSelectedCategoryFilter('unverified_domain')
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      selectedCategoryFilter === 'unverified_domain'
                        ? 'bg-[#2251FF] text-white'
                        : 'bg-white dark:bg-[#112842] text-[#64748B] dark:text-slate-300 border border-[#CBD5E1] dark:border-[#1E3A5F]'
                    }`}
                  >
                    {language === 'id' ? 'Domain Baru' : 'New Domain'} (
                    {countsByReason.unverified_domain})
                  </button>
                )}
              </div>

              {/* Batch Action Toolbar */}
              {filteredItems.length > 0 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F0F4F8] dark:bg-[#081827] border border-[#CBD5E1] dark:border-[#1E3A5F] text-xs">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.size === filteredItems.length &&
                        filteredItems.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded text-[#2251FF] focus:ring-[#2251FF] cursor-pointer"
                    />
                    <span className="text-[#64748B] dark:text-slate-400 font-medium">
                      {selectedIds.size > 0
                        ? `${selectedIds.size} ${language === 'id' ? 'dipilih' : 'selected'}`
                        : language === 'id'
                          ? 'Pilih Semua'
                          : 'Select All'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {selectedIds.size > 0 && (
                      <>
                        <button
                          onClick={handleBatchDismissSelected}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 font-semibold transition-colors cursor-pointer"
                        >
                          {language === 'id'
                            ? 'Abaikan Terpilih'
                            : 'Dismiss Selected'}
                        </button>
                        <button
                          onClick={handleBatchApproveSelected}
                          className="px-2.5 py-1 rounded-lg bg-[#2251FF] text-white hover:bg-[#1267D5] font-semibold transition-colors cursor-pointer shadow-2xs"
                        >
                          {language === 'id'
                            ? 'Setujui & Percayai Domain Terprogram'
                            : 'Approve & Trust Programmatic Domain'}
                        </button>
                      </>
                    )}
                    {activePendingItems.length > 0 &&
                      selectedIds.size === 0 && (
                        <button
                          onClick={onClearAllPending}
                          className="text-[#64748B] dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors font-medium cursor-pointer"
                        >
                          {language === 'id'
                            ? 'Bersihkan Antrean'
                            : 'Clear All'}
                        </button>
                      )}
                  </div>
                </div>
              )}

              {/* List of Flagged Emails */}
              {filteredItems.length === 0 ? (
                <div className="text-center py-12 space-y-3 bg-[#F8F9FA] dark:bg-[#081827] rounded-2xl border border-dashed border-[#CBD5E1] dark:border-[#1E3A5F]">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-[#051C2C] dark:text-white">
                    {language === 'id'
                      ? 'Antrean Verifikasi Bersih!'
                      : 'Review Queue Clear!'}
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 max-w-sm mx-auto">
                    {language === 'id'
                      ? 'Semua email telah diverifikasi melalui tanda tangan DKIM/SPF atau domain merchant tepercaya.'
                      : 'All scanned emails pass strict cryptographic sender validation and merchant domain allowlists.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredItems.map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    const isExpanded = expandedId === item.id;
                    const isAuthPassed =
                      item.authDetails?.spf === 'pass' ||
                      item.authDetails?.dkim === 'pass';

                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border transition-colors ${
                          item.reason === 'homograph_attack' ||
                          item.reason === 'cryptographic_auth_failed'
                            ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/40'
                            : 'bg-white dark:bg-[#0D2238] border-[#CBD5E1] dark:border-[#1E3A5F]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start space-x-3 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(item.id)}
                              className="mt-1 rounded text-[#2251FF] focus:ring-[#2251FF] cursor-pointer"
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                {getReasonBadge(item.reason)}
                                <span className="text-xs font-bold text-[#051C2C] dark:text-white truncate">
                                  {item.subject}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#64748B] dark:text-slate-400">
                                <div>
                                  <span className="font-medium">
                                    {language === 'id' ? 'Pengirim:' : 'From:'}
                                  </span>{' '}
                                  <span className="font-mono text-[#051C2C] dark:text-slate-300 font-semibold">
                                    {item.sender}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium">
                                    {language === 'id' ? 'Domain:' : 'Domain:'}
                                  </span>{' '}
                                  <span className="font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#163354] text-[#051C2C] dark:text-white font-bold">
                                    {item.senderDomain}
                                  </span>
                                </div>
                                {item.amount && (
                                  <div>
                                    <span className="font-medium">
                                      {language === 'id'
                                        ? 'Klaim Nominal:'
                                        : 'Claimed:'}
                                    </span>{' '}
                                    <span className="font-mono text-[#2251FF] dark:text-[#38BDF8] font-bold">
                                      {formatCurrency(
                                        item.amount,
                                        (item.currency as SupportedCurrency) ||
                                          currency
                                      )}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Failure Details explanation */}
                              <div className="mt-2 p-2.5 rounded-lg bg-[#F8F9FA] dark:bg-[#081827] border border-[#E2E8F0] dark:border-[#1E3A5F] text-xs text-slate-700 dark:text-slate-300">
                                <p className="font-semibold text-rose-700 dark:text-rose-400">
                                  {item.failureDetails}
                                </p>
                                {item.homographDetails && (
                                  <div className="mt-1 text-[11px] font-mono bg-rose-100/70 dark:bg-rose-950/60 p-2 rounded text-rose-900 dark:text-rose-200">
                                    <span>
                                      {language === 'id'
                                        ? 'Karakter Mencurigakan / Homoglyph:'
                                        : 'Homoglyph Spoof:'}{' '}
                                    </span>
                                    <span className="font-bold">
                                      {item.homographDetails.originalDomain}
                                    </span>
                                    <span>
                                      {' '}
                                      →{' '}
                                      {language === 'id'
                                        ? 'Dinormalisasi:'
                                        : 'Normalized:'}{' '}
                                    </span>
                                    <span className="font-bold underline">
                                      {item.homographDetails.normalizedDomain}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center space-x-1.5 shrink-0">
                            <button
                              onClick={() =>
                                setExpandedId(isExpanded ? null : item.id)
                              }
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#051C2C] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#163354] transition-colors cursor-pointer"
                              title={
                                isExpanded ? 'Collapse' : 'Inspect Details'
                              }
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => onDismissItem(item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title={
                                language === 'id'
                                  ? 'Abaikan email ini'
                                  : 'Dismiss email'
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            {item.reason !== 'homograph_attack' &&
                              item.reason !== 'cryptographic_auth_failed' && (
                                <button
                                  onClick={() => handleApproveSingle(item)}
                                  className="px-3 py-1.5 rounded-lg bg-[#2251FF] hover:bg-[#1267D5] text-white text-xs font-bold transition-[color,transform] flex items-center space-x-1 cursor-pointer shadow-2xs active:scale-95"
                                  title={
                                    language === 'id'
                                      ? 'Percayai domain ini secara programatik'
                                      : 'Trust domain programmatically'
                                  }
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>
                                    {language === 'id'
                                      ? 'Percayai Domain'
                                      : 'Trust Domain'}
                                  </span>
                                </button>
                              )}
                          </div>
                        </div>

                        {/* Expanded Technical Inspection */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-[#E2E8F0] dark:border-[#1E3A5F] space-y-2 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono bg-[#F8F9FA] dark:bg-[#081827] p-2.5 rounded-lg border border-[#E2E8F0] dark:border-[#1E3A5F]">
                              <div>
                                <span className="text-[#64748B] dark:text-slate-400">
                                  SPF Verdict:
                                </span>{' '}
                                <span
                                  className={
                                    item.authDetails?.spf === 'pass'
                                      ? 'text-emerald-600 font-bold'
                                      : 'text-amber-600 font-bold'
                                  }
                                >
                                  {item.authDetails?.spf || 'none'}
                                </span>
                              </div>
                              <div>
                                <span className="text-[#64748B] dark:text-slate-400">
                                  DKIM Verdict:
                                </span>{' '}
                                <span
                                  className={
                                    item.authDetails?.dkim === 'pass'
                                      ? 'text-emerald-600 font-bold'
                                      : 'text-amber-600 font-bold'
                                  }
                                >
                                  {item.authDetails?.dkim || 'none'}
                                </span>
                              </div>
                              <div>
                                <span className="text-[#64748B] dark:text-slate-400">
                                  Authenticated Domain:
                                </span>{' '}
                                <span className="text-[#051C2C] dark:text-white font-bold">
                                  {item.authDetails?.authenticatedDomain ||
                                    item.senderDomain}
                                </span>
                              </div>
                              <div>
                                <span className="text-[#64748B] dark:text-slate-400">
                                  Claimed Merchant:
                                </span>{' '}
                                <span className="text-[#051C2C] dark:text-white font-bold">
                                  {item.claimedMerchant || 'N/A'}
                                </span>
                              </div>
                            </div>

                            {item.snippet && (
                              <div>
                                <span className="text-[#64748B] dark:text-slate-400 font-semibold block mb-1">
                                  {language === 'id'
                                    ? 'Cuplikan Pesan Asli:'
                                    : 'Email Snippet:'}
                                </span>
                                <div className="p-2 bg-[#F8F9FA] dark:bg-[#081827] rounded font-mono text-[11px] max-h-24 overflow-y-auto whitespace-pre-wrap">
                                  {item.snippet}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Trusted Rules Management Tab */
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="p-3.5 bg-[#F0F4F8] dark:bg-[#081827] border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-xl text-xs space-y-1">
                <p className="font-bold text-[#051C2C] dark:text-white flex items-center space-x-1.5">
                  <Lock className="w-4 h-4 text-[#2251FF] dark:text-[#38BDF8]" />
                  <span>
                    {language === 'id'
                      ? 'Gerbang Keamanan: Domain Tepercaya Terprogram'
                      : 'Security Guard: Programmatic Trusted Domains'}
                  </span>
                </p>
                <p className="text-[#64748B] dark:text-slate-400 leading-relaxed text-[11px]">
                  {language === 'id'
                    ? 'Seluruh domain tepercaya diekstrak langsung dari header otentikasi kriptografis Gmail saat Anda menyetujuinya. Tidak ada input teks bebas manual demi mencegah serangan phishing injeksi DNS.'
                    : 'All trusted rules are extracted directly from Gmail cryptographic authentication headers when approved. Manual free-text inputs are strictly forbidden to prevent homograph / DNS injection attacks.'}
                </p>
              </div>

              {userTrustedRules.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#64748B] dark:text-slate-400 bg-[#F8F9FA] dark:bg-[#081827] rounded-xl border border-dashed border-[#CBD5E1] dark:border-[#1E3A5F]">
                  {language === 'id'
                    ? 'Belum ada aturan domain kustom. Domain dari merchant resmi (AWS, Google, BCA, dll.) otomatis diverifikasi melalui Allowlist bawaan.'
                    : 'No custom trusted domain rules yet. Official merchants (AWS, Google, BCA, etc.) are verified via standard default Allowlist.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {userTrustedRules.map((rule) => (
                    <div
                      key={rule.domain}
                      className="p-3 rounded-xl bg-white dark:bg-[#0D2238] border border-[#CBD5E1] dark:border-[#1E3A5F] flex items-center justify-between text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-[#051C2C] dark:text-white bg-[#F0F4F8] dark:bg-[#163354] px-2 py-0.5 rounded">
                            {rule.domain}
                          </span>
                          <span className="text-[#64748B] dark:text-slate-400 font-medium">
                            ({rule.displayName})
                          </span>
                          {rule.isCryptographicallyVerified && (
                            <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded">
                              <ShieldCheck className="w-3 h-3 mr-0.5" /> DKIM
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                          {language === 'id' ? 'Ditambahkan:' : 'Added:'}{' '}
                          {new Date(rule.trustedAt).toLocaleDateString()}
                        </p>
                      </div>

                      <button
                        onClick={() => onRemoveTrustedRule(rule.domain)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-semibold transition-colors cursor-pointer"
                      >
                        {language === 'id' ? 'Hapus' : 'Remove'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Modal Footer */}
          <div className="p-4 border-t border-white/10 flex items-center justify-between bg-[#F8F9FA] dark:bg-[#081827] rounded-b-2xl">
            <span className="text-xs text-[#64748B] dark:text-slate-400">
              {language === 'id'
                ? 'Proteksi Aktif: Exact Domain Matching & Homoglyph Normalizer'
                : 'Active Protection: Exact Domain Matching & Homoglyph Normalizer'}
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#2251FF] hover:bg-[#1267D5] text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              {language === 'id' ? 'Selesai' : 'Done'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
