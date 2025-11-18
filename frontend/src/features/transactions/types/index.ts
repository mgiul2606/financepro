/**
 * Transaction Types - Re-export from generated API types
 * This ensures consistency with the backend API
 */

// Re-export types from generated API
export type {
  TransactionResponse as Transaction,
  TransactionCreate,
  TransactionUpdate,
  TransactionListResponse,
  TransactionType,
  TransactionSource,
  ListTransactionsApiV1TransactionsGetParams as TransactionFilters,
} from '@/api/generated/models';
