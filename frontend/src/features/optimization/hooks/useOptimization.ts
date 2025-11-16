// Optimization Hooks using React Query

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockOptimizationApi } from '../api/mockOptimizationApi';

// Query keys
export const optimizationKeys = {
  all: ['optimization'] as const,
  overview: () => [...optimizationKeys.all, 'overview'] as const,
  suggestions: () => [...optimizationKeys.all, 'suggestions'] as const,
  suggestion: (id: string) => [...optimizationKeys.all, 'suggestion', id] as const,
  waste: () => [...optimizationKeys.all, 'waste'] as const,
  duplicates: () => [...optimizationKeys.all, 'duplicates'] as const,
  strategies: () => [...optimizationKeys.all, 'strategies'] as const,
  alternatives: () => [...optimizationKeys.all, 'alternatives'] as const,
  cashflow: () => [...optimizationKeys.all, 'cashflow'] as const,
};

export const useOptimizationOverview = () => {
  return useQuery({
    queryKey: optimizationKeys.overview(),
    queryFn: () => mockOptimizationApi.getOverview(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useOptimizationSuggestions = () => {
  return useQuery({
    queryKey: optimizationKeys.suggestions(),
    queryFn: () => mockOptimizationApi.getSuggestions(),
    staleTime: 3 * 60 * 1000,
  });
};

export const useOptimizationSuggestion = (id: string) => {
  return useQuery({
    queryKey: optimizationKeys.suggestion(id),
    queryFn: () => mockOptimizationApi.getSuggestionById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useWasteDetections = () => {
  return useQuery({
    queryKey: optimizationKeys.waste(),
    queryFn: () => mockOptimizationApi.getWasteDetections(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useDuplicateServices = () => {
  return useQuery({
    queryKey: optimizationKeys.duplicates(),
    queryFn: () => mockOptimizationApi.getDuplicateServices(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useSavingsStrategies = () => {
  return useQuery({
    queryKey: optimizationKeys.strategies(),
    queryFn: () => mockOptimizationApi.getSavingsStrategies(),
    staleTime: 10 * 60 * 1000,
  });
};

export const useAlternatives = () => {
  return useQuery({
    queryKey: optimizationKeys.alternatives(),
    queryFn: () => mockOptimizationApi.getAlternatives(),
    staleTime: 15 * 60 * 1000,
  });
};

export const useCashFlowOptimizations = () => {
  return useQuery({
    queryKey: optimizationKeys.cashflow(),
    queryFn: () => mockOptimizationApi.getCashFlowOptimizations(),
    staleTime: 10 * 60 * 1000,
  });
};

export const useImplementSuggestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => mockOptimizationApi.implementSuggestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: optimizationKeys.suggestions() });
      queryClient.invalidateQueries({ queryKey: optimizationKeys.overview() });
    },
  });
};

export const useDismissSuggestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => mockOptimizationApi.dismissSuggestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: optimizationKeys.suggestions() });
    },
  });
};
