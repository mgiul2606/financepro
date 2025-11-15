import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockBudgetsApi } from '../api/mockBudgetsApi';
import { BudgetCreate } from '../types';

const QUERY_KEY = 'budgets';

export const useBudgets = () => {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => mockBudgetsApi.getAll(),
  });
};

export const useCreateBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BudgetCreate) => mockBudgetsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

export const useDeleteBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mockBudgetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};
