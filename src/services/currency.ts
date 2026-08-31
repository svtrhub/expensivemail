import { SupportedCurrency, ExchangeRateDatabase } from '../types';

export type { SupportedCurrency, ExchangeRateDatabase };

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  locale: string;
  decimals: number;
  presets: number[];
  flag: string;
  defaultRateToIDR: number; // 1 unit in IDR
}

export const CURRENCIES: Record<SupportedCurrency, CurrencyConfig> = {
  IDR: {
    code: 'IDR',
    symbol: 'Rp',
    name: 'Indonesian Rupiah',
    locale: 'id-ID',
    decimals: 0,
    presets: [10000, 25000, 50000, 100000, 250000, 500000, 1000000],
    flag: '🇮🇩',
    defaultRateToIDR: 1,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US',
    decimals: 2,
    presets: [5, 10, 20, 50, 100, 250, 500],
    flag: '🇺🇸',
    defaultRateToIDR: 16250,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'de-DE',
    decimals: 2,
    presets: [5, 10, 20, 50, 100, 200, 500],
    flag: '🇪🇺',
    defaultRateToIDR: 17550,
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    locale: 'en-SG',
    decimals: 2,
    presets: [5, 10, 25, 50, 100, 250, 500],
    flag: '🇸🇬',
    defaultRateToIDR: 12150,
  },
  MYR: {
    code: 'MYR',
    symbol: 'RM',
    name: 'Malaysian Ringgit',
    locale: 'ms-MY',
    decimals: 2,
    presets: [10, 20, 50, 100, 200, 500],
    flag: '🇲🇾',
    defaultRateToIDR: 3520,
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    locale: 'ja-JP',
    decimals: 0,
    presets: [500, 1000, 2000, 5000, 10000, 20000],
    flag: '🇯🇵',
    defaultRateToIDR: 106.5,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    locale: 'en-GB',
    decimals: 2,
    presets: [5, 10, 20, 50, 100, 200],
    flag: '🇬🇧',
    defaultRateToIDR: 20680,
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    locale: 'en-AU',
    decimals: 2,
    presets: [10, 20, 50, 100, 200, 500],
    flag: '🇦🇺',
    defaultRateToIDR: 10550,
  },
};

export const DEFAULT_EXCHANGE_RATE_DB: ExchangeRateDatabase = {
  baseCurrency: 'IDR',
  ratesToIDR: {
    IDR: 1,
    USD: 16250,
    EUR: 17550,
    SGD: 12150,
    MYR: 3520,
    JPY: 106.5,
    GBP: 20680,
    AUD: 10550,
  },
  ratesFromUSD: {
    USD: 1,
    IDR: 16250,
    EUR: 0.925,
    SGD: 1.337,
    MYR: 4.616,
    JPY: 152.58,
    GBP: 0.785,
    AUD: 1.54,
  },
  lastUpdated: new Date().toISOString(),
  nextUpdateDue: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  updateIntervalMinutes: 15,
  autoUpdateEnabled: true,
  provider: 'Bank Indonesia & Global Forex Market Feed',
};

/**
 * Get exchange rate between any two currencies using the active rate table
 * E.g. getExchangeRateBetween('USD', 'IDR') => 16250
 * E.g. getExchangeRateBetween('IDR', 'USD') => 1 / 16250
 * E.g. getExchangeRateBetween('EUR', 'USD') => 17550 / 16250
 */
export function getExchangeRateBetween(
  fromCurrency: string | undefined | null,
  toCurrency: SupportedCurrency | string | undefined | null,
  ratesToIDR: Record<
    SupportedCurrency,
    number
  > = DEFAULT_EXCHANGE_RATE_DB.ratesToIDR
): number {
  const fromCode = (
    typeof fromCurrency === 'string' ? fromCurrency.toUpperCase() : 'IDR'
  ) as SupportedCurrency;
  const toCode = (
    typeof toCurrency === 'string' ? toCurrency.toUpperCase() : 'IDR'
  ) as SupportedCurrency;

  if (fromCode === toCode) return 1;

  const fromRateToIDR =
    ratesToIDR[fromCode] || CURRENCIES[fromCode]?.defaultRateToIDR || 1;
  const toRateToIDR =
    ratesToIDR[toCode] || CURRENCIES[toCode]?.defaultRateToIDR || 1;

  if (toRateToIDR === 0) return 1;
  return fromRateToIDR / toRateToIDR;
}

/**
 * Convert any amount from one currency to another using the live database exchange rates
 */
export function convertCurrency(
  amount: number | undefined | null,
  fromCurrency: string | undefined | null,
  toCurrency: SupportedCurrency | string | undefined | null,
  ratesToIDR: Record<
    SupportedCurrency,
    number
  > = DEFAULT_EXCHANGE_RATE_DB.ratesToIDR
): number {
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const safeToCurrency = (
    typeof toCurrency === 'string' ? toCurrency.toUpperCase() : 'IDR'
  ) as SupportedCurrency;
  const rate = getExchangeRateBetween(fromCurrency, safeToCurrency, ratesToIDR);
  const converted = num * rate;

  const config = CURRENCIES[safeToCurrency] || CURRENCIES.IDR;
  if (config.decimals === 0) {
    return Math.round(converted);
  }
  return Number(converted.toFixed(config.decimals));
}

/**
 * Format any numerical money amount to the selected currency standard.
 */
export function formatCurrency(
  amount: number | undefined | null,
  currencyCode: SupportedCurrency | string = 'IDR',
  compact = false
): string {
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const safeCode = (
    typeof currencyCode === 'string' ? currencyCode.toUpperCase() : 'IDR'
  ) as SupportedCurrency;
  const config = CURRENCIES[safeCode] || CURRENCIES.IDR;

  if (compact && Math.abs(num) >= 1000000 && safeCode === 'IDR') {
    return `Rp ${(num / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
  }
  if (compact && Math.abs(num) >= 1000 && safeCode === 'IDR') {
    return `Rp ${(num / 1000).toLocaleString('id-ID', { maximumFractionDigits: 0 })} rb`;
  }

  if (compact && Math.abs(num) >= 1000000 && safeCode !== 'IDR') {
    return `${config.symbol}${(num / 1000000).toFixed(1)}M`;
  }
  if (compact && Math.abs(num) >= 1000 && safeCode !== 'IDR') {
    return `${config.symbol}${(num / 1000).toFixed(1)}K`;
  }

  if (safeCode === 'IDR') {
    const formattedNum = Math.round(num).toLocaleString('id-ID');
    return `Rp ${formattedNum}`;
  }

  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    }).format(num);
  } catch {
    return `${config.symbol} ${num.toFixed(config.decimals)}`;
  }
}

/**
 * Format an expense item according to active reporting currency and show original if converted
 */
export function formatConvertedExpense(
  amount: number | undefined | null,
  origCurrency: string | undefined | null,
  activeCurrency: SupportedCurrency,
  ratesToIDR: Record<
    SupportedCurrency,
    number
  > = DEFAULT_EXCHANGE_RATE_DB.ratesToIDR
): {
  formatted: string;
  originalFormatted?: string;
  isConverted: boolean;
  convertedAmount: number;
  rateUsed: number;
} {
  const fromCode = (origCurrency?.toUpperCase() as SupportedCurrency) || 'IDR';
  const isConverted = fromCode !== activeCurrency;
  const rateUsed = getExchangeRateBetween(fromCode, activeCurrency, ratesToIDR);
  const convertedAmount = convertCurrency(
    amount,
    fromCode,
    activeCurrency,
    ratesToIDR
  );
  const formatted = formatCurrency(convertedAmount, activeCurrency);

  let originalFormatted: string | undefined = undefined;
  if (isConverted && amount !== undefined && amount !== null) {
    originalFormatted = formatCurrency(amount, fromCode);
  }

  return {
    formatted,
    originalFormatted,
    isConverted,
    convertedAmount,
    rateUsed,
  };
}

/**
 * Quick preset format for buttons (e.g., "+Rp 50rb" or "+$20")
 */
export function formatPresetLabel(
  val: number,
  currencyCode: SupportedCurrency = 'IDR'
): string {
  if (currencyCode === 'IDR') {
    if (val >= 1000000) return `+${val / 1000000} jt`;
    if (val >= 1000) return `+${val / 1000} rb`;
    return `+${val}`;
  }
  const config = CURRENCIES[currencyCode] || CURRENCIES.USD;
  return `+${config.symbol}${val}`;
}

/**
 * Fetch live rates from the backend API
 */
export async function fetchLiveExchangeRates(): Promise<ExchangeRateDatabase> {
  try {
    const res = await fetch('/api/exchange-rates');
    if (res.ok) {
      const data = await res.json();
      if (data && data.ratesToIDR) {
        return {
          baseCurrency: data.baseCurrency || 'IDR',
          ratesToIDR: data.ratesToIDR,
          ratesFromUSD:
            data.ratesFromUSD || DEFAULT_EXCHANGE_RATE_DB.ratesFromUSD,
          lastUpdated: data.lastUpdated || new Date().toISOString(),
          nextUpdateDue:
            data.nextUpdateDue ||
            new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          updateIntervalMinutes: data.updateIntervalMinutes || 15,
          autoUpdateEnabled: true,
          provider: data.provider || 'Bank Indonesia & Global Forex Matrix',
        };
      }
    }
  } catch (e) {
    console.warn(
      'Could not fetch exchange rates from server, using local database cache:',
      e
    );
  }
  return DEFAULT_EXCHANGE_RATE_DB;
}

/**
 * Force refresh exchange rates from the backend API
 */
export async function refreshLiveExchangeRatesNow(): Promise<ExchangeRateDatabase> {
  try {
    const res = await fetch('/api/exchange-rates/refresh', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.ratesToIDR) {
        return {
          baseCurrency: data.baseCurrency || 'IDR',
          ratesToIDR: data.ratesToIDR,
          ratesFromUSD:
            data.ratesFromUSD || DEFAULT_EXCHANGE_RATE_DB.ratesFromUSD,
          lastUpdated: data.lastUpdated || new Date().toISOString(),
          nextUpdateDue:
            data.nextUpdateDue ||
            new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          updateIntervalMinutes: data.updateIntervalMinutes || 15,
          autoUpdateEnabled: true,
          provider: data.provider || 'Bank Indonesia & Global Forex Matrix',
        };
      }
    }
  } catch (e) {
    console.warn('Could not refresh exchange rates from server:', e);
  }
  return DEFAULT_EXCHANGE_RATE_DB;
}
