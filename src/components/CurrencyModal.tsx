import React, { useState } from 'react';
import {
  SupportedCurrency,
  CURRENCIES,
  formatCurrency,
  convertCurrency,
  getExchangeRateBetween,
} from '../services/currency';
import { ExchangeRateDatabase } from '../types';
import { Translations, LanguageCode } from '../services/translations';
import {
  X,
  Coins,
  Check,
  RefreshCw,
  Clock,
  ArrowRightLeft,
  Database,
  TrendingUp,
  Activity,
  Calendar,
  Calculator,
} from 'lucide-react';

interface CurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: SupportedCurrency;
  onSelectCurrency: (c: SupportedCurrency) => void;
  exchangeRateDb: ExchangeRateDatabase;
  onRefreshRates: () => Promise<void>;
  onUpdateInterval: (minutes: number) => void;
  onToggleAutoUpdate: (enabled: boolean) => void;
  isUpdatingRates?: boolean;
  language?: LanguageCode;
  t: Translations;
}

export const CurrencyModal: React.FC<CurrencyModalProps> = ({
  isOpen,
  onClose,
  currency,
  onSelectCurrency,
  exchangeRateDb,
  onRefreshRates,
  onUpdateInterval,
  onToggleAutoUpdate,
  isUpdatingRates = false,
  language = 'id',
  t,
}) => {
  const [activeTab, setActiveTab] = useState<
    'switcher' | 'rates' | 'calculator'
  >('switcher');

  // Calculator state
  const [fromCurrency, setFromCurrency] = useState<SupportedCurrency>(
    currency === 'IDR' ? 'USD' : currency
  );
  const [toCurrency, setToCurrency] = useState<SupportedCurrency>(
    currency === 'IDR' ? 'IDR' : 'USD'
  );
  const [calcAmount, setCalcAmount] = useState<number>(100);

  if (!isOpen) return null;

  const isIndonesian = language === 'id';
  const cm = t.currencyModal;
  const ratesToIDR = exchangeRateDb.ratesToIDR;
  const lastUpdatedDate = exchangeRateDb.lastUpdated
    ? new Date(exchangeRateDb.lastUpdated)
    : new Date();

  // Swap From and To currencies
  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  // Live conversion rate & result
  const unitRate = getExchangeRateBetween(fromCurrency, toCurrency, ratesToIDR);
  const reverseUnitRate = unitRate > 0 ? 1 / unitRate : 0;
  const convertedResult = calcAmount * unitRate;

  // Context-aware quick presets for the source currency
  const getPresets = (cur: SupportedCurrency): number[] => {
    if (cur === 'IDR') return [50000, 100000, 500000, 1000000, 5000000];
    if (cur === 'JPY') return [1000, 5000, 10000, 50000, 100000];
    return [10, 50, 100, 250, 500, 1000];
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        id="currency-modal"
        className="glass-modal rounded-2xl max-w-xl w-full p-4 sm:p-6 text-white shadow-[0_16px_48px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col transition-colors"
      >
        <div className="glass-content flex flex-col flex-1 min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10 shrink-0">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-[#F0F4F8] dark:bg-[#163354] text-[#2251FF] dark:text-[#38BDF8] shrink-0 shadow-2xs">
                <Coins className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-base sm:text-lg font-bold text-[#051C2C] dark:text-white tracking-tight font-editorial truncate">
                    {cm.title}
                  </h3>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <Activity className="w-2.5 h-2.5 mr-1 text-emerald-500 dark:text-emerald-400 animate-pulse" />
                    Auto-Sync
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {cm.subtitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#051C2C] dark:hover:text-white hover:bg-[#F0F4F8] dark:hover:bg-[#163354] transition-colors cursor-pointer shrink-0 ml-3"
              title={cm.close}
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex rounded-xl bg-[#F0F4F8] dark:bg-[#081827] p-1 mt-3.5 mb-3 border border-[#E2E8F0] dark:border-[#1E3A5F] shrink-0">
            <button
              id="currency-tab-switcher-btn"
              onClick={() => setActiveTab('switcher')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center space-x-1.5 ${
                activeTab === 'switcher'
                  ? 'bg-white dark:bg-[#163354] text-[#051C2C] dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#051C2C] dark:hover:text-white'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-[#2251FF] dark:text-[#38BDF8]" />
              <span className="truncate">{cm.tabSwitcher}</span>
            </button>

            <button
              id="currency-tab-rates-btn"
              onClick={() => setActiveTab('rates')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center space-x-1.5 ${
                activeTab === 'rates'
                  ? 'bg-white dark:bg-[#163354] text-[#051C2C] dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#051C2C] dark:hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-[#2251FF] dark:text-[#38BDF8]" />
              <span className="truncate">{cm.tabRates}</span>
            </button>

            <button
              id="currency-tab-calculator-btn"
              onClick={() => setActiveTab('calculator')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center space-x-1.5 ${
                activeTab === 'calculator'
                  ? 'bg-white dark:bg-[#163354] text-[#051C2C] dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#051C2C] dark:hover:text-white'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-[#2251FF] dark:text-[#38BDF8]" />
              <span className="truncate">{cm.tabCalculator}</span>
            </button>
          </div>

          {/* TAB 1: CURRENCY SWITCHER */}
          {activeTab === 'switcher' && (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-1">
              <div className="bg-[#F0F4F8] dark:bg-[#081827] border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-xl p-3 mb-3 text-xs text-[#051C2C] dark:text-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[#2251FF] dark:bg-[#38BDF8] animate-ping" />
                  <span>
                    {cm.activeCurrency}{' '}
                    <strong className="text-[#051C2C] dark:text-white">
                      {currency} ({CURRENCIES[currency]?.name})
                    </strong>
                  </span>
                </div>
                <span className="font-mono font-bold text-[#2251FF] dark:text-[#38BDF8]">
                  {CURRENCIES[currency]?.symbol}
                </span>
              </div>

              {(Object.keys(CURRENCIES) as SupportedCurrency[]).map((code) => {
                const item = CURRENCIES[code];
                const isSelected = currency === code;
                const rateToActive = getExchangeRateBetween(
                  code,
                  currency,
                  ratesToIDR
                );

                return (
                  <button
                    key={code}
                    onClick={() => onSelectCurrency(code)}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#F0F4F8] dark:bg-[#163354] border-[#2251FF] dark:border-[#38BDF8] text-[#051C2C] dark:text-white shadow-2xs ring-1 ring-[#2251FF]/20'
                        : 'bg-[#F8F9FA] dark:bg-[#081827] border-[#E2E8F0] dark:border-[#1E3A5F] text-slate-700 dark:text-slate-200 hover:bg-[#F0F4F8] dark:hover:bg-[#112842]'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="text-2xl shrink-0">{item.flag}</span>
                      <div className="text-left min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-[#051C2C] dark:text-white text-sm">
                            {item.code}
                          </span>
                          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-[#0D2238] text-[#2251FF] dark:text-[#38BDF8] font-bold border border-[#CBD5E1] dark:border-[#1E3A5F]">
                            {item.symbol}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {item.name}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {isSelected ? (
                        <div className="flex items-center space-x-1.5 text-xs text-[#2251FF] dark:text-[#38BDF8] font-bold">
                          <Check className="w-4 h-4" />
                          <span>{isIndonesian ? 'Aktif' : 'Active'}</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          1 {code} ={' '}
                          {rateToActive < 1
                            ? rateToActive.toFixed(4)
                            : rateToActive.toLocaleString(
                                isIndonesian ? 'id-ID' : 'en-US',
                                { maximumFractionDigits: 2 }
                              )}{' '}
                          {currency}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 2: LIVE RATES & AUTO-UPDATE SETTINGS */}
          {activeTab === 'rates' && (
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 my-1 text-xs">
              {/* Live Database Sync Card */}
              <div className="bg-[#051C2C] dark:bg-[#081827] text-white p-4 rounded-xl border border-[#0D2E78] dark:border-[#1E3A5F] shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-[#38BDF8]" />
                    <span className="font-bold text-sm text-white">
                      {cm.ratesTitle}
                    </span>
                  </div>
                  <button
                    onClick={onRefreshRates}
                    disabled={isUpdatingRates}
                    className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#2251FF] hover:bg-[#1267D5] text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                    title={cm.refreshRatesNow}
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isUpdatingRates ? 'animate-spin' : ''}`}
                    />
                    <span>
                      {isUpdatingRates ? cm.updatingRates : cm.refreshRatesNow}
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-white/10 text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      {cm.lastUpdated}
                    </span>
                    <span className="font-mono text-white font-semibold">
                      {lastUpdatedDate.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      {cm.rateSource}
                    </span>
                    <span className="font-medium text-[#38BDF8] truncate block">
                      {exchangeRateDb.provider ||
                        (isIndonesian
                          ? 'Bank Indonesia & Pasar Global'
                          : 'Bank Indonesia & Forex Market')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Auto-Update Timespan Configuration */}
              <div className="bg-[#F8F9FA] dark:bg-[#081827] border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-[#2251FF] dark:text-[#38BDF8]" />
                    <span className="font-bold text-[#051C2C] dark:text-white">
                      {cm.autoUpdateEvery}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        exchangeRateDb.autoUpdateEnabled
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-[#163354] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-[#1E3A5F]'
                      }`}
                    >
                      {exchangeRateDb.autoUpdateEnabled
                        ? cm.enabled
                        : cm.paused}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exchangeRateDb.autoUpdateEnabled}
                        onChange={(e) => onToggleAutoUpdate(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-colors peer-checked:bg-[#2251FF]"></div>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {[5, 15, 30, 60, 360, 1440].map((mins) => {
                    const label = isIndonesian
                      ? mins === 5
                        ? '5 Mnt'
                        : mins === 15
                          ? '15 Mnt'
                          : mins === 30
                            ? '30 Mnt'
                            : mins === 60
                              ? '1 Jam'
                              : mins === 360
                                ? '6 Jam'
                                : '24 Jam'
                      : mins === 5
                        ? '5 Min'
                        : mins === 15
                          ? '15 Min'
                          : mins === 30
                            ? '30 Min'
                            : mins === 60
                              ? '1 Hr'
                              : mins === 360
                                ? '6 Hrs'
                                : '24 Hrs';
                    const isSelected =
                      exchangeRateDb.updateIntervalMinutes === mins;

                    return (
                      <button
                        key={mins}
                        onClick={() => onUpdateInterval(mins)}
                        className={`py-1.5 px-2 rounded-lg text-center font-bold text-[11px] transition-colors cursor-pointer border flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-[#2251FF] text-white border-[#2251FF] shadow-2xs ring-2 ring-[#2251FF]/20'
                            : 'bg-white dark:bg-[#0D2238] hover:bg-[#F0F4F8] dark:hover:bg-[#163354] hover:border-[#2251FF]/40 border-[#CBD5E1] dark:border-[#1E3A5F] text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <span>{label}</span>
                        {isSelected && (
                          <span className="text-[9px] opacity-90 font-mono tracking-tight">
                            {isIndonesian ? 'Aktif' : 'Active'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/80 dark:border-[#1E3A5F]">
                  <span className="flex items-center">
                    <Activity className="w-3 h-3 mr-1 text-[#2251FF] dark:text-[#38BDF8]" />
                    {isIndonesian ? 'Interval Terpilih:' : 'Selected Interval:'}{' '}
                    <strong className="text-[#051C2C] dark:text-white">
                      &nbsp;
                      {exchangeRateDb.updateIntervalMinutes >= 60
                        ? `${exchangeRateDb.updateIntervalMinutes / 60} ${isIndonesian ? 'Jam' : 'Hours'}`
                        : `${exchangeRateDb.updateIntervalMinutes} ${isIndonesian ? 'Menit' : 'Minutes'}`}
                    </strong>
                  </span>
                  {exchangeRateDb.nextUpdateDue && (
                    <span className="font-mono text-[10px]">
                      {isIndonesian ? 'Sinkronisasi Berikutnya:' : 'Next Sync:'}{' '}
                      {new Date(
                        exchangeRateDb.nextUpdateDue
                      ).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </div>

              {/* Live Exchange Rate Matrix List */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-600 dark:text-slate-300 block text-[11px] uppercase tracking-wider">
                  {cm.ratesMatrix}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(CURRENCIES) as SupportedCurrency[])
                    .filter((c) => c !== 'IDR')
                    .map((code) => {
                      const item = CURRENCIES[code];
                      const rateInIdr =
                        ratesToIDR[code] || item.defaultRateToIDR;

                      return (
                        <div
                          key={code}
                          className="bg-white dark:bg-[#081827] border border-[#E2E8F0] dark:border-[#1E3A5F] p-2.5 rounded-xl flex items-center justify-between shadow-2xs"
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <span className="text-xl">{item.flag}</span>
                            <div>
                              <span className="font-bold text-[#051C2C] dark:text-white">
                                {code}
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {item.name}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-sm text-[#051C2C] dark:text-white">
                              Rp{' '}
                              {rateInIdr.toLocaleString(
                                isIndonesian ? 'id-ID' : 'en-US'
                              )}
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block flex items-center justify-end">
                              <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                              Live Matrix
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SIMPLIFIED, INTUITIVE & BUG-FREE KURS KALKULATOR */}
          {activeTab === 'calculator' && (
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 my-1 text-xs">
              {/* Top Converter Controls */}
              <div className="bg-[#F8F9FA] dark:bg-[#081827] border border-[#CBD5E1] dark:border-[#1E3A5F] p-4 rounded-xl space-y-3">
                {/* Currency Selector Row: FROM <-> TO */}
                <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
                  {/* From Currency */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      {cm.fromLabel}
                    </label>
                    <select
                      id="calc-from-currency-select"
                      value={fromCurrency}
                      onChange={(e) =>
                        setFromCurrency(e.target.value as SupportedCurrency)
                      }
                      className="w-full px-2.5 py-2 bg-white dark:bg-[#0D2238] border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-lg text-xs font-bold text-[#051C2C] dark:text-white focus:ring-2 focus:ring-[#2251FF] outline-hidden cursor-pointer"
                    >
                      {(Object.keys(CURRENCIES) as SupportedCurrency[]).map(
                        (c) => (
                          <option
                            key={c}
                            value={c}
                            className="dark:bg-[#0D2238] dark:text-white"
                          >
                            {CURRENCIES[c].flag} {c} - {CURRENCIES[c].name}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {/* Swap Button */}
                  <div className="flex justify-center pt-4">
                    <button
                      type="button"
                      onClick={handleSwapCurrencies}
                      title={cm.swap}
                      className="p-2 bg-white dark:bg-[#163354] hover:bg-[#F0F4F8] dark:hover:bg-[#1E4373] text-[#2251FF] dark:text-[#38BDF8] border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-full shadow-2xs hover:scale-105 active:scale-95 transition-[color,transform] cursor-pointer"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </button>
                  </div>

                  {/* To Currency */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      {cm.toLabel}
                    </label>
                    <select
                      id="calc-to-currency-select"
                      value={toCurrency}
                      onChange={(e) =>
                        setToCurrency(e.target.value as SupportedCurrency)
                      }
                      className="w-full px-2.5 py-2 bg-white dark:bg-[#0D2238] border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-lg text-xs font-bold text-[#051C2C] dark:text-white focus:ring-2 focus:ring-[#2251FF] outline-hidden cursor-pointer"
                    >
                      {(Object.keys(CURRENCIES) as SupportedCurrency[]).map(
                        (c) => (
                          <option
                            key={c}
                            value={c}
                            className="dark:bg-[#0D2238] dark:text-white"
                          >
                            {CURRENCIES[c].flag} {c} - {CURRENCIES[c].name}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {cm.amountLabel}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-[#2251FF] dark:text-[#38BDF8] font-mono">
                      {CURRENCIES[fromCurrency]?.symbol || fromCurrency}
                    </span>
                    <input
                      id="calc-amount-input"
                      type="number"
                      min="0"
                      step="any"
                      value={calcAmount === 0 ? '' : calcAmount}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setCalcAmount(isNaN(val) ? 0 : Math.max(0, val));
                      }}
                      className="w-full pl-12 pr-4 py-2 bg-white dark:bg-[#0D2238] border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-lg text-base font-bold font-mono text-[#051C2C] dark:text-white focus:ring-2 focus:ring-[#2251FF] outline-hidden"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Quick Presets for From Currency */}
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    {cm.quickPresets}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {getPresets(fromCurrency).map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCalcAmount(val)}
                        className={`px-2 py-1 rounded text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                          calcAmount === val
                            ? 'bg-[#2251FF] text-white border-[#2251FF]'
                            : 'bg-white dark:bg-[#0D2238] text-slate-700 dark:text-slate-200 border-[#CBD5E1] dark:border-[#1E3A5F] hover:bg-[#F0F4F8] dark:hover:bg-[#163354]'
                        }`}
                      >
                        {formatCurrency(val, fromCurrency, true)}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCalcAmount(1)}
                      className="px-2 py-1 bg-white dark:bg-[#0D2238] text-slate-500 dark:text-slate-300 border border-[#CBD5E1] dark:border-[#1E3A5F] hover:bg-slate-100 dark:hover:bg-[#163354] rounded text-[11px] font-mono cursor-pointer"
                    >
                      1 {fromCurrency}
                    </button>
                  </div>
                </div>
              </div>

              {/* Big Live Conversion Result Box */}
              <div className="bg-gradient-to-br from-[#051C2C] to-[#0D2E78] dark:from-[#081827] dark:to-[#163354] text-white p-4 rounded-xl border border-[#0D2E78] dark:border-[#1E3A5F] shadow-sm">
                <span className="text-[10px] uppercase font-bold text-[#38BDF8] tracking-wider block mb-1">
                  {cm.convertedResultLabel}
                </span>
                <div className="flex items-baseline justify-between flex-wrap gap-2">
                  <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
                    {formatCurrency(convertedResult, toCurrency)}
                  </div>
                  <div className="text-xs text-slate-300 font-mono">
                    {formatCurrency(calcAmount, fromCurrency)}
                  </div>
                </div>

                {/* Exchange Rate Quote Footnote */}
                <div className="pt-2.5 mt-2.5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-slate-300 gap-1 font-mono">
                  <div>
                    {cm.rateQuote} 1 {fromCurrency} ={' '}
                    <strong className="text-white">
                      {unitRate < 0.01
                        ? unitRate.toFixed(6)
                        : unitRate < 1
                          ? unitRate.toFixed(4)
                          : unitRate.toLocaleString(
                              isIndonesian ? 'id-ID' : 'en-US',
                              { maximumFractionDigits: 2 }
                            )}{' '}
                      {toCurrency}
                    </strong>
                  </div>
                  {reverseUnitRate > 0 && (
                    <div className="text-slate-400">
                      (1 {toCurrency} ={' '}
                      {reverseUnitRate < 0.01
                        ? reverseUnitRate.toFixed(6)
                        : reverseUnitRate < 1
                          ? reverseUnitRate.toFixed(4)
                          : reverseUnitRate.toLocaleString(
                              isIndonesian ? 'id-ID' : 'en-US',
                              { maximumFractionDigits: 2 }
                            )}{' '}
                      {fromCurrency})
                    </div>
                  )}
                </div>
              </div>

              {/* Cross-Currency Multi Matrix for this Amount */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-600 dark:text-slate-300 block text-[11px]">
                  {cm.allCurrenciesTitle}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(CURRENCIES) as SupportedCurrency[]).map(
                    (targetCode) => {
                      const targetItem = CURRENCIES[targetCode];
                      const convertedVal = convertCurrency(
                        calcAmount,
                        fromCurrency,
                        targetCode,
                        ratesToIDR
                      );
                      const isCurrentTarget = targetCode === toCurrency;

                      return (
                        <button
                          key={targetCode}
                          type="button"
                          onClick={() => setToCurrency(targetCode)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-colors cursor-pointer ${
                            isCurrentTarget
                              ? 'bg-[#F0F4F8] dark:bg-[#163354] border-[#2251FF] dark:border-[#38BDF8] shadow-2xs ring-1 ring-[#2251FF]/20'
                              : 'bg-white dark:bg-[#081827] border-[#E2E8F0] dark:border-[#1E3A5F] hover:bg-slate-50 dark:hover:bg-[#112842]'
                          }`}
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <span className="text-lg">{targetItem.flag}</span>
                            <div className="min-w-0">
                              <span className="font-bold text-[#051C2C] dark:text-white text-xs">
                                {targetCode}
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {targetItem.name}
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-xs text-[#051C2C] dark:text-white ml-2 shrink-0">
                            {formatCurrency(convertedVal, targetCode)}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-[#2251FF] dark:text-[#38BDF8]" />
              <span>
                {cm.syncInterval} {exchangeRateDb.updateIntervalMinutes}{' '}
                {isIndonesian ? 'Menit' : 'Min'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#2251FF] hover:bg-[#1267D5] text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer active:scale-95"
            >
              {cm.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
