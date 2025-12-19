import { useQueryClient, useEffect } from '@tanstack/react-query';
import {
  useListBudgetsApiV1BudgetsGet,
  useGetBudgetApiV1BudgetsBudgetIdGet,
  useCreateBudgetApiV1BudgetsPost,
  useUpdateBudgetApiV1BudgetsBudgetIdPatch,
  useDeleteBudgetApiV1BudgetsBudgetIdDelete,
  getListBudgetsApiV1BudgetsGetQueryKey,
} from '@/api/generated/budgets/budgets';
import { useProfileContext } from '@/contexts/ProfileContext';

import type { BudgetCreate, BudgetUpdate, BudgetFilters, BudgetResponse } from './budgets.types';

export const useBudgets = (filters?: BudgetFilters) => {
  const { activeProfileIds, isLoading: profileLoading, isInitialized } = useProfileContext();
  const query = useListBudgetsApiV1BudgetsGet(filters, {
    query: { enabled: !profileLoading && isInitialized },
  });

  useEffect(() => {
    if (isInitialized && !profileLoading && activeProfileIds.length > 0) {
      query.refetch();
    }
  }, [activeProfileIds, isInitialized, profileLoading]);

  return {
    budgets: (query.data?.data?.items || []) as BudgetResponse[],
    total: query.data?.data?.total || 0,
    isLoading: profileLoading || query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useBudget = (budgetId: string) => {
  const query = useGetBudgetApiV1BudgetsBudgetIdGet(budgetId, {
    query: { enabled: !!budgetId },
  });
  return {
    budget: query.data?.data as BudgetResponse | undefined,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useCreateBudget = () => {
  const queryClient = useQueryClient();
  const mutation = useCreateBudgetApiV1BudgetsPost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBudgetsApiV1BudgetsGetQueryKey() });
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

export const useUpdateBudget = () => {
  const queryClient = useQueryClient();
  const mutation = useUpdateBudgetApiV1BudgetsBudgetIdPatch({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBudgetsApiV1BudgetsGetQueryKey() });
      },
    },
  });
  return {
    updateBudget: (budgetId: string, data: BudgetUpdate) => mutation.mutateAsync({ budgetId, data }),
    isUpdating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

export const useDeleteBudget = () => {
  const queryClient = useQueryClient();
  const mutation = useDeleteBudgetApiV1BudgetsBudgetIdDelete({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBudgetsApiV1BudgetsGetQueryKey() });
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
