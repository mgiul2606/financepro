/**
 * API wrapper functions for Transaction endpoints
 * Provides type-safe, validated API calls using Zod schemas
 */
import {
  listTransactionsApiV1TransactionsGet,
  getTransactionApiV1TransactionsTransactionIdGet,
  createTransactionApiV1TransactionsPost,
  updateTransactionApiV1TransactionsTransactionIdPatch,
  deleteTransactionApiV1TransactionsTransactionIdDelete,
  getTransactionStatsApiV1TransactionsStatsGet,
} from '@/api/generated/transactions/transactions';

import {
  transactionCreateSchema,
  transactionUpdateSchema,
  transactionResponseSchema,
  transactionListSchema,
  transactionFiltersSchema,
  transactionStatsSchema,
} from './transactions.schemas';

import type {
  TransactionCreate,
  TransactionUpdate,
  TransactionResponse,
  TransactionList,
  TransactionFilters,
  TransactionStats,
} from './transactions.types';

/**
 * Fetch all transactions with optional filters
 */
export const fetchTransactions = async (
  filters?: TransactionFilters
): Promise<TransactionList> => {
  // Validate input
  const validatedFilters = filters
    ? transactionFiltersSchema.parse(filters)
    : undefined;

  // Convert camelCase to snake_case for API
  const apiFilters = validatedFilters
    ? {
        profile_id: validatedFilters.profileId,
        account_id: validatedFilters.accountId,
        category_id: validatedFilters.categoryId,
        transaction_type: validatedFilters.transactionType,
        date_from: validatedFilters.dateFrom,
        date_to: validatedFilters.dateTo,
        min_amount: validatedFilters.minAmount,
        max_amount: validatedFilters.maxAmount,
        search: validatedFilters.search,
        skip: validatedFilters.skip,
        limit: validatedFilters.limit,
      }
    : undefined;

  // Make API call
  const response = await listTransactionsApiV1TransactionsGet(apiFilters);

  // Validate and return response
  return transactionListSchema.parse(response.data);
};

/**
 * Fetch a single transaction by ID
 */
export const fetchTransaction = async (
  transactionId: string
): Promise<TransactionResponse> => {
  const response = await getTransactionApiV1TransactionsTransactionIdGet(
    transactionId
  );
  return transactionResponseSchema.parse(response.data);
};

/**
 * Fetch transaction statistics
 */
export const fetchTransactionStats = async (params?: {
  profileId?: string;
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<TransactionStats> => {
  // Convert camelCase to snake_case for API
  const apiParams = params
    ? {
        profile_id: params.profileId,
        account_id: params.accountId,
        date_from: params.dateFrom,
        date_to: params.dateTo,
      }
    : undefined;

  const response = await getTransactionStatsApiV1TransactionsStatsGet(
    apiParams
  );
  return transactionStatsSchema.parse(response.data);
};

/**
 * Create a new transaction
 */
export const createTransaction = async (
  data: TransactionCreate
): Promise<TransactionResponse> => {
  // Validate input
  const validatedData = transactionCreateSchema.parse(data);

  // Convert camelCase to snake_case for API
  const apiData = {
    account_id: validatedData.accountId,
    category_id: validatedData.categoryId,
    transaction_type: validatedData.transactionType,
    amount: validatedData.amount,
    currency: validatedData.currency,
    description: validatedData.description,
    merchant_name: validatedData.merchantName,
    transaction_date: validatedData.transactionDate,
    notes: validatedData.notes,
    value_date: validatedData.valueDate,
    location: validatedData.location,
    receipt_url: validatedData.receiptUrl,
    tags: validatedData.tags,
    source: validatedData.source,
  };

  // Make API call
  const response = await createTransactionApiV1TransactionsPost({
    data: apiData,
  });

  // Validate and return response
  return transactionResponseSchema.parse(response.data);
};

/**
 * Update an existing transaction
 */
export const updateTransaction = async (
  transactionId: string,
  data: TransactionUpdate
): Promise<TransactionResponse> => {
  // Validate input
  const validatedData = transactionUpdateSchema.parse(data);

  // Convert camelCase to snake_case for API
  const apiData = {
    account_id: validatedData.accountId,
    category_id: validatedData.categoryId,
    transaction_type: validatedData.transactionType,
    amount: validatedData.amount,
    currency: validatedData.currency,
    description: validatedData.description,
    merchant_name: validatedData.merchantName,
    transaction_date: validatedData.transactionDate,
    notes: validatedData.notes,
    value_date: validatedData.valueDate,
    location: validatedData.location,
    receipt_url: validatedData.receiptUrl,
    tags: validatedData.tags,
  };

  // Make API call
  const response = await updateTransactionApiV1TransactionsTransactionIdPatch({
    transactionId,
    data: apiData,
  });

  // Validate and return response
  return transactionResponseSchema.parse(response.data);
};

/**
 * Delete a transaction
 */
export const deleteTransaction = async (
  transactionId: string
): Promise<void> => {
  await deleteTransactionApiV1TransactionsTransactionIdDelete({
    transactionId,
  });
};
