/**
 * React Query hooks for Transaction operations
 * Migrated to use new hook factories for better type safety and consistency
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
  type CreateTransactionApiV1TransactionsPostMutationResult,
  type UpdateTransactionApiV1TransactionsTransactionIdPatchMutationResult,
  type DeleteTransactionApiV1TransactionsTransactionIdDeleteMutationResult,
} from '@/api/generated/transactions/transactions';
import type {
  TransactionCreate,
  TransactionUpdate,
  TransactionResponse,
} from '@/api/generated/models';
import { useProfileContext } from '@/contexts/ProfileContext';
import { createGetByIdHook } from '@/hooks/factories/createGetByIdHook';
import { createCreateMutationHook } from '@/hooks/factories/createCreateMutationHook';
import { createUpdateMutationHook } from '@/hooks/factories/createUpdateMutationHook';
import { createDeleteMutationHook } from '@/hooks/factories/createDeleteMutationHook';
import type { ExtractOrvalData } from '@/lib/orval-types';
import {
  isAnyQueryLoading,
  getFirstQueryError,
  refetchAllQueries,
} from '@/lib/orval-utils';

import type { TransactionFilters, TransactionStats } from './transactions.types';
import { isTransactionStats } from './transactions.types';

/**
 * Hook to list all transactions with optional filters
 * Fetches transactions from all active profiles and aggregates the results
 *
 * Note: This hook uses manual useQueries implementation due to dynamic filter support
 * which is not yet supported by createMultiProfileListHook
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

  const isLoading = profileLoading || isAnyQueryLoading(queries);
  const error = getFirstQueryError(queries);

  return {
    transactions: allTransactions as TransactionResponse[],
    total: totalCount,
    isLoading,
    error,
    refetch: () => refetchAllQueries(queries),
  };
};

/**
 * Base hook for getting a single transaction by ID
 * Created using the GET by ID hook factory
 */
const useTransactionBase = createGetByIdHook<
  { data: TransactionResponse; status: number },
  TransactionResponse
>({
  useQuery: useGetTransactionApiV1TransactionsTransactionIdGet,
});

/**
 * Hook to get a single transaction by ID
 */
export const useTransaction = (transactionId: string) => {
  const result = useTransactionBase(transactionId);

  return {
    transaction: result.data,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
};

/**
 * Hook to get transaction statistics
 * Fetches stats from all active profiles and aggregates the results
 *
 * Note: This hook has custom aggregation logic for financial stats
 * which requires manual implementation
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

  const isLoading = profileLoading || isAnyQueryLoading(queries);
  const error = getFirstQueryError(queries);
  const hasData = queries.some((query) => query.data?.data);

  return {
    stats: hasData ? (aggregatedStats as TransactionStats) : undefined,
    isLoading,
    error,
    refetch: () => refetchAllQueries(queries),
  };
};

/**
 * Base hook for creating transactions
 * Created using the CREATE mutation hook factory
 */
const useCreateTransactionBase = createCreateMutationHook<
  CreateTransactionApiV1TransactionsPostMutationResult,
  TransactionCreate,
  ExtractOrvalData<CreateTransactionApiV1TransactionsPostMutationResult>
>({
  useMutation: useCreateTransactionApiV1TransactionsPost,
  defaultOptions: {
    invalidateKeys: getListTransactionsApiV1TransactionsGetQueryKey(),
  },
});

/**
 * Hook to create a new transaction
 */
export const useCreateTransaction = () => {
  const { mutate, mutateAsync, isPending, error, reset } = useCreateTransactionBase();

  return {
    createTransaction: mutateAsync,
    isCreating: isPending,
    error,
    reset,
  };
};

/**
 * Base hook for updating transactions
 * Created using the UPDATE mutation hook factory
 */
const useUpdateTransactionBase = createUpdateMutationHook<
  UpdateTransactionApiV1TransactionsTransactionIdPatchMutationResult,
  TransactionUpdate,
  ExtractOrvalData<UpdateTransactionApiV1TransactionsTransactionIdPatchMutationResult>,
  'transactionId'
>({
  useMutation: useUpdateTransactionApiV1TransactionsTransactionIdPatch,
  idParamName: 'transactionId',
  defaultOptions: {
    invalidateKeys: getListTransactionsApiV1TransactionsGetQueryKey(),
  },
});

/**
 * Hook to update an existing transaction
 */
export const useUpdateTransaction = () => {
  const { mutate, mutateAsync, isPending, error, reset } = useUpdateTransactionBase();

  return {
    updateTransaction: mutateAsync,
    isUpdating: isPending,
    error,
    reset,
  };
};

/**
 * Base hook for deleting transactions
 * Created using the DELETE mutation hook factory
 */
const useDeleteTransactionBase = createDeleteMutationHook<
  DeleteTransactionApiV1TransactionsTransactionIdDeleteMutationResult,
  'transactionId'
>({
  useMutation: useDeleteTransactionApiV1TransactionsTransactionIdDelete,
  idParamName: 'transactionId',
  defaultOptions: {
    invalidateKeys: getListTransactionsApiV1TransactionsGetQueryKey(),
  },
});

/**
 * Hook to delete a transaction
 */
export const useDeleteTransaction = () => {
  const { mutate, mutateAsync, isPending, error, reset } = useDeleteTransactionBase();

  return {
    deleteTransaction: mutateAsync,
    isDeleting: isPending,
    error,
    reset,
  };
};
