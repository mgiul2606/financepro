/**
 * Analytic feature type definitions
 *
 * Note: Since there are no Orval-generated types for analytics yet,
 * these are UI-specific types based on the mock API structure.
 * When API types become available, import them from @/api/generated/models
 * and keep only UI-specific extensions here.
 */

import type {
  FrequencyValue,
  AnomalyTypeValue,
  SeverityValue,
  ReportTypeValue,
} from './analytic.constants';

// ============================================================================
// API Data Types (to be replaced with Orval types when available)
// ============================================================================

/**
 * Time series data point for charts
 */
export interface TimeSeriesData {
  date: string;
  income: number;
  expenses: number;
  balance: number;
}

/**
 * Spending trend data point
 */
export interface SpendingTrend {
  date: string;
  amount: number;
  category?: string;
}

/**
 * Category breakdown for expense/income distribution
 */
export interface CategoryBreakdown {
  category: string;
  subcategory?: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  color?: string;
}

/**
 * Subcategory breakdown within a category
 */
export interface SubcategoryBreakdown {
  category: string;
  subcategories: {
    name: string;
    amount: number;
    percentage: number;
  }[];
  total: number;
}

/**
 * Merchant analysis data
 */
export interface MerchantAnalysis {
  merchantName: string;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  category: string;
  lastTransaction: string;
}

/**
 * Anomaly detection result
 * Extended with optional fields used by UI components
 */
export interface AnomalyDetection {
  id: string;
  transactionId: string;
  date: string;
  amount: number;
  category: string;
  merchantName: string;
  description: string;
  anomalyType: AnomalyTypeValue;
  severity: SeverityValue;
  explanation: string;
  expectedAmount?: number;
  // Extended fields for UI compatibility
  transactionDate?: string;
  currency?: string;
  recommendation?: string;
  /** @deprecated Use anomalyType instead */
  type?: AnomalyTypeValue;
}

/**
 * Recurring pattern detected in transactions
 */
export interface RecurringPattern {
  id: string;
  merchantName: string;
  category: string;
  averageAmount: number;
  frequency: FrequencyValue;
  nextExpectedDate: string;
  confidence: number; // 0-1
  variance: number; // percentage
  transactionCount: number;
}

/**
 * Financial report summary
 */
export interface FinancialReport {
  id: string;
  title: string;
  type: ReportTypeValue;
  period: {
    from: string;
    to: string;
  };
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    savingsRate: number; // percentage
  };
  topCategories: CategoryBreakdown[];
  insights: string[];
  generatedAt: string;
  downloadUrl?: string;
}

/**
 * Analytics overview/summary data
 */
export interface AnalyticOverview {
  period: {
    from: string;
    to: string;
  };
  totalSpent: number;
  totalIncome: number;
  netBalance: number;
  transactionCount: number;
  topCategory: string;
  averageDaily: number;
  comparisonToPrevious: {
    spent: number; // percentage change
    income: number;
    balance: number;
  };
}

// ============================================================================
// Query/Filter Types
// ============================================================================

/**
 * Filters for analytics queries
 */
export interface AnalyticFilters {
  profileId?: string;
  dateFrom?: string;
  dateTo?: string;
  categories?: string[];
  tags?: string[];
  minAmount?: number;
  maxAmount?: number;
}

// ============================================================================
// UI-Specific Types
// ============================================================================

/**
 * Confidence level for recurring patterns
 */
export type ConfidenceLevel = 'low' | 'medium' | 'high';

/**
 * Badge variant mapping for UI components
 */
export type BadgeVariant = 'info' | 'warning' | 'danger' | 'success' | 'primary' | 'secondary';

/**
 * Confidence badge info for recurring patterns
 */
export interface ConfidenceBadgeInfo {
  variant: BadgeVariant;
  label: string;
}

/**
 * Severity badge info for anomalies
 */
export interface SeverityBadgeInfo {
  variant: BadgeVariant;
  label: string;
}
