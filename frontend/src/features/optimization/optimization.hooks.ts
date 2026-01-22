/**
 * Optimization hooks
 *
 * React Query hooks for the optimization feature.
 * Since this is a frontend-only feature, hooks use mockOptimizationApi
 * instead of Orval-generated API functions.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockOptimizationApi } from './api/mockOptimizationApi';

// ============================================================================
// Query Keys
// ============================================================================

/**
 * Query keys for optimization queries
 * Follows React Query best practices for key organization
 */
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

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to fetch optimization overview data
 */
export const useOptimizationOverview = () => {
  const query = useQuery({
    queryKey: optimizationKeys.overview(),
    queryFn: () => mockOptimizationApi.getOverview(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    overview: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to fetch all optimization suggestions
 */
export const useOptimizationSuggestions = () => {
  const query = useQuery({
    queryKey: optimizationKeys.suggestions(),
    queryFn: () => mockOptimizationApi.getSuggestions(),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });

  return {
    suggestions: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to fetch a single optimization suggestion by ID
 */
export const useOptimizationSuggestion = (id: string) => {
  const query = useQuery({
    queryKey: optimizationKeys.suggestion(id),
    queryFn: () => mockOptimizationApi.getSuggestionById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    suggestion: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to fetch waste detections
 */
export const useWasteDetections = () => {
  const query = useQuery({
    queryKey: optimizationKeys.waste(),
    queryFn: () => mockOptimizationApi.getWasteDetections(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    wasteDetections: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to fetch duplicate services
 */
export const useDuplicateServices = () => {
  const query = useQuery({
    queryKey: optimizationKeys.duplicates(),
    queryFn: () => mockOptimizationApi.getDuplicateServices(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    duplicateServices: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to fetch savings strategies
 */
export const useSavingsStrategies = () => {
  const query = useQuery({
    queryKey: optimizationKeys.strategies(),
    queryFn: () => mockOptimizationApi.getSavingsStrategies(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    strategies: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to fetch alternative recommendations
 */
export const useAlternatives = () => {
  const query = useQuery({
    queryKey: optimizationKeys.alternatives(),
    queryFn: () => mockOptimizationApi.getAlternatives(),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  return {
    alternatives: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to fetch cash flow optimizations
 */
export const useCashFlowOptimizations = () => {
  const query = useQuery({
    queryKey: optimizationKeys.cashflow(),
    queryFn: () => mockOptimizationApi.getCashFlowOptimizations(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    cashFlowOptimizations: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to implement (mark as done) a suggestion
 */
export const useImplementSuggestion = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => mockOptimizationApi.implementSuggestion(id),
    onSuccess: () => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: optimizationKeys.suggestions() });
      queryClient.invalidateQueries({ queryKey: optimizationKeys.overview() });
    },
  });

  return {
    implement: mutation.mutateAsync,
    mutate: mutation.mutate,
    isImplementing: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * Hook to dismiss a suggestion
 */
export const useDismissSuggestion = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => mockOptimizationApi.dismissSuggestion(id),
    onSuccess: () => {
      // Invalidate suggestions query to refresh data
      queryClient.invalidateQueries({ queryKey: optimizationKeys.suggestions() });
    },
  });

  return {
    dismiss: mutation.mutateAsync,
    mutate: mutation.mutate,
    isDismissing: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
