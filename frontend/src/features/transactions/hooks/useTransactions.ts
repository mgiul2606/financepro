/**
 * React Query hooks for Transaction operations
 * Wraps the generated orval hooks for better usability
 */
import { useQueryClient } from '@tanstack/react-query';
import {
  useListTransactionsApiV1TransactionsGet,
  useGetTransactionApiV1TransactionsTransactionIdGet,
  useCreateTransactionApiV1TransactionsPost,
  useUpdateTransactionApiV1TransactionsTransactionIdPatch,
  useDeleteTransactionApiV1TransactionsTransactionIdDelete,
  useGetTransactionStatsApiV1TransactionsStatsGet,
  getListTransactionsApiV1TransactionsGetQueryKey,
} from '@/api/generated/transactions/transactions';
import { useProfileContext } from '@/contexts/ProfileContext';
import type {
  TransactionCreate,
  TransactionUpdate,
  TransactionFilters,
} from '../types';

/**
 * Hook to list all transactions with optional filters
 * Automatically uses the main profile ID from context if not provided
 */
export const useTransactions = (filters?: TransactionFilters) => {
  const { mainProfileId, isLoading: profileLoading } = useProfileContext();

  // Merge filters with profile_id from context
  const mergedFilters = mainProfileId
    ? { ...filters, profile_id: filters?.profile_id || mainProfileId }
    : filters;

  const query = useListTransactionsApiV1TransactionsGet(mergedFilters);

  return {
    transactions: query.data?.data?.items || [],
    total: query.data?.data?.total || 0,
    isLoading: query.isLoading || profileLoading,
    error: query.error,
    refetch: query.refetch,
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
 * Automatically uses the main profile ID from context if not provided
 */
export const useTransactionStats = (params?: {
  profile_id?: string;
  account_id?: string;
  date_from?: string;
  date_to?: string;
}) => {
  const { mainProfileId, isLoading: profileLoading } = useProfileContext();

  // Merge params with profile_id from context
  const mergedParams = mainProfileId
    ? { ...params, profile_id: params?.profile_id || mainProfileId }
    : params;

  const query = useGetTransactionStatsApiV1TransactionsStatsGet(mergedParams);

  return {
    stats: query.data?.data,
    isLoading: query.isLoading || profileLoading,
    error: query.error,
    refetch: query.refetch,
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
