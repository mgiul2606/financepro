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

  // Sanitize fraction digits options to valid range (0-20)
  // and ensure minimumFractionDigits <= maximumFractionDigits
  let sanitizedOptions: Intl.NumberFormatOptions | undefined;

  if (options) {
    const minDigits = options.minimumFractionDigits !== undefined
      ? Math.max(0, Math.min(20, options.minimumFractionDigits))
      : undefined;
    const maxDigits = options.maximumFractionDigits !== undefined
      ? Math.max(0, Math.min(20, options.maximumFractionDigits))
      : undefined;

    // Determine final values ensuring min <= max
    let finalMin = minDigits;
    let finalMax = maxDigits;

    if (finalMax !== undefined && finalMin === undefined) {
      // Only max specified: set min to not exceed max
      finalMin = Math.min(2, finalMax);
    } else if (finalMin !== undefined && finalMax === undefined) {
      // Only min specified: set max to not be less than min
      finalMax = Math.max(2, finalMin);
    }

    sanitizedOptions = {
      ...options,
      ...(finalMin !== undefined && { minimumFractionDigits: finalMin }),
      ...(finalMax !== undefined && { maximumFractionDigits: finalMax }),
    };
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...sanitizedOptions,
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

  // Sanitize fraction digits options to valid range (0-20)
  // and ensure minimumFractionDigits <= maximumFractionDigits
  let sanitizedOptions: Intl.NumberFormatOptions | undefined;

  if (options) {
    const minDigits = options.minimumFractionDigits !== undefined
      ? Math.max(0, Math.min(20, options.minimumFractionDigits))
      : undefined;
    const maxDigits = options.maximumFractionDigits !== undefined
      ? Math.max(0, Math.min(20, options.maximumFractionDigits))
      : undefined;

    // Determine final values ensuring min <= max
    let finalMin = minDigits;
    let finalMax = maxDigits;

    if (finalMax !== undefined && finalMin === undefined) {
      // Only max specified: set min to not exceed max
      finalMin = Math.min(2, finalMax);
    } else if (finalMin !== undefined && finalMax === undefined) {
      // Only min specified: set max to not be less than min
      finalMax = Math.max(2, finalMin);
    }

    sanitizedOptions = {
      ...options,
      ...(finalMin !== undefined && { minimumFractionDigits: finalMin }),
      ...(finalMax !== undefined && { maximumFractionDigits: finalMax }),
    };
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...sanitizedOptions,
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

/**
 * Format time only
 */
export const formatTime = (
  date: Date | string,
  locale: SupportedLocale = 'en-US',
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(dateObj);
};

/**
 * Format date range
 */
export const formatDateRange = (
  startDate: Date | string,
  endDate: Date | string,
  locale: SupportedLocale = 'en-US'
): string => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  const formatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
};

/**
 * Format relative time (e.g., "2 days ago", "in 3 hours")
 */
export const formatRelativeTime = (
  date: Date | string,
  locale: SupportedLocale = 'en-US'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  // Define time units in seconds
  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;

  if (Math.abs(diffInSeconds) < minute) {
    return rtf.format(-diffInSeconds, 'second');
  } else if (Math.abs(diffInSeconds) < hour) {
    return rtf.format(-Math.floor(diffInSeconds / minute), 'minute');
  } else if (Math.abs(diffInSeconds) < day) {
    return rtf.format(-Math.floor(diffInSeconds / hour), 'hour');
  } else if (Math.abs(diffInSeconds) < week) {
    return rtf.format(-Math.floor(diffInSeconds / day), 'day');
  } else if (Math.abs(diffInSeconds) < month) {
    return rtf.format(-Math.floor(diffInSeconds / week), 'week');
  } else if (Math.abs(diffInSeconds) < year) {
    return rtf.format(-Math.floor(diffInSeconds / month), 'month');
  } else {
    return rtf.format(-Math.floor(diffInSeconds / year), 'year');
  }
};

/**
 * Format a number with custom decimal places
 */
export const formatNumberWithDecimals = (
  value: number | string,
  decimals: number = 2,
  locale: SupportedLocale = 'en-US'
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return '-';
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue);
};
