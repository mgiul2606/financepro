/**
 * React Query hooks for Budget operations
 * Wraps the generated orval hooks for better usability
 */
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
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
 * Budgets are USER-LEVEL entities, so we fetch all budgets for the user
 * and they will be filtered by scope_profile_ids on the backend
 */
export const useBudgets = (filters?: BudgetFilters) => {
  const { activeProfileIds, isLoading: profileLoading, isInitialized } = useProfileContext();
  const queryClient = useQueryClient();

  // Single query for all user budgets (budgets are USER-LEVEL, not profile-level)
  const query = useListBudgetsApiV1BudgetsGet(filters, {
    query: {
      enabled: !profileLoading && isInitialized,
    },
  });

  // Note: Refetching is now handled by ProfileContext cache invalidation
  // This effect ensures immediate refetch when profiles change
  useEffect(() => {
    if (isInitialized && !profileLoading && activeProfileIds.length > 0) {
      query.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfileIds, isInitialized, profileLoading]);

  return {
    budgets: query.data?.data?.items || [],
    total: query.data?.data?.total || 0,
    isLoading: profileLoading || query.isLoading,
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
