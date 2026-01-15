/**
 * Transaction schemas with runtime validation using Zod
 *
 * Bridges Orval-generated schemas with application-specific needs.
 * Follows the same pattern as accounts.schemas.ts.
 */
import { z } from 'zod';
import { TransactionType, TransactionSource } from '@/api/generated/models';

// Import auto-generated Zod schemas from Orval
import {
  createTransactionApiV1TransactionsPostBody,
  updateTransactionApiV1TransactionsTransactionIdPatchBody,
  getTransactionApiV1TransactionsTransactionIdGetResponse,
  listTransactionsApiV1TransactionsGetResponse,
  getTransactionStatsApiV1TransactionsStatsGetResponse,
} from '@/api/generated/zod/transactions/transactions.zod';

/**
 * Transaction Type Enum Schema
 */
export const transactionTypeSchema = z.enum([
  TransactionType.BankTransfer,
  TransactionType.Withdrawal,
  TransactionType.Payment,
  TransactionType.Purchase,
  TransactionType.InternalTransfer,
  TransactionType.Income,
  TransactionType.Salary,
  TransactionType.Invoice,
  TransactionType.AssetPurchase,
  TransactionType.AssetSale,
  TransactionType.Dividend,
  TransactionType.Interest,
  TransactionType.LoanPayment,
  TransactionType.Refund,
  TransactionType.Fee,
  TransactionType.Tax,
  TransactionType.Other,
]);

/**
 * Transaction Source Enum Schema
 */
export const transactionSourceSchema = z.enum([
  TransactionSource.Manual,
  TransactionSource.ImportCsv,
  TransactionSource.ImportOcr,
  TransactionSource.ImportApi,
  TransactionSource.BankSync,
  TransactionSource.Recurring,
]);

/**
 * Currency Schema - ISO 4217
 */
export const currencySchema = z
  .string()
  .length(3, 'Currency must be exactly 3 characters')
  .regex(/^[A-Z]{3}$/, 'Currency must be 3 uppercase letters (e.g., EUR, USD)')
  .default('EUR');

/**
 * Transaction Create Schema
 * Base schema from Orval
 */
export const transactionCreateSchema = createTransactionApiV1TransactionsPostBody;

/**
 * Transaction Update Schema
 * Base schema from Orval for partial updates
 */
export const transactionUpdateSchema = updateTransactionApiV1TransactionsTransactionIdPatchBody;

/**
 * Transaction Response Schema
 */
export const transactionResponseSchema = getTransactionApiV1TransactionsTransactionIdGetResponse;

/**
 * Transaction List Response Schema
 */
export const transactionListSchema = listTransactionsApiV1TransactionsGetResponse;

/**
 * Transaction Stats Schema
 */
export const transactionStatsSchema = getTransactionStatsApiV1TransactionsStatsGetResponse;

/**
 * Transaction Filters Schema (API-aligned)
 * Matches the ListTransactionsApiV1TransactionsGetParams from Orval
 */
export const transactionFiltersSchema = z.object({
  profileId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  skip: z.number().int().min(0).default(0).optional(),
  limit: z.number().int().min(1).max(1000).default(20).optional(),
});

/**
 * Transaction UI Filters Schema
 * Extended schema for UI components that support multi-select filters.
 * Used by TransactionFilterModal.tsx
 *
 * Note: types[] and categories[] are UI-only fields that get converted
 * to API-compatible params in the hook layer.
 */
export const transactionUIFiltersSchema = z.object({
  // Date range
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  // Amount range (UI-only, filtered client-side)
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  // Multi-select arrays for UI
  types: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  // Single values
  merchantName: z.string().optional(),
  accountId: z.string().uuid().optional(),
  // Allowed accounts constraint (for account-scoped views)
  allowedAccounts: z.array(z.string().uuid()).optional(),
});
