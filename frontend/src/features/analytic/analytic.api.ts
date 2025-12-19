/**
 * Analytics API functions
 * Currently using mock data, can be replaced with real API calls
 */
import type {
  AnalyticsFilters,
  Anomaly,
  RecurringPattern,
  OverviewStats,
  Report,
  AnalyticsDashboard,
} from './analytic.types';

// Mock data generator (to be replaced with real API)
export const fetchAnalyticsDashboard = async (
  filters?: AnalyticsFilters
): Promise<AnalyticsDashboard> => {
  // TODO: Replace with real API call
  return {
    stats: {
      totalIncome: 5000,
      totalExpenses: 3500,
      netSavings: 1500,
      savingsRate: 0.3,
      transactionCount: 42,
      averageTransaction: 83.33,
      topCategory: 'Groceries',
      topCategoryAmount: 800,
    },
    trends: [],
    anomalies: [],
    recurringPatterns: [],
    categoryBreakdown: [],
  };
};

export const fetchAnomalies = async (filters?: AnalyticsFilters): Promise<Anomaly[]> => {
  // TODO: Replace with real API call
  return [];
};

export const fetchRecurringPatterns = async (
  filters?: AnalyticsFilters
): Promise<RecurringPattern[]> => {
  // TODO: Replace with real API call
  return [];
};

export const fetchOverviewStats = async (
  filters?: AnalyticsFilters
): Promise<OverviewStats> => {
  // TODO: Replace with real API call
  return {
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0,
    savingsRate: 0,
    transactionCount: 0,
    averageTransaction: 0,
  };
};

export const generateReport = async (
  type: 'monthly' | 'quarterly' | 'yearly' | 'custom',
  filters?: AnalyticsFilters
): Promise<Report> => {
  // TODO: Replace with real API call
  return {
    id: crypto.randomUUID(),
    name: `Report ${type}`,
    type,
    period: { start: new Date().toISOString(), end: new Date().toISOString() },
    generatedAt: new Date().toISOString(),
    status: 'generating',
  };
};
