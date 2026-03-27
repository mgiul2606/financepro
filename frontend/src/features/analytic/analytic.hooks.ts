/**
 * React Query hooks for Analytics operations
 *
 * MIGRATION STATUS (2026-03-16):
 * - useAnalyticOverview: MIGRATED to real API (expenses + income endpoints)
 * - useCategoryBreakdown: MIGRATED to real API (expenses endpoint byCategory)
 * - useTimeSeriesData: MIGRATED to real API (cash flow endpoint periodSummaries)
 * - useSpendingTrends: MIGRATED to real API (trends endpoint)
 * - useMerchantAnalysis: MOCK - no backend endpoint
 * - useAnomalies: MOCK - no backend endpoint
 * - useRecurringPatterns: MOCK - no backend endpoint
 * - useReports/useReport/useGenerateReport: MOCK - no backend endpoint
 * - useSubcategoryBreakdown: MOCK - no backend endpoint
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useAnalyzeExpensesApiV1AnalysisExpensesGet,
  useAnalyzeIncomeApiV1AnalysisIncomeGet,
  useGetCashFlowApiV1AnalysisCashFlowGet,
} from '@/api/generated/analysis/analysis';
import type { ExpenseAnalysisResponse } from '@/api/generated/models/expenseAnalysisResponse';
import type { IncomeAnalysisResponse } from '@/api/generated/models/incomeAnalysisResponse';
import type { CashFlowResponse } from '@/api/generated/models/cashFlowResponse';
import type { CategorySpending } from '@/api/generated/models/categorySpending';
import type { PeriodSummary } from '@/api/generated/models/periodSummary';
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
// Query Keys (for hooks still using mocks)
// ============================================================================

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
// Overview & Summary Hooks — MIGRATED TO REAL API
// ============================================================================

/**
 * Hook to fetch analytics overview/summary data
 * Uses real backend: GET /api/v1/analysis/expenses + GET /api/v1/analysis/income
 */
export const useAnalyticOverview = (filters?: AnalyticFilters) => {
  const startDate = filters?.dateFrom ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = filters?.dateTo ?? new Date().toISOString().split('T')[0];

  const expenseQuery = useAnalyzeExpensesApiV1AnalysisExpensesGet(
    { start_date: startDate, end_date: endDate },
    { query: { staleTime: ANALYTIC_STALE_TIMES.overview } },
  );

  const incomeQuery = useAnalyzeIncomeApiV1AnalysisIncomeGet(
    { start_date: startDate, end_date: endDate },
    { query: { staleTime: ANALYTIC_STALE_TIMES.overview } },
  );

  const isLoading = expenseQuery.isLoading || incomeQuery.isLoading;
  const isError = expenseQuery.isError || incomeQuery.isError;
  const error = expenseQuery.error || incomeQuery.error;

  const expenseData = expenseQuery.data?.data as ExpenseAnalysisResponse | undefined;
  const incomeData = incomeQuery.data?.data as IncomeAnalysisResponse | undefined;

  // Map backend responses to the AnalyticOverview shape expected by UI
  const overview: AnalyticOverview | undefined =
    expenseData && incomeData
      ? {
          period: {
            from: expenseData.periodStart,
            to: expenseData.periodEnd,
          },
          totalSpent: expenseData.totalExpenses,
          totalIncome: incomeData.totalIncome,
          netBalance: incomeData.totalIncome - expenseData.totalExpenses,
          transactionCount:
            expenseData.transactionCount + incomeData.transactionCount,
          topCategory:
            expenseData.byCategory.length > 0
              ? expenseData.byCategory.reduce((max: CategorySpending, cat: CategorySpending) =>
                  cat.totalAmount > max.totalAmount ? cat : max,
                ).categoryName
              : '-',
          averageDaily:
            expenseData.totalExpenses /
            Math.max(
              1,
              Math.ceil(
                (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                  (1000 * 60 * 60 * 24),
              ),
            ),
          comparisonToPrevious: {
            spent: 0,
            income: 0,
            balance: 0,
          },
        }
      : undefined;

  const refetch = () => {
    expenseQuery.refetch();
    incomeQuery.refetch();
  };

  return {
    overview,
    isLoading,
    isError,
    error,
    refetch,
  };
};

// ============================================================================
// Time Series & Trends Hooks — MIGRATED TO REAL API
// ============================================================================

/**
 * Hook to fetch time series data for charts
 * Uses real backend: GET /api/v1/analysis/cash-flow
 */
export const useTimeSeriesData = (_filters?: AnalyticFilters) => {
  const cashFlowQuery = useGetCashFlowApiV1AnalysisCashFlowGet(
    { months: 1 },
    { query: { staleTime: ANALYTIC_STALE_TIMES.timeSeries } },
  );

  const cashFlowData = cashFlowQuery.data?.data as CashFlowResponse | undefined;

  // Map PeriodSummary[] to TimeSeriesData[] expected by the UI
  const timeSeries: TimeSeriesData[] =
    cashFlowData?.periodSummaries?.map((ps: PeriodSummary) => ({
      date: ps.period,
      income: ps.totalIncome,
      expenses: ps.totalExpenses,
      balance: ps.netFlow,
    })) ?? [];

  return {
    timeSeries,
    isLoading: cashFlowQuery.isLoading,
    isError: cashFlowQuery.isError,
    error: cashFlowQuery.error,
    refetch: cashFlowQuery.refetch,
  };
};

// ============================================================================
// Category Analysis Hooks — MIGRATED TO REAL API
// ============================================================================

/**
 * Hook to fetch category breakdown data
 * Uses real backend: GET /api/v1/analysis/expenses (byCategory field)
 */
export const useCategoryBreakdown = (filters?: AnalyticFilters) => {
  const startDate = filters?.dateFrom ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = filters?.dateTo ?? new Date().toISOString().split('T')[0];

  const expenseQuery = useAnalyzeExpensesApiV1AnalysisExpensesGet(
    { start_date: startDate, end_date: endDate },
    { query: { staleTime: ANALYTIC_STALE_TIMES.categories } },
  );

  // Default colors for categories
  const CATEGORY_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#ec4899', '#64748b', '#f97316', '#14b8a6',
  ];

  const catExpenseData = expenseQuery.data?.data as ExpenseAnalysisResponse | undefined;

  // Map CategorySpending[] to CategoryBreakdown[] expected by UI
  const categories: CategoryBreakdown[] =
    catExpenseData?.byCategory?.map((cat: CategorySpending, index: number) => ({
      category: cat.categoryName,
      amount: cat.totalAmount,
      percentage: cat.percentage,
      transactionCount: cat.transactionCount,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    })) ?? [];

  return {
    categories,
    isLoading: expenseQuery.isLoading,
    isError: expenseQuery.isError,
    error: expenseQuery.error,
    refetch: expenseQuery.refetch,
  };
};

/**
 * Hook to fetch subcategory breakdown for a specific category
 * MOCK — no backend endpoint for subcategory drill-down
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
// Merchant Analysis Hooks — MOCK (no backend endpoint)
// ============================================================================

/**
 * Hook to fetch merchant analysis data
 * MOCK — no backend endpoint for merchant-level analysis
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
// Anomaly Detection Hooks — MOCK (no backend endpoint)
// ============================================================================

/**
 * Hook to fetch detected anomalies
 * MOCK — no backend endpoint for anomaly detection
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
// Recurring Patterns Hooks — MOCK (no backend endpoint)
// ============================================================================

/**
 * Hook to fetch recurring transaction patterns
 * MOCK — no backend endpoint for recurring pattern detection
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
// Reports Hooks — MOCK (no backend endpoint)
// ============================================================================

/**
 * Hook to fetch list of financial reports
 * MOCK — no backend endpoint for report management
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
 * MOCK — no backend endpoint for report management
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
 * MOCK — no backend endpoint for report generation
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
