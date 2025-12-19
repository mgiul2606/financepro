/**
 * Analytics hooks
 * Using React Query for data fetching
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAnalyticsDashboard,
  fetchAnomalies,
  fetchRecurringPatterns,
  fetchOverviewStats,
  generateReport,
} from './analytic.api';
import type { AnalyticsFilters } from './analytic.types';

export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: (filters?: AnalyticsFilters) => [...analyticsKeys.all, 'dashboard', filters] as const,
  anomalies: (filters?: AnalyticsFilters) => [...analyticsKeys.all, 'anomalies', filters] as const,
  patterns: (filters?: AnalyticsFilters) => [...analyticsKeys.all, 'patterns', filters] as const,
  stats: (filters?: AnalyticsFilters) => [...analyticsKeys.all, 'stats', filters] as const,
};

export const useAnalyticsDashboard = (filters?: AnalyticsFilters) => {
  const query = useQuery({
    queryKey: analyticsKeys.dashboard(filters),
    queryFn: () => fetchAnalyticsDashboard(filters),
  });

  return {
    dashboard: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useAnomalies = (filters?: AnalyticsFilters) => {
  const query = useQuery({
    queryKey: analyticsKeys.anomalies(filters),
    queryFn: () => fetchAnomalies(filters),
  });

  return {
    anomalies: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useRecurringPatterns = (filters?: AnalyticsFilters) => {
  const query = useQuery({
    queryKey: analyticsKeys.patterns(filters),
    queryFn: () => fetchRecurringPatterns(filters),
  });

  return {
    patterns: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useOverviewStats = (filters?: AnalyticsFilters) => {
  const query = useQuery({
    queryKey: analyticsKeys.stats(filters),
    queryFn: () => fetchOverviewStats(filters),
  });

  return {
    stats: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useGenerateReport = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      type,
      filters,
    }: {
      type: 'monthly' | 'quarterly' | 'yearly' | 'custom';
      filters?: AnalyticsFilters;
    }) => generateReport(type, filters),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
    },
  });

  return {
    generateReport: (
      type: 'monthly' | 'quarterly' | 'yearly' | 'custom',
      filters?: AnalyticsFilters
    ) => mutation.mutateAsync({ type, filters }),
    isGenerating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
