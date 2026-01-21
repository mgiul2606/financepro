// features/budgets/budgets.constants.ts

/**
 * Budget period type options for UI selects
 * Uses i18n keys for localized labels
 */
export const PERIOD_TYPE_OPTIONS = [
  { value: 'monthly', label: 'budgets.periods.monthly' },
  { value: 'quarterly', label: 'budgets.periods.quarterly' },
  { value: 'yearly', label: 'budgets.periods.yearly' },
  { value: 'custom', label: 'budgets.periods.custom' },
] as const;

/**
 * Budget category options for UI selects
 * Uses i18n keys for localized labels
 */
export const BUDGET_CATEGORY_OPTIONS = [
  { value: 'Groceries', label: 'budgets.categories.groceries' },
  { value: 'Transportation', label: 'budgets.categories.transportation' },
  { value: 'Entertainment', label: 'budgets.categories.entertainment' },
  { value: 'Healthcare', label: 'budgets.categories.healthcare' },
  { value: 'Shopping', label: 'budgets.categories.shopping' },
  { value: 'Dining', label: 'budgets.categories.dining' },
  { value: 'Utilities', label: 'budgets.categories.utilities' },
  { value: 'Housing', label: 'budgets.categories.housing' },
  { value: 'Other', label: 'budgets.categories.other' },
] as const;

/**
 * Default alert threshold percentage for budget warnings
 */
export const DEFAULT_ALERT_THRESHOLD = 80;

/**
 * Budget status values
 */
export const BUDGET_STATUS = {
  ON_TRACK: 'on_track',
  WARNING: 'warning',
  EXCEEDED: 'exceeded',
} as const;

/**
 * Budget status threshold percentages
 */
export const BUDGET_STATUS_THRESHOLDS = {
  WARNING: 80,
  EXCEEDED: 100,
} as const;
