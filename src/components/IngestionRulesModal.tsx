import React, { useState } from 'react';
import { IngestionRule, ExpenseCategory, Expense } from '../types';
import { Translations } from '../services/translations';
import {
  DEFAULT_INGESTION_RULES,
  batchApplyRules,
} from '../services/rulesEngine';
import {
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';

interface IngestionRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: IngestionRule[];
  onSaveRules: (rules: IngestionRule[]) => void;
  expenses: Expense[];
  onApplyRulesToExisting: (
    updatedExpenses: Expense[],
    modifiedCount: number
  ) => void;
  language?: 'en' | 'id';
  t: Translations;
}

const CATEGORIES: ExpenseCategory[] = [
  'Dining & Food',
  'Groceries',
  'Shopping & Retail',
  'Utilities & Bills',
  'Travel & Transportation',
  'Entertainment & Subscriptions',
  'Health & Wellness',
  'Financial & Fees',
  'Housing & Rent',
  'Other',
];

export const IngestionRulesModal: React.FC<IngestionRulesModalProps> = ({
  isOpen,
  onClose,
  rules,
  onSaveRules,
  expenses,
  onApplyRulesToExisting,
  language = 'id',
  t,
}) => {
  const [localRules, setLocalRules] = useState<IngestionRule[]>(rules);
  const [newRuleName, setNewRuleName] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [newMatchField, setNewMatchField] = useState<
    'merchant' | 'sender' | 'subject' | 'any'
  >('any');
  const [newCategory, setNewCategory] =
    useState<ExpenseCategory>('Dining & Food');
  const [newTagsString, setNewTagsString] = useState('');
  const [newIsBusiness, setNewIsBusiness] = useState(false);
  const [newIsTaxDeductible, setNewIsTaxDeductible] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [applyResultMsg, setApplyResultMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleRule = (id: string) => {
    const updated = localRules.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    setLocalRules(updated);
    onSaveRules(updated);
  };

  const handleDeleteRule = (id: string) => {
    const updated = localRules.filter((r) => r.id !== id);
    setLocalRules(updated);
    onSaveRules(updated);
  };

  const handleResetDefaults = () => {
    setLocalRules(DEFAULT_INGESTION_RULES);
    onSaveRules(DEFAULT_INGESTION_RULES);
    setApplyResultMsg(
      language === 'id'
        ? 'Aturan dikembalikan ke setelan standar default.'
        : 'Rules reset to standard defaults.'
    );
  };

  const handleAddNewRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim() || !newRuleName.trim()) return;

    const tags = newTagsString
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const newRule: IngestionRule = {
      id: `rule_custom_${Date.now()}`,
      name: newRuleName.trim(),
      keyword: newKeyword.trim(),
      matchField: newMatchField,
      assignCategory: newCategory,
      autoTags: tags,
      isBusinessExpense: newIsBusiness,
      isTaxDeductible: newIsTaxDeductible,
      enabled: true,
    };

    const updated = [newRule, ...localRules];
    setLocalRules(updated);
    onSaveRules(updated);

    // Reset form
    setNewRuleName('');
    setNewKeyword('');
    setNewTagsString('');
    setNewIsBusiness(false);
    setNewIsTaxDeductible(false);
    setIsAddingNew(false);
  };

  const handleApplyToAllExisting = () => {
    const { updatedExpenses, countModified } = batchApplyRules(
      expenses,
      localRules
    );
    onApplyRulesToExisting(updatedExpenses, countModified);
    setApplyResultMsg(
      language === 'id'
        ? `Berhasil mengevaluasi ulang feed: ${countModified} transaksi diperbarui dengan aturan.`
        : `Successfully re-evaluated feed: ${countModified} transactions updated by active rules.`
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="ingestion-rules-modal"
        className="glass-modal rounded-2xl max-w-2xl w-full p-6 shadow-[0_16px_48px_rgba(0,0,0,0.6)] max-h-[90vh] flex flex-col animate-in fade-in-50 zoom-in-95 transition-colors text-white"
      >
        <div className="glass-content flex flex-col flex-1 min-h-0">
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-[#F0F4F8] dark:bg-[#163354] text-[#2251FF] dark:text-[#38BDF8] border border-[#C5DCF5] dark:border-[#1E3A5F] shrink-0 shadow-2xs">
                <Zap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-[#051C2C] dark:text-white font-editorial truncate">
                  {language === 'id'
                    ? 'Aturan Ingestion Otomatis & Klasifikasi AI'
                    : 'Smart Ingestion & Auto-Categorization Rules'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {language === 'id'
                    ? 'Aturan otomatis untuk mengklasifikasi email notifikasi bank & kwitansi masuk'
                    : 'Automated heuristics to classify inbound bank alerts & digital receipts'}
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

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {/* Quick Info & Action Bar */}
            <div className="bg-[#F8F9FA] dark:bg-[#081827] border border-[#C5DCF5] dark:border-[#1E3A5F] rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-[#051C2C] dark:text-white">
                  {localRules.filter((r) => r.enabled).length}
                </span>{' '}
                {language === 'id'
                  ? `dari ${localRules.length} aturan aktif untuk pemindaian feed inbox.`
                  : `of ${localRules.length} rules active for inbox ingestion.`}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleApplyToAllExisting}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#2251FF] hover:bg-[#1267D5] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  title={
                    language === 'id'
                      ? 'Terapkan aturan pada transaksi yang sudah tersimpan'
                      : 'Apply rules to existing expenses'
                  }
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>
                    {language === 'id'
                      ? 'Terapkan ke Transaksi'
                      : 'Apply to Feed'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="flex items-center space-x-1 px-2.5 py-1.5 bg-white dark:bg-[#0D2238] hover:bg-slate-100 dark:hover:bg-[#163354] border border-[#CBD5E1] dark:border-[#1E3A5F] text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  title={
                    language === 'id'
                      ? 'Reset ke aturan bawaan'
                      : 'Reset to default rules'
                  }
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {applyResultMsg && (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{applyResultMsg}</span>
              </div>
            )}

            {/* Add New Rule Form or Toggle */}
            {!isAddingNew ? (
              <button
                id="add-new-rule-trigger-btn"
                onClick={() => setIsAddingNew(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-dashed border-[#2251FF] dark:border-[#38BDF8] bg-[#F0F4F8] dark:bg-[#081827] hover:bg-[#E2ECF8] dark:hover:bg-[#112842] text-[#2251FF] dark:text-[#38BDF8] text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {language === 'id'
                    ? 'Tambah Aturan Ingestion Baru'
                    : 'Add New Ingestion Rule'}
                </span>
              </button>
            ) : (
              <form
                onSubmit={handleAddNewRule}
                className="bg-[#F8F9FA] dark:bg-[#081827] border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-xl p-4 space-y-3 animate-in fade-in-50"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#1E3A5F]">
                  <span className="text-xs font-bold text-[#051C2C] dark:text-white">
                    {language === 'id'
                      ? 'Konfigurasi Aturan Baru'
                      : 'New Rule Configuration'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {language === 'id' ? 'Batal' : 'Cancel'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      {language === 'id' ? 'Nama Aturan' : 'Rule Name'}
                    </label>
                    <input
                      type="text"
                      placeholder={
                        language === 'id'
                          ? 'Contoh: Tiket Kereta & MRT'
                          : 'e.g., Train & Transit Tickets'
                      }
                      value={newRuleName}
                      onChange={(e) => setNewRuleName(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 bg-white dark:bg-[#0D2238] border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-lg text-xs text-[#051C2C] dark:text-white focus:ring-1 focus:ring-[#2251FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      {language === 'id'
                        ? 'Kata Kunci Pencocokan'
                        : 'Matching Keyword'}
                    </label>
                    <input
                      type="text"
                      placeholder={
                        language === 'id'
                          ? 'Contoh: KAI, MRT, Grab'
                          : 'e.g., KAI, MRT, Uber'
                      }
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 bg-white dark:bg-[#0D2238] border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-lg text-xs text-[#051C2C] dark:text-white focus:ring-1 focus:ring-[#2251FF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      {language === 'id' ? 'Target Bidang' : 'Match Field'}
                    </label>
                    <select
                      value={newMatchField}
                      onChange={(e) => setNewMatchField(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-[#0D2238] border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-lg text-xs text-[#051C2C] dark:text-white"
                    >
                      <option
                        value="any"
                        className="dark:bg-[#0D2238] dark:text-white"
                      >
                        {language === 'id'
                          ? 'Semua (Merchant, Subjek, Sender)'
                          : 'Any (Merchant, Subject, Sender)'}
                      </option>
                      <option
                        value="merchant"
                        className="dark:bg-[#0D2238] dark:text-white"
                      >
                        {language === 'id'
                          ? 'Nama Merchant Saja'
                          : 'Merchant Name Only'}
                      </option>
                      <option
                        value="sender"
                        className="dark:bg-[#0D2238] dark:text-white"
                      >
                        {language === 'id'
                          ? 'Alamat Email Pengirim'
                          : 'Sender Email Address'}
                      </option>
                      <option
                        value="subject"
                        className="dark:bg-[#0D2238] dark:text-white"
                      >
                        {language === 'id' ? 'Subjek Email' : 'Email Subject'}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      {language === 'id'
                        ? 'Kategori yang Diterapkan'
                        : 'Assigned Category'}
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) =>
                        setNewCategory(e.target.value as ExpenseCategory)
                      }
                      className="w-full px-3 py-1.5 bg-white dark:bg-[#0D2238] border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-lg text-xs text-[#051C2C] dark:text-white"
                    >
                      {CATEGORIES.map((cat) => (
                        <option
                          key={cat}
                          value={cat}
                          className="dark:bg-[#0D2238] dark:text-white"
                        >
                          {t.categories[cat] || cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {language === 'id'
                      ? 'Tag Otomatis (pisahkan dengan koma)'
                      : 'Auto Tags (comma separated)'}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      language === 'id'
                        ? 'Contoh: transport, dinas, reimbursable'
                        : 'e.g., transport, business, reimbursable'
                    }
                    value={newTagsString}
                    onChange={(e) => setNewTagsString(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-[#0D2238] border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-lg text-xs text-[#051C2C] dark:text-white"
                  />
                </div>

                <div className="flex items-center space-x-4 pt-1">
                  <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newIsBusiness}
                      onChange={(e) => setNewIsBusiness(e.target.checked)}
                      className="rounded border-slate-300 text-[#2251FF] focus:ring-[#2251FF]"
                    />
                    <span>
                      {language === 'id'
                        ? 'Tandai Pengeluaran Bisnis / Kantor'
                        : 'Mark as Business / Claim Expense'}
                    </span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newIsTaxDeductible}
                      onChange={(e) => setNewIsTaxDeductible(e.target.checked)}
                      className="rounded border-slate-300 text-[#2251FF] focus:ring-[#2251FF]"
                    />
                    <span>
                      {language === 'id'
                        ? 'Dapat Dikurangkan Pajak (Tax-Deductible)'
                        : 'Tax Deductible'}
                    </span>
                  </label>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#163354] rounded-lg"
                  >
                    {language === 'id' ? 'Batal' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#2251FF] hover:bg-[#1267D5] text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer"
                  >
                    {language === 'id' ? 'Simpan Aturan' : 'Save Rule'}
                  </button>
                </div>
              </form>
            )}

            {/* Rule Cards List */}
            <div className="space-y-2.5">
              {localRules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-3.5 rounded-xl border transition-colors ${
                    rule.enabled
                      ? 'bg-white dark:bg-[#081827] border-[#CBD5E1] dark:border-[#1E3A5F] shadow-2xs hover:border-[#2251FF]'
                      : 'bg-slate-50 dark:bg-[#06121F] border-slate-200 dark:border-[#162C47] opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() => handleToggleRule(rule.id)}
                        className="mt-1 rounded border-slate-300 text-[#2251FF] focus:ring-[#2251FF] cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="text-xs font-bold text-[#051C2C] dark:text-white">
                            {rule.name}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#F0F4F8] dark:bg-[#163354] text-[#2251FF] dark:text-[#38BDF8] border border-[#C5DCF5] dark:border-[#1E3A5F]">
                            {language === 'id' ? 'kata kunci' : 'keyword'}: "
                            {rule.keyword}"
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 mt-1.5 flex-wrap gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {language === 'id' ? 'Kategori:' : 'Category:'}{' '}
                            <span className="text-[#051C2C] dark:text-white">
                              {t.categories[rule.assignCategory] ||
                                rule.assignCategory}
                            </span>
                          </span>
                          <span>•</span>
                          <span>
                            {language === 'id' ? 'Bidang' : 'Field'}:{' '}
                            {rule.matchField}
                          </span>
                          {rule.isBusinessExpense && (
                            <>
                              <span>•</span>
                              <span className="text-amber-700 dark:text-amber-300 font-medium bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                                {language === 'id' ? 'Bisnis' : 'Business'}
                              </span>
                            </>
                          )}
                          {rule.isTaxDeductible && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                Tax-Deductible
                              </span>
                            </>
                          )}
                        </div>

                        {rule.autoTags && rule.autoTags.length > 0 && (
                          <div className="flex items-center space-x-1.5 mt-2 flex-wrap gap-y-1">
                            {rule.autoTags.map((tag) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#163354] text-slate-600 dark:text-slate-300 text-[10px] font-medium"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title={language === 'id' ? 'Hapus aturan' : 'Delete rule'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {language === 'id'
                ? 'Aturan disimpan secara lokal pada profil Anda'
                : 'Rules saved locally to your profile'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#2251FF] hover:bg-[#1267D5] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              {language === 'id' ? 'Selesai' : 'Done'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
