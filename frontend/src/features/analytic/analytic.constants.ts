/**
 * Analytic feature constants
 *
 * Centralized constants for analytics feature to ensure consistency
 * and support internationalization through translation keys.
 */

/**
 * Category options for analytics filtering
 */
export const ANALYTIC_CATEGORY_OPTIONS = [
  { value: 'salary', label: 'analytics.categories.salary' },
  { value: 'groceries', label: 'analytics.categories.groceries' },
  { value: 'rent', label: 'analytics.categories.rent' },
  { value: 'transport', label: 'analytics.categories.transport' },
  { value: 'entertainment', label: 'analytics.categories.entertainment' },
  { value: 'healthcare', label: 'analytics.categories.healthcare' },
  { value: 'shopping', label: 'analytics.categories.shopping' },
  { value: 'utilities', label: 'analytics.categories.utilities' },
  { value: 'restaurants', label: 'analytics.categories.restaurants' },
  { value: 'subscriptions', label: 'analytics.categories.subscriptions' },
  { value: 'other', label: 'analytics.categories.other' },
] as const;

/**
 * Frequency options for recurring patterns
 */
export const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'analytics.frequency.daily' },
  { value: 'weekly', label: 'analytics.frequency.weekly' },
  { value: 'biweekly', label: 'analytics.frequency.biweekly' },
  { value: 'monthly', label: 'analytics.frequency.monthly' },
  { value: 'quarterly', label: 'analytics.frequency.quarterly' },
  { value: 'yearly', label: 'analytics.frequency.yearly' },
] as const;

/**
 * Anomaly type options with icons mapping
 */
export const ANOMALY_TYPE_OPTIONS = [
  { value: 'unusually_high', label: 'analytics.anomalyTypes.unusuallyHigh', icon: 'TrendingUp' },
  { value: 'unusual_category', label: 'analytics.anomalyTypes.unusualCategory', icon: 'MapPin' },
  { value: 'unusual_merchant', label: 'analytics.anomalyTypes.unusualMerchant', icon: 'MapPin' },
  { value: 'unusual_time', label: 'analytics.anomalyTypes.unusualTime', icon: 'Clock' },
] as const;

/**
 * Severity options for anomalies
 */
export const SEVERITY_OPTIONS = [
  { value: 'low', label: 'analytics.severity.low', variant: 'info' },
  { value: 'medium', label: 'analytics.severity.medium', variant: 'warning' },
  { value: 'high', label: 'analytics.severity.high', variant: 'danger' },
] as const;

/**
 * Report type options
 */
export const REPORT_TYPE_OPTIONS = [
  { value: 'monthly', label: 'analytics.reportTypes.monthly' },
  { value: 'quarterly', label: 'analytics.reportTypes.quarterly' },
  { value: 'yearly', label: 'analytics.reportTypes.yearly' },
  { value: 'custom', label: 'analytics.reportTypes.custom' },
] as const;

/**
 * Confidence level thresholds for recurring patterns
 */
export const CONFIDENCE_THRESHOLDS = {
  high: 0.9,
  medium: 0.7,
} as const;

/**
 * Default stale times for React Query (in milliseconds)
 */
export const ANALYTIC_STALE_TIMES = {
  overview: 5 * 60 * 1000, // 5 minutes
  timeSeries: 5 * 60 * 1000, // 5 minutes
  categories: 5 * 60 * 1000, // 5 minutes
  merchants: 5 * 60 * 1000, // 5 minutes
  anomalies: 2 * 60 * 1000, // 2 minutes - anomalies should be fresher
  patterns: 10 * 60 * 1000, // 10 minutes - patterns don't change often
  reports: 15 * 60 * 1000, // 15 minutes
} as const;

/**
 * Type-safe value extractors
 */
export type AnalyticCategoryValue = (typeof ANALYTIC_CATEGORY_OPTIONS)[number]['value'];
export type FrequencyValue = (typeof FREQUENCY_OPTIONS)[number]['value'];
export type AnomalyTypeValue = (typeof ANOMALY_TYPE_OPTIONS)[number]['value'];
export type SeverityValue = (typeof SEVERITY_OPTIONS)[number]['value'];
export type ReportTypeValue = (typeof REPORT_TYPE_OPTIONS)[number]['value'];
