import { z } from 'zod';
import {
  transactionCreateSchema,
  transactionUpdateSchema,
  transactionResponseSchema,
  transactionListSchema,
  transactionFiltersSchema,
  transactionStatsSchema,
  transactionTypeSchema,
  transactionSourceSchema,
  currencySchema,
} from './transactions.schemas';

/**
 * Type definitions derived from Zod schemas
 */

// Request types (input)
export type TransactionCreate = z.infer<typeof transactionCreateSchema>;
export type TransactionUpdate = z.infer<typeof transactionUpdateSchema>;
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;

// Response types (output)
export type TransactionResponse = z.infer<typeof transactionResponseSchema>;
export type Transaction = TransactionResponse; // Alias for convenience
export type TransactionList = z.infer<typeof transactionListSchema>;
export type TransactionStats = z.infer<typeof transactionStatsSchema>;

// Utility types
export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type TransactionSource = z.infer<typeof transactionSourceSchema>;
export type Currency = z.infer<typeof currencySchema>;

/**
 * Transaction type options for UI select components
 */
export const TRANSACTION_TYPE_OPTIONS = [
  'bank_transfer',
  'withdrawal',
  'payment',
  'purchase',
  'internal_transfer',
  'income',
  'salary',
  'invoice',
  'asset_purchase',
  'asset_sale',
  'dividend',
  'interest',
  'loan_payment',
  'refund',
  'fee',
  'tax',
  'other',
] as const;

/**
 * Transaction source options
 */
export const TRANSACTION_SOURCE_OPTIONS = [
  'manual',
  'import_csv',
  'bank_api',
  'ai_classified',
] as const;

/**
 * Helper type guards
 */
export function isTransactionStats(data: unknown): data is TransactionStats {
  return (
    typeof data === 'object' &&
    data !== null &&
    'totalIncome' in data &&
    'totalExpenses' in data &&
    'netBalance' in data
  );
}

export function isTransactionList(data: unknown): data is TransactionList {
  return (
    typeof data === 'object' &&
    data !== null &&
    'items' in data &&
    Array.isArray((data as any).items)
  );
}
