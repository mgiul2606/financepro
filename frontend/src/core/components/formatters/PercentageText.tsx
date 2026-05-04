// core/components/atomic/PercentageText.tsx
import { formatPercentage, type SupportedLocale } from '@/utils/currency';
import { usePreferences } from '@/contexts/PreferencesContext';

export interface PercentageTextProps {
  /**
   * The numeric value to format as percentage (e.g., 25 for 25%)
   */
  value: number | string;

  /**
   * Locale for formatting (optional, defaults to user preference)
   */
  locale?: SupportedLocale;

  /**
   * Number of decimal places (default: 1)
   */
  decimals?: number;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Whether to show positive values with + sign
   */
  showSign?: boolean;

  /**
   * Color coding based on value (positive = green, negative = red)
   */
  colorCoded?: boolean;

  /**
   * Invert color coding (negative = green, positive = red)
   * Useful for expense percentages where lower is better
   */
  invertColors?: boolean;
}

/**
 * PercentageText Component
 *
 * A reusable component for displaying percentage values with proper localization.
 * Automatically uses user preferences for locale unless overridden.
 *
 * @example
 * ```tsx
 * // Basic usage (uses user preferences)
 * <PercentageText value={25.5} />
 *
 * // With specific decimals
 * <PercentageText value={25.5} decimals={2} />
 *
 * // Color coded
 * <PercentageText value={-10} colorCoded />
 *
 * // Inverted colors (for expense percentages)
 * <PercentageText value={15} colorCoded invertColors />
 * ```
 */
export const PercentageText: React.FC<PercentageTextProps> = ({
  value,
  locale,
  decimals = 1,
  className = '',
  showSign = false,
  colorCoded = false,
  invertColors = false,
}) => {
  const { preferences } = usePreferences();

  // Use provided locale or fall back to user preferences
  const effectiveLocale = locale || preferences.locale;

  // Format the percentage
  const formattedValue = formatPercentage(value, effectiveLocale, decimals);

  // Determine numeric value for sign and color
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const isPositive = numValue > 0;
  const isNegative = numValue < 0;

  // Build CSS classes
  let cssClasses = className;

  if (colorCoded) {
    const shouldBeGreen = invertColors ? isNegative : isPositive;
    const shouldBeRed = invertColors ? isPositive : isNegative;

    if (shouldBeGreen) {
      cssClasses += ' text-green-600';
    } else if (shouldBeRed) {
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
