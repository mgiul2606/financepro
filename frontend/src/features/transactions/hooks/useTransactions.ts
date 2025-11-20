/**
 * React Query hooks for Transaction operations
 * Wraps the generated orval hooks for better usability
 */
import { useQueryClient, useQueries } from '@tanstack/react-query';
import {
  useListTransactionsApiV1TransactionsGet,
  useGetTransactionApiV1TransactionsTransactionIdGet,
  useCreateTransactionApiV1TransactionsPost,
  useUpdateTransactionApiV1TransactionsTransactionIdPatch,
  useDeleteTransactionApiV1TransactionsTransactionIdDelete,
  useGetTransactionStatsApiV1TransactionsStatsGet,
  getListTransactionsApiV1TransactionsGetQueryKey,
  listTransactionsApiV1TransactionsGet,
  getTransactionStatsApiV1TransactionsStatsGet,
  getGetTransactionStatsApiV1TransactionsStatsGetQueryKey,
} from '@/api/generated/transactions/transactions';
import { useProfileContext } from '@/contexts/ProfileContext';
import type {
  TransactionCreate,
  TransactionUpdate,
  TransactionFilters,
} from '../types';

/**
 * Hook to list all transactions with optional filters
 * Fetches transactions from all active profiles and aggregates the results
 */
export const useTransactions = (filters?: TransactionFilters) => {
  const { activeProfileIds, isLoading: profileLoading } = useProfileContext();

  // Create queries for each active profile
  const queries = useQueries({
    queries: activeProfileIds.map((profileId) => ({
      queryKey: getListTransactionsApiV1TransactionsGetQueryKey({ ...filters, profile_id: profileId }),
      queryFn: () => listTransactionsApiV1TransactionsGet({ ...filters, profile_id: profileId }),
      enabled: !profileLoading && activeProfileIds.length > 0,
    })),
  });

  // Aggregate results from all profiles
  const allTransactions = queries.flatMap((query) => query.data?.data?.items || []);
  const totalCount = queries.reduce((sum, query) => sum + (query.data?.data?.total || 0), 0);
  const isLoading = profileLoading || queries.some((query) => query.isLoading);
  const error = queries.find((query) => query.error)?.error || null;

  const refetch = () => {
    queries.forEach((query) => query.refetch());
  };

  return {
    transactions: allTransactions,
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
        enabled: !!transactionId,
      },
    }
  );

  return {
    transaction: query.data?.data,
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
  profile_id?: string;
  account_id?: string;
  date_from?: string;
  date_to?: string;
}) => {
  const { activeProfileIds, isLoading: profileLoading } = useProfileContext();

  // Create queries for each active profile
  const queries = useQueries({
    queries: activeProfileIds.map((profileId) => ({
      queryKey: getGetTransactionStatsApiV1TransactionsStatsGetQueryKey({ ...params, profile_id: profileId }),
      queryFn: () => getTransactionStatsApiV1TransactionsStatsGet({ ...params, profile_id: profileId }),
      enabled: !profileLoading && activeProfileIds.length > 0,
    })),
  });

  // Aggregate stats from all profiles
  const aggregatedStats = queries.reduce(
    (acc, query) => {
      const data = query.data?.data;
      if (data) {
        return {
          total_income: (acc.total_income || 0) + (data.total_income || 0),
          total_expenses: (acc.total_expenses || 0) + (data.total_expenses || 0),
          net_balance: (acc.net_balance || 0) + (data.net_balance || 0),
          transaction_count: (acc.transaction_count || 0) + (data.transaction_count || 0),
        };
      }
      return acc;
    },
    { total_income: 0, total_expenses: 0, net_balance: 0, transaction_count: 0 }
  );

  const isLoading = profileLoading || queries.some((query) => query.isLoading);
  const error = queries.find((query) => query.error)?.error || null;
  const hasData = queries.some((query) => query.data?.data);

  const refetch = () => {
    queries.forEach((query) => query.refetch());
  };

  return {
    stats: hasData ? aggregatedStats : undefined,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook to create a new transaction
 */
export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  const mutation = useCreateTransactionApiV1TransactionsPost({
    mutation: {
      onSuccess: () => {
        // Invalidate transactions list to refetch
        queryClient.invalidateQueries({
          queryKey: getListTransactionsApiV1TransactionsGetQueryKey(),
        });
      },
    },
  });

  return {
    createTransaction: (data: TransactionCreate) => mutation.mutateAsync({ data }),
    isCreating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * Hook to update an existing transaction
 */
export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  const mutation = useUpdateTransactionApiV1TransactionsTransactionIdPatch({
    mutation: {
      onSuccess: () => {
        // Invalidate transactions list to refetch
        queryClient.invalidateQueries({
          queryKey: getListTransactionsApiV1TransactionsGetQueryKey(),
        });
      },
    },
  });

  return {
    updateTransaction: (transactionId: string, data: TransactionUpdate) =>
      mutation.mutateAsync({ transactionId, data }),
    isUpdating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * Hook to delete a transaction
 */
export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();

  const mutation = useDeleteTransactionApiV1TransactionsTransactionIdDelete({
    mutation: {
      onSuccess: () => {
        // Invalidate transactions list to refetch
        queryClient.invalidateQueries({
          queryKey: getListTransactionsApiV1TransactionsGetQueryKey(),
        });
      },
    },
  });

  return {
    deleteTransaction: (transactionId: string) =>
      mutation.mutateAsync({ transactionId }),
    isDeleting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
