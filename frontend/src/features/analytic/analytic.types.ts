import { z } from 'zod';
import {
  anomalySchema,
  recurringPatternSchema,
  overviewStatsSchema,
  reportSchema,
  analyticsFiltersSchema,
  trendDataSchema,
  categoryBreakdownSchema,
} from './analytic.schemas';

export type Anomaly = z.infer<typeof anomalySchema>;
export type RecurringPattern = z.infer<typeof recurringPatternSchema>;
export type OverviewStats = z.infer<typeof overviewStatsSchema>;
export type Report = z.infer<typeof reportSchema>;
export type AnalyticsFilters = z.infer<typeof analyticsFiltersSchema>;
export type TrendData = z.infer<typeof trendDataSchema>;
export type CategoryBreakdown = z.infer<typeof categoryBreakdownSchema>;

// Dashboard data type
export interface AnalyticsDashboard {
  stats: OverviewStats;
  trends: TrendData[];
  anomalies: Anomaly[];
  recurringPatterns: RecurringPattern[];
  categoryBreakdown: CategoryBreakdown[];
}
