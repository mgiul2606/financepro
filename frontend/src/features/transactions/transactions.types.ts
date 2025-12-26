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
 * These ensure type safety across the application
 *
 * Note: TransactionCreate, TransactionUpdate, and TransactionResponse
 * are now imported from Orval-generated models for API compatibility.
 * Only UI-specific types are defined here.
 */

// Query/Filter types
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;

// Response types (output) - for lists and aggregations
export type TransactionList = z.infer<typeof transactionListSchema>;
export type TransactionStats = z.infer<typeof transactionStatsSchema>;

// Utility types
export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type TransactionSource = z.infer<typeof transactionSourceSchema>;
export type Currency = z.infer<typeof currencySchema>;

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
    Array.isArray((data as Record<string, unknown>).items)
  );
}
