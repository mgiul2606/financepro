import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockBudgetsApi } from '../api/mockBudgetsApi';
import type { BudgetCreate, BudgetUpdate } from '../types';

const QUERY_KEY = 'budgets';

/**
 * Hook to list all budgets
 */
export const useBudgets = () => {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => mockBudgetsApi.getAll(),
  });
};

/**
 * Hook to get a single budget by ID
 */
export const useBudget = (id: string) => {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => mockBudgetsApi.getById(id),
    enabled: !!id,
  });
};

/**
 * Hook to create a new budget
 */
export const useCreateBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BudgetCreate) => mockBudgetsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

/**
 * Hook to update an existing budget
 */
export const useUpdateBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BudgetUpdate }) =>
      mockBudgetsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

/**
 * Hook to delete a budget
 */
export const useDeleteBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mockBudgetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};
