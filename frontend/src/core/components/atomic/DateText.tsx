// core/components/atomic/DateText.tsx
import {
  formatDate,
  formatDateTime,
  formatTime,
  formatDateRange,
  formatRelativeTime,
  type SupportedLocale
} from '@/utils/currency';
import { usePreferences } from '@/contexts/PreferencesContext';

export type DateFormat = 'date' | 'datetime' | 'time' | 'relative';

export interface DateTextProps {
  /**
   * The date value to format
   */
  value: Date | string;

  /**
   * Format type: date, datetime, time, or relative
   */
  format?: DateFormat;

  /**
   * Locale for formatting (optional, defaults to user preference)
   */
  locale?: SupportedLocale;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Custom Intl.DateTimeFormatOptions (not used for relative format)
   */
  options?: Intl.DateTimeFormatOptions;
}

export interface DateRangeTextProps {
  /**
   * Start date of the range
   */
  startDate: Date | string;

  /**
   * End date of the range
   */
  endDate: Date | string;

  /**
   * Locale for formatting (optional, defaults to user preference)
   */
  locale?: SupportedLocale;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * DateText Component
 *
 * A reusable component for displaying date values with proper localization.
 * Automatically uses user preferences for locale unless overridden.
 *
 * @example
 * ```tsx
 * // Basic date (uses user preferences)
 * <DateText value={new Date()} />
 *
 * // DateTime format
 * <DateText value={new Date()} format="datetime" />
 *
 * // Time only
 * <DateText value={new Date()} format="time" />
 *
 * // Relative time
 * <DateText value={new Date(Date.now() - 3600000)} format="relative" />
 * ```
 */
export const DateText: React.FC<DateTextProps> = ({
  value,
  format = 'date',
  locale,
  className = '',
  options,
}) => {
  const { preferences } = usePreferences();

  // Use provided locale or fall back to user preferences
  const effectiveLocale = locale || preferences.locale;

  // Format the date based on the specified format
  let formattedValue: string;

  switch (format) {
    case 'datetime':
      formattedValue = formatDateTime(value, effectiveLocale, options);
      break;
    case 'time':
      formattedValue = formatTime(value, effectiveLocale, options);
      break;
    case 'relative':
      formattedValue = formatRelativeTime(value, effectiveLocale);
      break;
    case 'date':
    default:
      formattedValue = formatDate(value, effectiveLocale, options);
      break;
  }

  return <span className={className}>{formattedValue}</span>;
};

/**
 * DateRangeText Component
 *
 * A reusable component for displaying date ranges with proper localization.
 * Automatically uses user preferences for locale unless overridden.
 *
 * @example
 * ```tsx
 * // Date range
 * <DateRangeText
 *   startDate={new Date('2025-01-01')}
 *   endDate={new Date('2025-01-31')}
 * />
 * ```
 */
export const DateRangeText: React.FC<DateRangeTextProps> = ({
  startDate,
  endDate,
  locale,
  className = '',
}) => {
  const { preferences } = usePreferences();

  // Use provided locale or fall back to user preferences
  const effectiveLocale = locale || preferences.locale;

  // Format the date range
  const formattedValue = formatDateRange(startDate, endDate, effectiveLocale);

  return <span className={className}>{formattedValue}</span>;
};
