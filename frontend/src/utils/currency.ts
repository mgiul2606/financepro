// utils/currency.ts
/**
 * Currency and number formatting utilities
 * Provides consistent formatting across the application with i18n support
 */

export type SupportedLocale = 'en-US' | 'en-GB' | 'it-IT' | 'de-DE' | 'fr-FR' | 'es-ES';
export type SupportedCurrency = 'EUR' | 'USD' | 'GBP' | 'CHF' | 'JPY';

/**
 * Format a number as currency
 */
export const formatCurrency = (
  value: number | string,
  currency: SupportedCurrency = 'EUR',
  locale: SupportedLocale = 'en-US',
  options?: Intl.NumberFormatOptions
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return '-';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(numValue);
};

/**
 * Format a number without currency symbol
 */
export const formatNumber = (
  value: number | string,
  locale: SupportedLocale = 'en-US',
  options?: Intl.NumberFormatOptions
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return '-';
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(numValue);
};

/**
 * Format a percentage
 */
export const formatPercentage = (
  value: number | string,
  locale: SupportedLocale = 'en-US',
  decimals: number = 1
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return '-';
  }

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue / 100);
};

/**
 * Parse a currency string to a number
 */
export const parseCurrency = (value: string): number => {
  // Remove currency symbols and spaces
  const cleaned = value.replace(/[^\d.,-]/g, '');

  // Handle different decimal separators
  const normalized = cleaned.replace(',', '.');

  return parseFloat(normalized) || 0;
};

/**
 * Get currency symbol for a given currency code
 */
export const getCurrencySymbol = (
  currency: SupportedCurrency,
  locale: SupportedLocale = 'en-US'
): string => {
  return (0)
    .toLocaleString(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    .replace(/\d/g, '')
    .trim();
};

/**
 * Format a compact number (e.g., 1000 -> 1K)
 */
export const formatCompactNumber = (
  value: number | string,
  locale: SupportedLocale = 'en-US'
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return '-';
  }

  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(numValue);
};

/**
 * Format a compact currency (e.g., 1000 EUR -> €1K)
 */
export const formatCompactCurrency = (
  value: number | string,
  currency: SupportedCurrency = 'EUR',
  locale: SupportedLocale = 'en-US'
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return '-';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(numValue);
};

/**
 * Get locale from language code
 */
export const getLocaleFromLanguage = (language: string): SupportedLocale => {
  const localeMap: Record<string, SupportedLocale> = {
    en: 'en-US',
    it: 'it-IT',
    de: 'de-DE',
    fr: 'fr-FR',
    es: 'es-ES',
  };

  return localeMap[language] || 'en-US';
};

/**
 * Format date with locale
 */
export const formatDate = (
  date: Date | string,
  locale: SupportedLocale = 'en-US',
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(dateObj);
};

/**
 * Format date and time with locale
 */
export const formatDateTime = (
  date: Date | string,
  locale: SupportedLocale = 'en-US',
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(dateObj);
};
