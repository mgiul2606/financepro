/**
 * React Query hooks for Budget operations
 * Wraps the generated orval hooks for better usability
 */
import { useQueryClient, useQueries } from '@tanstack/react-query';
import {
  useListBudgetsApiV1BudgetsGet,
  useGetBudgetApiV1BudgetsBudgetIdGet,
  useCreateBudgetApiV1BudgetsPost,
  useUpdateBudgetApiV1BudgetsBudgetIdPatch,
  useDeleteBudgetApiV1BudgetsBudgetIdDelete,
  getListBudgetsApiV1BudgetsGetQueryKey,
  listBudgetsApiV1BudgetsGet,
} from '@/api/generated/budgets/budgets';
import { useProfileContext } from '@/contexts/ProfileContext';
import type { BudgetCreate, BudgetUpdate, BudgetFilters } from '../types';

/**
 * Hook to list all budgets with optional filters
 * Fetches budgets from all active profiles and aggregates the results
 */
export const useBudgets = (filters?: BudgetFilters) => {
  const { activeProfileIds, isLoading: profileLoading } = useProfileContext();

  // Create queries for each active profile
  const queries = useQueries({
    queries: activeProfileIds.map((profileId) => ({
      queryKey: getListBudgetsApiV1BudgetsGetQueryKey({ ...filters, profile_id: profileId }),
      queryFn: () => listBudgetsApiV1BudgetsGet({ ...filters, profile_id: profileId }),
      enabled: !profileLoading && activeProfileIds.length > 0,
    })),
  });

  // Aggregate results from all profiles
  const allBudgets = queries.flatMap((query) => query.data?.data?.items || []);
  const totalCount = queries.reduce((sum, query) => sum + (query.data?.data?.total || 0), 0);
  const isLoading = profileLoading || queries.some((query) => query.isLoading);
  const error = queries.find((query) => query.error)?.error || null;

  const refetch = () => {
    queries.forEach((query) => query.refetch());
  };

  return {
    budgets: allBudgets,
    total: totalCount,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook to get a single budget by ID
 */
export const useBudget = (budgetId: string) => {
  const query = useGetBudgetApiV1BudgetsBudgetIdGet(budgetId, {
    query: {
      enabled: !!budgetId,
    },
  });

  return {
    budget: query.data?.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to create a new budget
 */
export const useCreateBudget = () => {
  const queryClient = useQueryClient();

  const mutation = useCreateBudgetApiV1BudgetsPost({
    mutation: {
      onSuccess: () => {
        // Invalidate budgets list to refetch
        queryClient.invalidateQueries({
          queryKey: getListBudgetsApiV1BudgetsGetQueryKey(),
        });
      },
    },
  });

  return {
    createBudget: (data: BudgetCreate) => mutation.mutateAsync({ data }),
    isCreating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * Hook to update an existing budget
 */
export const useUpdateBudget = () => {
  const queryClient = useQueryClient();

  const mutation = useUpdateBudgetApiV1BudgetsBudgetIdPatch({
    mutation: {
      onSuccess: () => {
        // Invalidate budgets list to refetch
        queryClient.invalidateQueries({
          queryKey: getListBudgetsApiV1BudgetsGetQueryKey(),
        });
      },
    },
  });

  return {
    updateBudget: (budgetId: string, data: BudgetUpdate) =>
      mutation.mutateAsync({ budgetId, data }),
    isUpdating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * Hook to delete a budget
 */
export const useDeleteBudget = () => {
  const queryClient = useQueryClient();

  const mutation = useDeleteBudgetApiV1BudgetsBudgetIdDelete({
    mutation: {
      onSuccess: () => {
        // Invalidate budgets list to refetch
        queryClient.invalidateQueries({
          queryKey: getListBudgetsApiV1BudgetsGetQueryKey(),
        });
      },
    },
  });

  return {
    deleteBudget: (budgetId: string) => mutation.mutateAsync({ budgetId }),
    isDeleting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
