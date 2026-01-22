/**
 * Analytic Feature - Public API
 *
 * This module exports all public components, hooks, types, schemas, and constants
 * for the analytics feature. Import from this module rather than reaching into
 * internal files.
 */

// ============================================================================
// Pages
// ============================================================================
export { AnalyticPage } from './pages/AnalyticPage';

// ============================================================================
// Components
// ============================================================================
export { AnalyticsFilterModal } from './components/AnalyticsFilterModal';
export { AnomalyCard } from './components/AnomalyCard';
export { AnomalyDetailsModal } from './components/AnomalyDetailsModal';
export { OverviewStats } from './components/OverviewStats';
export { RecurringPatternCard } from './components/RecurringPatternCard';
export { ReportCard } from './components/ReportCard';

// ============================================================================
// Hooks
// ============================================================================
export {
  // Query keys for cache management
  analyticKeys,
  // Overview & Summary
  useAnalyticOverview,
  // Time Series & Trends
  useTimeSeriesData,
  // Category Analysis
  useCategoryBreakdown,
  useSubcategoryBreakdown,
  // Merchant Analysis
  useMerchantAnalysis,
  // Anomaly Detection
  useAnomalies,
  // Recurring Patterns
  useRecurringPatterns,
  // Reports
  useReports,
  useReport,
  useGenerateReport,
} from './analytic.hooks';

// ============================================================================
// Types (UI-specific types, API types when available from Orval)
// ============================================================================
export type {
  // Data types
  TimeSeriesData,
  SpendingTrend,
  CategoryBreakdown,
  SubcategoryBreakdown,
  MerchantAnalysis,
  AnomalyDetection,
  RecurringPattern,
  FinancialReport,
  AnalyticOverview,
  // Query/Filter types
  AnalyticFilters,
  // UI-specific types
  ConfidenceLevel,
  BadgeVariant,
  ConfidenceBadgeInfo,
  SeverityBadgeInfo,
} from './analytic.types';

// ============================================================================
// Constants
// ============================================================================
export {
  // Category options
  ANALYTIC_CATEGORY_OPTIONS,
  // Frequency options
  FREQUENCY_OPTIONS,
  // Anomaly type options
  ANOMALY_TYPE_OPTIONS,
  // Severity options
  SEVERITY_OPTIONS,
  // Report type options
  REPORT_TYPE_OPTIONS,
  // Confidence thresholds
  CONFIDENCE_THRESHOLDS,
  // Stale times for React Query
  ANALYTIC_STALE_TIMES,
} from './analytic.constants';

// Type-safe value types from constants
export type {
  AnalyticCategoryValue,
  FrequencyValue,
  AnomalyTypeValue,
  SeverityValue,
  ReportTypeValue,
} from './analytic.constants';

// ============================================================================
// Schemas (for form validation)
// ============================================================================
export {
  // Enum schemas
  frequencySchema,
  anomalyTypeSchema,
  severitySchema,
  reportTypeSchema,
  // Data schemas
  timeSeriesDataSchema,
  spendingTrendSchema,
  categoryBreakdownSchema,
  subcategoryBreakdownSchema,
  merchantAnalysisSchema,
  anomalyDetectionSchema,
  recurringPatternSchema,
  financialReportSchema,
  analyticOverviewSchema,
  // Form schemas
  analyticFiltersSchema,
  generateReportRequestSchema,
} from './analytic.schemas';

// Form data types derived from schemas
export type {
  AnalyticFiltersFormData,
  GenerateReportFormData,
} from './analytic.schemas';
