/**
 * Optimization hooks
 * Using React Query for data fetching
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchOptimizationDashboard,
  fetchSavingsStrategies,
  fetchSpendingSuggestions,
  fetchWasteDetections,
  implementSuggestion,
  dismissSuggestion,
} from './optimization.api';
import type { OptimizationFilters } from './optimization.types';

export const optimizationKeys = {
  all: ['optimization'] as const,
  dashboard: (filters?: OptimizationFilters) =>
    [...optimizationKeys.all, 'dashboard', filters] as const,
  strategies: (filters?: OptimizationFilters) =>
    [...optimizationKeys.all, 'strategies', filters] as const,
  suggestions: (filters?: OptimizationFilters) =>
    [...optimizationKeys.all, 'suggestions', filters] as const,
  waste: (filters?: OptimizationFilters) =>
    [...optimizationKeys.all, 'waste', filters] as const,
};

export const useOptimizationDashboard = (filters?: OptimizationFilters) => {
  const query = useQuery({
    queryKey: optimizationKeys.dashboard(filters),
    queryFn: () => fetchOptimizationDashboard(filters),
  });

  return {
    dashboard: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useSavingsStrategies = (filters?: OptimizationFilters) => {
  const query = useQuery({
    queryKey: optimizationKeys.strategies(filters),
    queryFn: () => fetchSavingsStrategies(filters),
  });

  return {
    strategies: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useSpendingSuggestions = (filters?: OptimizationFilters) => {
  const query = useQuery({
    queryKey: optimizationKeys.suggestions(filters),
    queryFn: () => fetchSpendingSuggestions(filters),
  });

  return {
    suggestions: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useWasteDetections = (filters?: OptimizationFilters) => {
  const query = useQuery({
    queryKey: optimizationKeys.waste(filters),
    queryFn: () => fetchWasteDetections(filters),
  });

  return {
    wasteDetections: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useImplementSuggestion = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (suggestionId: string) => implementSuggestion(suggestionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: optimizationKeys.all });
    },
  });

  return {
    implement: (suggestionId: string) => mutation.mutateAsync(suggestionId),
    isImplementing: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

export const useDismissSuggestion = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (suggestionId: string) => dismissSuggestion(suggestionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: optimizationKeys.all });
    },
  });

  return {
    dismiss: (suggestionId: string) => mutation.mutateAsync(suggestionId),
    isDismissing: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
