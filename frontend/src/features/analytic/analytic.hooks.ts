/**
 * React Query hooks for Analytics operations
 *
 * Note: Since there are no Orval-generated hooks for analytics yet,
 * these hooks use the mock API. When API becomes available, replace
 * mockAnalyticApi calls with Orval hooks following the accounts pattern.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockAnalyticApi } from './api/mockAnalyticApi';
import { ANALYTIC_STALE_TIMES } from './analytic.constants';
import type {
  AnalyticFilters,
  AnalyticOverview,
  TimeSeriesData,
  CategoryBreakdown,
  MerchantAnalysis,
  AnomalyDetection,
  RecurringPattern,
  FinancialReport,
  SubcategoryBreakdown,
} from './analytic.types';
import type { ReportTypeValue } from './analytic.constants';

// ============================================================================
// Query Keys
// ============================================================================

/**
 * Centralized query key factory for analytics
 * Following React Query best practices for key management
 */
export const analyticKeys = {
  all: ['analytics'] as const,
  overview: (filters?: AnalyticFilters) => [...analyticKeys.all, 'overview', filters] as const,
  timeSeries: (filters?: AnalyticFilters) => [...analyticKeys.all, 'timeSeries', filters] as const,
  categories: (filters?: AnalyticFilters) => [...analyticKeys.all, 'categories', filters] as const,
  subcategory: (category: string, filters?: AnalyticFilters) =>
    [...analyticKeys.all, 'subcategory', category, filters] as const,
  merchants: (filters?: AnalyticFilters) => [...analyticKeys.all, 'merchants', filters] as const,
  anomalies: (filters?: AnalyticFilters) => [...analyticKeys.all, 'anomalies', filters] as const,
  patterns: (filters?: AnalyticFilters) => [...analyticKeys.all, 'patterns', filters] as const,
  reports: (filters?: AnalyticFilters) => [...analyticKeys.all, 'reports', filters] as const,
  report: (id: string) => [...analyticKeys.all, 'report', id] as const,
} as const;

// ============================================================================
// Overview & Summary Hooks
// ============================================================================

/**
 * Hook to fetch analytics overview/summary data
 */
export const useAnalyticOverview = (filters?: AnalyticFilters) => {
  const query = useQuery<AnalyticOverview>({
    queryKey: analyticKeys.overview(filters),
    queryFn: () => mockAnalyticApi.getOverview(filters),
    staleTime: ANALYTIC_STALE_TIMES.overview,
  });

  return {
    overview: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

// ============================================================================
// Time Series & Trends Hooks
// ============================================================================

/**
 * Hook to fetch time series data for charts
 */
export const useTimeSeriesData = (filters?: AnalyticFilters) => {
  const query = useQuery<TimeSeriesData[]>({
    queryKey: analyticKeys.timeSeries(filters),
    queryFn: () => mockAnalyticApi.getTimeSeriesData(filters),
    staleTime: ANALYTIC_STALE_TIMES.timeSeries,
  });

  return {
    timeSeries: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

// ============================================================================
// Category Analysis Hooks
// ============================================================================

/**
 * Hook to fetch category breakdown data
 */
export const useCategoryBreakdown = (filters?: AnalyticFilters) => {
  const query = useQuery<CategoryBreakdown[]>({
    queryKey: analyticKeys.categories(filters),
    queryFn: () => mockAnalyticApi.getCategoryBreakdown(filters),
    staleTime: ANALYTIC_STALE_TIMES.categories,
  });

  return {
    categories: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to fetch subcategory breakdown for a specific category
 */
export const useSubcategoryBreakdown = (category: string, filters?: AnalyticFilters) => {
  const query = useQuery<SubcategoryBreakdown>({
    queryKey: analyticKeys.subcategory(category, filters),
    queryFn: () => mockAnalyticApi.getSubcategoryBreakdown(category, filters),
    enabled: !!category,
    staleTime: ANALYTIC_STALE_TIMES.categories,
  });

  return {
    subcategory: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

// ============================================================================
// Merchant Analysis Hooks
// ============================================================================

/**
 * Hook to fetch merchant analysis data
 */
export const useMerchantAnalysis = (filters?: AnalyticFilters) => {
  const query = useQuery<MerchantAnalysis[]>({
    queryKey: analyticKeys.merchants(filters),
    queryFn: () => mockAnalyticApi.getMerchantAnalysis(filters),
    staleTime: ANALYTIC_STALE_TIMES.merchants,
  });

  return {
    merchants: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

// ============================================================================
// Anomaly Detection Hooks
// ============================================================================

/**
 * Hook to fetch detected anomalies
 */
export const useAnomalies = (filters?: AnalyticFilters) => {
  const query = useQuery<AnomalyDetection[]>({
    queryKey: analyticKeys.anomalies(filters),
    queryFn: () => mockAnalyticApi.getAnomalies(filters),
    staleTime: ANALYTIC_STALE_TIMES.anomalies,
  });

  return {
    anomalies: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

// ============================================================================
// Recurring Patterns Hooks
// ============================================================================

/**
 * Hook to fetch recurring transaction patterns
 */
export const useRecurringPatterns = (filters?: AnalyticFilters) => {
  const query = useQuery<RecurringPattern[]>({
    queryKey: analyticKeys.patterns(filters),
    queryFn: () => mockAnalyticApi.getRecurringPatterns(filters),
    staleTime: ANALYTIC_STALE_TIMES.patterns,
  });

  return {
    patterns: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

// ============================================================================
// Reports Hooks
// ============================================================================

/**
 * Hook to fetch list of financial reports
 */
export const useReports = (filters?: AnalyticFilters) => {
  const query = useQuery<FinancialReport[]>({
    queryKey: analyticKeys.reports(filters),
    queryFn: () => mockAnalyticApi.getReports(filters),
    staleTime: ANALYTIC_STALE_TIMES.reports,
  });

  return {
    reports: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to fetch a single report by ID
 */
export const useReport = (id: string) => {
  const query = useQuery<FinancialReport>({
    queryKey: analyticKeys.report(id),
    queryFn: () => mockAnalyticApi.getReportById(id),
    enabled: !!id,
    staleTime: ANALYTIC_STALE_TIMES.reports,
  });

  return {
    report: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to generate a new financial report
 * Note: When API is available, this will use mutation factory
 */
export const useGenerateReport = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      type,
      filters,
    }: {
      type: ReportTypeValue;
      filters?: AnalyticFilters;
    }): Promise<FinancialReport> => {
      // Mock implementation - replace with actual API call when available
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        id: `report-${Date.now()}`,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
        type,
        period: {
          from: filters?.dateFrom ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          to: filters?.dateTo ?? new Date().toISOString().split('T')[0],
        },
        summary: {
          totalIncome: 5800,
          totalExpenses: 4567.89,
          netSavings: 1232.11,
          savingsRate: 21.2,
        },
        topCategories: [],
        insights: ['Report generated successfully.'],
        generatedAt: new Date().toISOString(),
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticKeys.all });
    },
  });

  return {
    generateReport: (type: ReportTypeValue, filters?: AnalyticFilters) =>
      mutation.mutateAsync({ type, filters }),
    isGenerating: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
};
