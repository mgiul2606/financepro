/**
 * React Query hooks for Transaction operations
 * Provides optimistic updates and cache management
 */
import { useQueries } from '@tanstack/react-query';
import {
  useGetTransactionApiV1TransactionsTransactionIdGet,
  useCreateTransactionApiV1TransactionsPost,
  useUpdateTransactionApiV1TransactionsTransactionIdPatch,
  useDeleteTransactionApiV1TransactionsTransactionIdDelete,
  getListTransactionsApiV1TransactionsGetQueryKey,
  listTransactionsApiV1TransactionsGet,
  getTransactionStatsApiV1TransactionsStatsGet,
  getGetTransactionStatsApiV1TransactionsStatsGetQueryKey,
  createTransactionApiV1TransactionsPostResponse,
  updateTransactionApiV1TransactionsTransactionIdPatchResponse,
} from '@/api/generated/transactions/transactions';
import type {
  TransactionCreate,
  TransactionUpdate,
  TransactionResponse,
} from '@/api/generated/models';
import { useProfileContext } from '@/contexts/ProfileContext';
import {
  useGenericCreate,
  useGenericUpdate,
  useGenericDelete,
  ExtractResponseData,
} from '@/hooks/useGenericMutations';

import type { TransactionFilters, TransactionStats } from './transactions.types';
import { isTransactionStats } from './transactions.types';

/**
 * Hook to list all transactions with optional filters
 * Fetches transactions from all active profiles and aggregates the results
 */
export const useTransactions = (filters?: TransactionFilters) => {
  const { activeProfileIds, isLoading: profileLoading } = useProfileContext();

  // Convert camelCase filters to snake_case for API
  const apiFilters = filters
    ? {
        account_id: filters.accountId,
        category_id: filters.categoryId,
        transaction_type: filters.transactionType,
        date_from: filters.dateFrom,
        date_to: filters.dateTo,
        min_amount: filters.minAmount,
        max_amount: filters.maxAmount,
        search: filters.search,
        skip: filters.skip,
        limit: filters.limit,
      }
    : undefined;

  // Create queries for each active profile
  const queries = useQueries({
    queries: activeProfileIds.map((profileId) => ({
      queryKey: getListTransactionsApiV1TransactionsGetQueryKey({
        ...apiFilters,
        profile_id: profileId,
      }),
      queryFn: () =>
        listTransactionsApiV1TransactionsGet({
          ...apiFilters,
          profile_id: profileId,
        }),
      enabled: !profileLoading && activeProfileIds.length > 0,
    })),
  });

  // Aggregate results from all profiles
  const allTransactions = queries.flatMap((query) => {
    const data = query.data?.data;
    if (data && 'items' in data) {
      return data.items || [];
    }
    return [];
  });

  const totalCount = queries.reduce((sum, query) => {
    const data = query.data?.data;
    if (data && 'total' in data) {
      return sum + (data.total || 0);
    }
    return sum;
  }, 0);

  const isLoading = profileLoading || queries.some((query) => query.isLoading);
  const error = queries.find((query) => query.error)?.error || null;

  const refetch = () => {
    queries.forEach((query) => query.refetch());
  };

  return {
    transactions: allTransactions as TransactionResponse[],
    total: totalCount,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook to get a single transaction by ID
 */
export const useTransaction = (transactionId: string) => {
  const query = useGetTransactionApiV1TransactionsTransactionIdGet(
    transactionId,
    {
      query: {
        enabled: !!transactionId && transactionId.length > 0,
      },
    }
  );

  return {
    transaction: query.data?.data as TransactionResponse | undefined,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to get transaction statistics
 * Fetches stats from all active profiles and aggregates the results
 */
export const useTransactionStats = (params?: {
  profileId?: string;
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
}) => {
  const { activeProfileIds, isLoading: profileLoading } = useProfileContext();

  // Convert camelCase to snake_case for API
  const apiParams = params
    ? {
        account_id: params.accountId,
        date_from: params.dateFrom,
        date_to: params.dateTo,
      }
    : undefined;

  // Create queries for each active profile
  const queries = useQueries({
    queries: activeProfileIds.map((profileId) => ({
      queryKey: getGetTransactionStatsApiV1TransactionsStatsGetQueryKey({
        ...apiParams,
        profile_id: profileId,
      }),
      queryFn: () =>
        getTransactionStatsApiV1TransactionsStatsGet({
          ...apiParams,
          profile_id: profileId,
        }),
      enabled: !profileLoading && activeProfileIds.length > 0,
    })),
  });

  // Aggregate stats from all profiles
  const aggregatedStats = queries.reduce(
    (acc, query) => {
      const data = query.data?.data;
      if (isTransactionStats(data)) {
        return {
          totalIncome:
            (parseFloat(acc.totalIncome) + parseFloat(data.totalIncome)).toString(),
          totalExpenses:
            (parseFloat(acc.totalExpenses) + parseFloat(data.totalExpenses)).toString(),
          netBalance:
            (parseFloat(acc.netBalance) + parseFloat(data.netBalance)).toString(),
          transactionCount: acc.transactionCount + data.transactionCount,
          currency: data.currency || 'EUR',
        };
      }
      return acc;
    },
    {
      totalIncome: '0',
      totalExpenses: '0',
      netBalance: '0',
      transactionCount: 0,
      currency: 'EUR',
    }
  );

  const isLoading = profileLoading || queries.some((query) => query.isLoading);
  const error = queries.find((query) => query.error)?.error || null;
  const hasData = queries.some((query) => query.data?.data);

  const refetch = () => {
    queries.forEach((query) => query.refetch());
  };

  return {
    stats: hasData ? (aggregatedStats as TransactionStats) : undefined,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook to create a new transaction
 * Uses generic mutation factory for consistency
 */
export const useCreateTransaction = () => {
  const result = useGenericCreate<
    TransactionCreate,
    createTransactionApiV1TransactionsPostResponse,
    ExtractResponseData<createTransactionApiV1TransactionsPostResponse>,
    Error,
    { data: TransactionCreate }
  >({
    useMutation: useCreateTransactionApiV1TransactionsPost,
    invalidateQueryKey: getListTransactionsApiV1TransactionsGetQueryKey,
    mutationName: 'createTransaction',
  });

  return {
    createTransaction: result.createTransaction,
    isCreating: result.isPending,
    error: result.error,
    reset: result.reset,
  };
};

/**
 * Hook to update an existing transaction
 * Uses generic mutation factory for consistency
 */
export const useUpdateTransaction = () => {
  const result = useGenericUpdate<
    TransactionUpdate,
    updateTransactionApiV1TransactionsTransactionIdPatchResponse,
    ExtractResponseData<updateTransactionApiV1TransactionsTransactionIdPatchResponse>,
    Error,
    { transactionId: string; data: TransactionUpdate }
  >({
    useMutation: useUpdateTransactionApiV1TransactionsTransactionIdPatch,
    invalidateQueryKey: getListTransactionsApiV1TransactionsGetQueryKey,
    mutationName: 'updateTransaction',
    idParamName: 'transactionId',
  });

  return {
    updateTransaction: result.updateTransaction,
    isUpdating: result.isPending,
    error: result.error,
    reset: result.reset,
  };
};

/**
 * Hook to delete a transaction
 * Uses generic mutation factory for consistency
 */
export const useDeleteTransaction = () => {
  const result = useGenericDelete({
    useMutation: useDeleteTransactionApiV1TransactionsTransactionIdDelete,
    invalidateQueryKey: getListTransactionsApiV1TransactionsGetQueryKey,
    mutationName: 'deleteTransaction',
    idParamName: 'transactionId',
  });

  return {
    deleteTransaction: result.deleteTransaction,
    isDeleting: result.isPending,
    error: result.error,
    reset: result.reset,
  };
};
