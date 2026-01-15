// features/transactions/index.ts
/**
 * Public API for transactions feature
 * Exports components, hooks, types, schemas, and constants
 *
 * Architecture follows the same pattern as features/accounts
 */

// Pages
export { TransactionsPage } from './pages/TransactionsPage';

// Components
export { TransactionForm } from './components/TransactionForm';
export { TransactionFilterModal } from './components/TransactionFilterModal';
export { TransactionExportModal } from './components/TransactionExportModal';

// Hooks
export {
  useTransactions,
  useTransactionsWithUIFilters,
  useTransaction,
  useTransactionStats,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from './transactions.hooks';

// Schemas
export {
  transactionCreateSchema,
  transactionUpdateSchema,
  transactionResponseSchema,
  transactionListSchema,
  transactionFiltersSchema,
  transactionUIFiltersSchema,
  transactionStatsSchema,
  transactionTypeSchema,
  transactionSourceSchema,
  currencySchema,
} from './transactions.schemas';

// Types - Re-exported from transactions.types (which re-exports Orval types)
export type {
  // API types (from Orval via transactions.types)
  TransactionCreate,
  TransactionUpdate,
  TransactionResponse,
  TransactionListResponse,
  Transaction,
  // Zod-derived types
  TransactionList,
  TransactionStats,
  TransactionFilters,
  TransactionUIFilters,
  TransactionType,
  TransactionSource,
  Currency,
} from './transactions.types';

// Type guards
export { isTransactionStats, isTransactionList } from './transactions.types';

// Constants
export {
  CURRENCY_OPTIONS,
  TRANSACTION_TYPE_OPTIONS,
  TRANSACTION_SOURCE_OPTIONS,
} from './transactions.constants';
