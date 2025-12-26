// features/transactions/transactions.constants.ts

/**
 * Available currency options for transactions
 */
export const CURRENCY_OPTIONS = [
  { value: 'EUR', label: 'settings.currencies.EUR' },
  { value: 'USD', label: 'settings.currencies.USD' },
  { value: 'GBP', label: 'settings.currencies.GBP' },
  { value: 'CHF', label: 'settings.currencies.CHF' },
  { value: 'JPY', label: 'settings.currencies.JPY' },
] as const;

/**
 * Available transaction type options
 */
export const TRANSACTION_TYPE_OPTIONS = [
  { value: 'income', label: 'transactions.types.income' },
  { value: 'salary', label: 'transactions.types.salary' },
  { value: 'dividend', label: 'transactions.types.dividend' },
  { value: 'interest', label: 'transactions.types.interest' },
  { value: 'refund', label: 'transactions.types.refund' },
  { value: 'purchase', label: 'transactions.types.purchase' },
  { value: 'payment', label: 'transactions.types.payment' },
  { value: 'withdrawal', label: 'transactions.types.withdrawal' },
  { value: 'bank_transfer', label: 'transactions.types.bank_transfer' },
  { value: 'internal_transfer', label: 'transactions.types.internal_transfer' },
  { value: 'fee', label: 'transactions.types.fee' },
  { value: 'tax', label: 'transactions.types.tax' },
  { value: 'loan_payment', label: 'transactions.types.loan_payment' },
  { value: 'invoice', label: 'transactions.types.invoice' },
  { value: 'asset_purchase', label: 'transactions.types.asset_purchase' },
  { value: 'asset_sale', label: 'transactions.types.asset_sale' },
  { value: 'other', label: 'transactions.types.other' },
] as const;

/**
 * Available transaction source options
 */
export const TRANSACTION_SOURCE_OPTIONS = [
  { value: 'manual', label: 'transactions.sources.manual' },
  { value: 'import_csv', label: 'transactions.sources.import_csv' },
  { value: 'bank_api', label: 'transactions.sources.bank_api' },
  { value: 'ai_classified', label: 'transactions.sources.ai_classified' },
] as const;
