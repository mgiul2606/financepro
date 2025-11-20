/**
 * React Query hooks for Budget operations
 * Wraps the generated orval hooks for better usability
 */
import { useQueryClient } from '@tanstack/react-query';
import {
  useListBudgetsApiV1BudgetsGet,
  useGetBudgetApiV1BudgetsBudgetIdGet,
  useCreateBudgetApiV1BudgetsPost,
  useUpdateBudgetApiV1BudgetsBudgetIdPatch,
  useDeleteBudgetApiV1BudgetsBudgetIdDelete,
  getListBudgetsApiV1BudgetsGetQueryKey,
} from '@/api/generated/budgets/budgets';
import { useProfileContext } from '@/contexts/ProfileContext';
import type { BudgetCreate, BudgetUpdate, BudgetFilters } from '../types';

/**
 * Hook to list all budgets with optional filters
 * Automatically uses the main profile ID from context if not provided
 */
export const useBudgets = (filters?: BudgetFilters) => {
  const { mainProfileId, isLoading: profileLoading } = useProfileContext();

  // Merge filters with profile_id from context
  const mergedFilters = mainProfileId
    ? { ...filters, profile_id: filters?.profile_id || mainProfileId }
    : filters;

  const query = useListBudgetsApiV1BudgetsGet(mergedFilters, {
    query: {
      // Only enable the query when we have a profile_id
      enabled: !!mergedFilters?.profile_id && !profileLoading,
    },
  });

  return {
    budgets: query.data?.data?.items || [],
    total: query.data?.data?.total || 0,
    isLoading: query.isLoading || profileLoading,
    error: query.error,
    refetch: query.refetch,
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
