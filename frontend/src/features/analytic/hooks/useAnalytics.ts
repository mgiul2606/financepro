// Analytic Hooks using React Query

import { useQuery } from '@tanstack/react-query';
import { mockAnalyticApi } from '../api/mockAnalyticApi';
import type { AnalyticFilters } from '../types';

// Query keys
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
};

export const useAnalyticOverview = (filters?: AnalyticFilters) => {
  return useQuery({
    queryKey: analyticKeys.overview(filters),
    queryFn: () => mockAnalyticApi.getOverview(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useTimeSeriesData = (filters?: AnalyticFilters) => {
  return useQuery({
    queryKey: analyticKeys.timeSeries(filters),
    queryFn: () => mockAnalyticApi.getTimeSeriesData(filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCategoryBreakdown = (filters?: AnalyticFilters) => {
  return useQuery({
    queryKey: analyticKeys.categories(filters),
    queryFn: () => mockAnalyticApi.getCategoryBreakdown(filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useSubcategoryBreakdown = (category: string, filters?: AnalyticFilters) => {
  return useQuery({
    queryKey: analyticKeys.subcategory(category, filters),
    queryFn: () => mockAnalyticApi.getSubcategoryBreakdown(category, filters),
    enabled: !!category,
    staleTime: 5 * 60 * 1000,
  });
};

export const useMerchantAnalysis = (filters?: AnalyticFilters) => {
  return useQuery({
    queryKey: analyticKeys.merchants(filters),
    queryFn: () => mockAnalyticApi.getMerchantAnalysis(filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useAnomalies = (filters?: AnalyticFilters) => {
  return useQuery({
    queryKey: analyticKeys.anomalies(filters),
    queryFn: () => mockAnalyticApi.getAnomalies(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes - anomalies should be fresher
  });
};

export const useRecurringPatterns = (filters?: AnalyticFilters) => {
  return useQuery({
    queryKey: analyticKeys.patterns(filters),
    queryFn: () => mockAnalyticApi.getRecurringPatterns(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes - patterns don't change often
  });
};

export const useReports = (filters?: AnalyticFilters) => {
  return useQuery({
    queryKey: analyticKeys.reports(filters),
    queryFn: () => mockAnalyticApi.getReports(filters),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

export const useReport = (id: string) => {
  return useQuery({
    queryKey: analyticKeys.report(id),
    queryFn: () => mockAnalyticApi.getReportById(id),
    enabled: !!id,
    staleTime: 15 * 60 * 1000,
  });
};
