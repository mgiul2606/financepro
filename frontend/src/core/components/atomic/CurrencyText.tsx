// core/components/atomic/CurrencyText.tsx
import { formatCurrency, formatCompactCurrency, type SupportedCurrency, type SupportedLocale } from '@/utils/currency';
import { usePreferences } from '@/contexts/PreferencesContext';

export interface CurrencyTextProps {
  /**
   * The numeric value to format as currency
   */
  value: number | string;

  /**
   * Currency code (optional, defaults to user preference)
   */
  currency?: SupportedCurrency;

  /**
   * Locale for formatting (optional, defaults to user preference)
   */
  locale?: SupportedLocale;

  /**
   * Whether to use compact format (e.g., €1.2K instead of €1,200)
   */
  compact?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Custom Intl.NumberFormatOptions
   */
  options?: Intl.NumberFormatOptions;

  /**
   * Whether to show positive values with + sign
   */
  showSign?: boolean;

  /**
   * Color coding based on value (positive = green, negative = red)
   */
  colorCoded?: boolean;
}

/**
 * CurrencyText Component
 *
 * A reusable component for displaying currency values with proper localization.
 * Automatically uses user preferences for currency and locale unless overridden.
 *
 * @example
 * ```tsx
 * // Basic usage (uses user preferences)
 * <CurrencyText value={1250.50} />
 *
 * // With specific currency
 * <CurrencyText value={1250.50} currency="USD" />
 *
 * // Compact format
 * <CurrencyText value={125000} compact />
 *
 * // Color coded
 * <CurrencyText value={-500} colorCoded />
 * ```
 */
export const CurrencyText: React.FC<CurrencyTextProps> = ({
  value,
  currency,
  locale,
  compact = false,
  className = '',
  options,
  showSign = false,
  colorCoded = false,
}) => {
  const { preferences } = usePreferences();

  // Use provided currency/locale or fall back to user preferences
  const effectiveCurrency = currency || preferences.currency;
  const effectiveLocale = locale || preferences.locale;

  // Format the currency
  const formattedValue = compact
    ? formatCompactCurrency(value, effectiveCurrency, effectiveLocale)
    : formatCurrency(value, effectiveCurrency, effectiveLocale, options);

  // Determine numeric value for sign and color
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const isPositive = numValue > 0;
  const isNegative = numValue < 0;

  // Build CSS classes
  let cssClasses = className;

  if (colorCoded) {
    if (isPositive) {
      cssClasses += ' text-green-600';
    } else if (isNegative) {
      cssClasses += ' text-red-600';
    } else {
      cssClasses += ' text-gray-600';
    }
  }

  // Add sign if requested
  const displayValue = showSign && isPositive && !formattedValue.startsWith('+')
    ? `+${formattedValue}`
    : formattedValue;

  return <span className={cssClasses}>{displayValue}</span>;
};
