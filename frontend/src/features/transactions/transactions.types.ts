import { z } from 'zod';
import {
  transactionListSchema,
  transactionFiltersSchema,
  transactionUIFiltersSchema,
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
 * are imported from Orval-generated models for API compatibility.
 * Only UI-specific types are defined here.
 */

// Re-export API types from Orval for convenience
export type {
  TransactionCreate,
  TransactionUpdate,
  TransactionResponse,
  TransactionListResponse,
} from '@/api/generated/models';

// Alias: Transaction = TransactionResponse (for backward compatibility)
export type { TransactionResponse as Transaction } from '@/api/generated/models';

// Query/Filter types (API-aligned)
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;

// UI Filter types (extended for multi-select in components)
export type TransactionUIFilters = z.infer<typeof transactionUIFiltersSchema>;

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
  const parsed = transactionStatsSchema.safeParse(data);
  return parsed.success;
}

export function isTransactionList(data: unknown): data is TransactionList {
  return (
    typeof data === 'object' &&
    data !== null &&
    'items' in data &&
    Array.isArray((data as Record<string, unknown>).items)
  );
}
