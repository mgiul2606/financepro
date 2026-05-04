// core/components/atomic/NumberText.tsx
import { formatNumber, formatCompactNumber, formatNumberWithDecimals, type SupportedLocale } from '@/utils/currency';
import { usePreferences } from '@/contexts/PreferencesContext';

export interface NumberTextProps {
  /**
   * The numeric value to format
   */
  value: number | string;

  /**
   * Locale for formatting (optional, defaults to user preference)
   */
  locale?: SupportedLocale;

  /**
   * Whether to use compact format (e.g., 1.2K instead of 1,200)
   */
  compact?: boolean;

  /**
   * Number of decimal places (default: 2)
   */
  decimals?: number;

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
 * NumberText Component
 *
 * A reusable component for displaying numeric values with proper localization.
 * Automatically uses user preferences for locale unless overridden.
 *
 * @example
 * ```tsx
 * // Basic usage (uses user preferences)
 * <NumberText value={1250.50} />
 *
 * // With specific decimals
 * <NumberText value={1250.50} decimals={0} />
 *
 * // Compact format
 * <NumberText value={125000} compact />
 *
 * // Color coded
 * <NumberText value={-500} colorCoded />
 * ```
 */
export const NumberText: React.FC<NumberTextProps> = ({
  value,
  locale,
  compact = false,
  decimals = 2,
  className = '',
  options,
  showSign = false,
  colorCoded = false,
}) => {
  const { preferences } = usePreferences();

  // Use provided locale or fall back to user preferences
  const effectiveLocale = locale || preferences.locale;

  // Format the number
  let formattedValue: string;
  if (compact) {
    formattedValue = formatCompactNumber(value, effectiveLocale);
  } else if (options) {
    formattedValue = formatNumber(value, effectiveLocale, options);
  } else {
    formattedValue = formatNumberWithDecimals(value, decimals, effectiveLocale);
  }

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
