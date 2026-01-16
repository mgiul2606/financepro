/**
 * React Query hooks for Transaction operations
 * Follows the same architecture pattern as accounts.hooks.ts
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
  type listTransactionsApiV1TransactionsGetResponse,
  type CreateTransactionApiV1TransactionsPostMutationResult,
  type UpdateTransactionApiV1TransactionsTransactionIdPatchMutationResult,
  type DeleteTransactionApiV1TransactionsTransactionIdDeleteMutationResult,
} from '@/api/generated/transactions/transactions';
import type {
  TransactionCreate,
  TransactionUpdate,
  TransactionResponse,
  ListTransactionsApiV1TransactionsGetParams,
} from '@/api/generated/models';
import { useProfileContext } from '@/contexts/ProfileContext';
import { createMultiProfileListHook } from '@/hooks/factories/createMultiProfileListHook';
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

import type {
  TransactionFilters,
  TransactionUIFilters,
  TransactionStats,
  TransactionList,
} from './transactions.types';
import { transactionStatsSchema } from './transactions.schemas';

/**
 * Converts UI filters to API parameters (snake_case)
 */
function toApiParams(
  filters: TransactionFilters | undefined,
  profileId: string
): ListTransactionsApiV1TransactionsGetParams {
  if (!filters) {
    return { profile_id: profileId };
  }

  return {
    profile_id: profileId,
    account_id: filters.accountId,
    category_id: filters.categoryId,
    date_from: filters.dateFrom,
    date_to: filters.dateTo,
    skip: filters.skip,
    limit: filters.limit,
  };
}

/**
 * Base hook for listing transactions across multiple profiles (without filters)
 * Created using the multi-profile list hook factory
 *
 * Note: For filtered queries, we use useTransactionsFiltered which handles
 * dynamic filter parameters.
 */
const useTransactionsBase = createMultiProfileListHook<
  ListTransactionsApiV1TransactionsGetParams,
  listTransactionsApiV1TransactionsGetResponse,
  TransactionResponse
>({
  getQueryKey: getListTransactionsApiV1TransactionsGetQueryKey,
  queryFn: listTransactionsApiV1TransactionsGet,
  extractItems: (response) => (response.data as TransactionList)?.items ?? [],
  extractTotal: (response) => (response.data as TransactionList)?.total ?? 0,
  mapProfileToParams: (profileId) => ({ profile_id: profileId }),
});

/**
 * Hook to list all transactions with optional filters
 * Fetches transactions from all active profiles and aggregates the results
 *
 * When filters are provided, uses a dynamic query approach.
 * When no filters, uses the optimized factory-based hook.
 */
export const useTransactions = (filters?: TransactionFilters) => {
  const { activeProfileIds, isLoading: profileLoading } = useProfileContext();

  // For unfiltered queries, use the factory-based hook
  const baseResult = useTransactionsBase(activeProfileIds, {
    enabled: !profileLoading && !filters,
  });

  // For filtered queries, create dynamic queries
  const filteredQueries = useQueries({
    queries: filters
      ? activeProfileIds.map((profileId) => {
          const params = toApiParams(filters, profileId);
          return {
            queryKey: [...getListTransactionsApiV1TransactionsGetQueryKey(params), profileId],
            queryFn: () => listTransactionsApiV1TransactionsGet(params),
            enabled: !profileLoading && activeProfileIds.length > 0,
          };
        })
      : [],
  });

  // If filters are provided, aggregate filtered results
  if (filters) {
    const allTransactions = filteredQueries.flatMap((query) => {
      const data = query.data?.data as TransactionList | undefined;
      return data?.items ?? [];
    });

    const totalCount = filteredQueries.reduce((sum, query) => {
      const data = query.data?.data as TransactionList | undefined;
      return sum + (data?.total ?? 0);
    }, 0);

    return {
      transactions: allTransactions,
      total: totalCount,
      isLoading: profileLoading || isAnyQueryLoading(filteredQueries),
      error: getFirstQueryError(filteredQueries),
      refetch: () => refetchAllQueries(filteredQueries),
    };
  }

  // No filters - use base result
  return {
    transactions: baseResult.items,
    total: baseResult.total,
    isLoading: baseResult.isLoading || profileLoading,
    error: baseResult.error,
    refetch: baseResult.refetch,
  };
};

/**
 * Hook to list transactions with UI filters (supports multi-select)
 * Applies client-side filtering for UI-specific fields like types[] and categories[]
 */
export const useTransactionsWithUIFilters = (uiFilters?: TransactionUIFilters) => {
  const { activeProfileIds, isLoading: profileLoading } = useProfileContext();

  // Convert UI filters to API-compatible filters
  const apiFilters: TransactionFilters | undefined = uiFilters
    ? {
        accountId: uiFilters.accountId,
        dateFrom: uiFilters.dateFrom,
        dateTo: uiFilters.dateTo,
        // Note: categories[] and types[] are filtered client-side
      }
    : undefined;

  // Create queries for each active profile
  const queries = useQueries({
    queries: activeProfileIds.map((profileId) => {
      const params = toApiParams(apiFilters, profileId);
      return {
        queryKey: [...getListTransactionsApiV1TransactionsGetQueryKey(params), profileId, uiFilters],
        queryFn: () => listTransactionsApiV1TransactionsGet(params),
        enabled: !profileLoading && activeProfileIds.length > 0,
      };
    }),
  });

  // Aggregate results from all profiles
  let allTransactions = queries.flatMap((query) => {
    const data = query.data?.data as TransactionList | undefined;
    return data?.items ?? [];
  });

  // Apply client-side UI filters
  if (uiFilters) {
    // Filter by transaction types (multi-select)
    if (uiFilters.types && uiFilters.types.length > 0) {
      allTransactions = allTransactions.filter((txn) =>
        uiFilters.types!.includes(txn.transactionType)
      );
    }

    // Filter by categories (multi-select)
    if (uiFilters.categories && uiFilters.categories.length > 0) {
      allTransactions = allTransactions.filter(
        (txn) => txn.categoryId && uiFilters.categories!.includes(txn.categoryId)
      );
    }

    // Filter by amount range
    if (uiFilters.minAmount !== undefined) {
      allTransactions = allTransactions.filter(
        (txn) => parseFloat(txn.amount) >= uiFilters.minAmount!
      );
    }
    if (uiFilters.maxAmount !== undefined) {
      allTransactions = allTransactions.filter(
        (txn) => parseFloat(txn.amount) <= uiFilters.maxAmount!
      );
    }

    // Filter by merchant name (partial match)
    if (uiFilters.merchantName) {
      const searchLower = uiFilters.merchantName.toLowerCase();
      allTransactions = allTransactions.filter(
        (txn) => txn.merchantName?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by allowed accounts
    if (uiFilters.allowedAccounts && uiFilters.allowedAccounts.length > 0) {
      allTransactions = allTransactions.filter((txn) =>
        uiFilters.allowedAccounts!.includes(txn.accountId)
      );
    }
  }

  const isLoading = profileLoading || isAnyQueryLoading(queries);
  const error = getFirstQueryError(queries);

  return {
    transactions: allTransactions,
    total: allTransactions.length,
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
 * which requires summing monetary values across profiles.
 */
export const useTransactionStats = (params?: {
  profileId?: string;
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
}) => {
  const { activeProfileIds, isLoading: profileLoading } = useProfileContext();

  // Create queries for each active profile
  const queries = useQueries({
    queries: activeProfileIds.map((profileId) => ({
      queryKey: [
        ...getGetTransactionStatsApiV1TransactionsStatsGetQueryKey({
          account_id: params?.accountId,
          date_from: params?.dateFrom,
          date_to: params?.dateTo,
          profile_id: profileId,
        }),
        profileId,
      ],
      queryFn: () =>
        getTransactionStatsApiV1TransactionsStatsGet({
          account_id: params?.accountId,
          date_from: params?.dateFrom,
          date_to: params?.dateTo,
          profile_id: profileId,
        }),
      enabled: !profileLoading && activeProfileIds.length > 0,
    })),
  });

  // Aggregate stats from all profiles
  const aggregatedStats = queries.reduce(
    (acc, query) => {
      const data = query.data?.data;
      const parsed = transactionStatsSchema.safeParse(data);
      if (parsed.success) {
        const parsedData = parsed.data as TransactionStats;

        // Merge category breakdowns
        const categoryMap = new Map(
          acc.categoryBreakdown.map((c) => [c.categoryId, c])
        );
        for (const category of parsedData.categoryBreakdown) {
          const existing = categoryMap.get(category.categoryId);
          if (existing) {
            existing.count += category.count;
            existing.totalAmount = (
              parseFloat(existing.totalAmount) + parseFloat(category.totalAmount)
            ).toString();
          } else {
            categoryMap.set(category.categoryId, { ...category });
          }
        }

        return {
          totalIncome: (
            parseFloat(acc.totalIncome) + parseFloat(parsedData.totalIncome)
          ).toString(),
          totalExpenses: (
            parseFloat(acc.totalExpenses) + parseFloat(parsedData.totalExpenses)
          ).toString(),
          netAmount: (
            parseFloat(acc.netAmount) + parseFloat(parsedData.netAmount)
          ).toString(),
          transactionCount: acc.transactionCount + parsedData.transactionCount,
          currency: parsedData.currency || 'EUR',
          categoryBreakdown: Array.from(categoryMap.values()),
        };
      }
      return acc;
    },
    {
      totalIncome: '0',
      totalExpenses: '0',
      netAmount: '0',
      transactionCount: 0,
      currency: 'EUR',
      categoryBreakdown: [] as Array<{
        categoryId: string | null;
        count: number;
        totalAmount: string;
      }>,
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
  const { mutateAsync, isPending, error, reset } = useCreateTransactionBase();

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
  const { mutateAsync, isPending, error, reset } = useUpdateTransactionBase();

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
  const { mutateAsync, isPending, error, reset } = useDeleteTransactionBase();

  return {
    deleteTransaction: mutateAsync,
    isDeleting: isPending,
    error,
    reset,
  };
};
