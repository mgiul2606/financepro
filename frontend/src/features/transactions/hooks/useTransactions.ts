import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockTransactionsApi } from '../api/mockTransactionsApi';
import { type TransactionCreate, type TransactionUpdate, type TransactionFilters } from '../types';

const QUERY_KEY = 'transactions';

export const useTransactions = (filters?: TransactionFilters) => {
  return useQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: () => mockTransactionsApi.getAll(filters),
  });
};

export const useTransaction = (id: string) => {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => mockTransactionsApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TransactionCreate) => mockTransactionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TransactionUpdate }) =>
      mockTransactionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => mockTransactionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

export const useTransactionStats = (accountId?: number) => {
  return useQuery({
    queryKey: [QUERY_KEY, 'stats', accountId],
    queryFn: () => mockTransactionsApi.getStats(accountId),
  });
};
