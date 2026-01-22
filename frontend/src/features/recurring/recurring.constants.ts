/**
 * Constants for recurring transactions feature
 */

/**
 * Available frequency options for recurring transactions
 */
export const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'recurring.frequency.daily' },
  { value: 'weekly', label: 'recurring.frequency.weekly' },
  { value: 'biweekly', label: 'recurring.frequency.biweekly' },
  { value: 'monthly', label: 'recurring.frequency.monthly' },
  { value: 'quarterly', label: 'recurring.frequency.quarterly' },
  { value: 'semiannually', label: 'recurring.frequency.semiannually' },
  { value: 'yearly', label: 'recurring.frequency.yearly' },
  { value: 'custom', label: 'recurring.frequency.custom' },
] as const;

/**
 * Available amount model options for recurring transactions
 */
export const AMOUNT_MODEL_OPTIONS = [
  { value: 'fixed', label: 'recurring.amountModel.fixed' },
  { value: 'variable_within_range', label: 'recurring.amountModel.variable' },
  { value: 'progressive', label: 'recurring.amountModel.progressive' },
  { value: 'seasonal', label: 'recurring.amountModel.seasonal' },
  { value: 'formula', label: 'recurring.amountModel.formula' },
] as const;

/**
 * Available occurrence status options
 */
export const OCCURRENCE_STATUS_OPTIONS = [
  { value: 'pending', label: 'recurring.occurrenceStatus.pending' },
  { value: 'executed', label: 'recurring.occurrenceStatus.executed' },
  { value: 'skipped', label: 'recurring.occurrenceStatus.skipped' },
  { value: 'overridden', label: 'recurring.occurrenceStatus.overridden' },
  { value: 'failed', label: 'recurring.occurrenceStatus.failed' },
] as const;

/**
 * Transaction type options
 */
export const TRANSACTION_TYPE_OPTIONS = [
  { value: 'income', label: 'recurring.transactionType.income' },
  { value: 'expense', label: 'recurring.transactionType.expense' },
] as const;

/**
 * Available currency options (same as accounts)
 */
export const CURRENCY_OPTIONS = [
  { value: 'EUR', label: 'settings.currencies.EUR' },
  { value: 'USD', label: 'settings.currencies.USD' },
  { value: 'GBP', label: 'settings.currencies.GBP' },
  { value: 'CHF', label: 'settings.currencies.CHF' },
  { value: 'JPY', label: 'settings.currencies.JPY' },
] as const;

/**
 * Default values for new recurring transactions
 */
export const RECURRING_DEFAULTS = {
  currency: 'EUR',
  frequency: 'monthly',
  interval: 1,
  amountModel: 'fixed',
  isActive: true,
  autoCreate: false,
  transactionType: 'expense',
} as const;

/**
 * Frequency to days mapping for monthly equivalent calculations
 */
export const FREQUENCY_DAYS: Record<string, number> = {
  daily: 1,
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  quarterly: 91,
  semiannually: 182,
  yearly: 365,
  custom: 30, // Default to monthly for custom
};
