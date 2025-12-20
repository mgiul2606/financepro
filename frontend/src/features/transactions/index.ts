// features/transactions/index.ts
/**
 * Public API for transactions feature
 * Exports components, hooks, types, schemas, and API functions
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
  useTransaction,
  useTransactionStats,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from './transactions.hooks';

// API functions - Now using Orval-generated hooks directly
// To use API functions directly, import from '@/api/generated/transactions/transactions'

// Schemas
export {
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

// Types
export type {
  TransactionCreate,
  TransactionUpdate,
  TransactionResponse,
  Transaction,
  TransactionList,
  TransactionStats,
  TransactionFilters,
  TransactionType,
  TransactionSource,
  Currency,
} from './transactions.types';

// Constants and type guards
export {
  TRANSACTION_TYPE_OPTIONS,
  TRANSACTION_SOURCE_OPTIONS,
  isTransactionStats,
  isTransactionList,
} from './transactions.types';
