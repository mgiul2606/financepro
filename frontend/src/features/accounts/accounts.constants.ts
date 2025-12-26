// features/accounts/accounts.constants.ts

/**
 * Available currency options for accounts
 */
export const CURRENCY_OPTIONS = [
  { value: 'EUR', label: 'settings.currencies.EUR' },
  { value: 'USD', label: 'settings.currencies.USD' },
  { value: 'GBP', label: 'settings.currencies.GBP' },
  { value: 'CHF', label: 'settings.currencies.CHF' },
  { value: 'JPY', label: 'settings.currencies.JPY' },
] as const;

/**
 * Available account type options
 */
export const ACCOUNT_TYPE_OPTIONS = [
  { value: 'checking', label: 'accounts.types.checking' },
  { value: 'savings', label: 'accounts.types.savings' },
  { value: 'credit_card', label: 'accounts.types.credit_card' },
  { value: 'investment', label: 'accounts.types.investment' },
  { value: 'cash', label: 'accounts.types.cash' },
  { value: 'loan', label: 'accounts.types.loan' },
  { value: 'mortgage', label: 'accounts.types.mortgage' },
  { value: 'other', label: 'accounts.types.other' },
] as const;
