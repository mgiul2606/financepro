/**
 * Analytic feature schemas with runtime validation using Zod
 *
 * Note: Since there are no Orval-generated schemas for analytics yet,
 * these are frontend-only schemas for form validation and data parsing.
 * When API schemas become available, import them and extend as needed.
 */
import { z } from 'zod';

// ============================================================================
// Enum Schemas (matching constants)
// ============================================================================

/**
 * Frequency schema for recurring patterns
 */
export const frequencySchema = z.enum([
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'yearly',
]);

/**
 * Anomaly type schema
 */
export const anomalyTypeSchema = z.enum([
  'unusually_high',
  'unusual_category',
  'unusual_merchant',
  'unusual_time',
]);

/**
 * Severity schema for anomalies
 */
export const severitySchema = z.enum(['low', 'medium', 'high']);

/**
 * Report type schema
 */
export const reportTypeSchema = z.enum(['monthly', 'quarterly', 'yearly', 'custom']);

// ============================================================================
// Data Schemas (aligned with types)
// ============================================================================

/**
 * Time series data point schema
 */
export const timeSeriesDataSchema = z.object({
  date: z.string(),
  income: z.number(),
  expenses: z.number(),
  balance: z.number(),
});

/**
 * Spending trend schema
 */
export const spendingTrendSchema = z.object({
  date: z.string(),
  amount: z.number(),
  category: z.string().optional(),
});

/**
 * Category breakdown schema
 */
export const categoryBreakdownSchema = z.object({
  category: z.string(),
  subcategory: z.string().optional(),
  amount: z.number(),
  percentage: z.number(),
  transactionCount: z.number().int(),
  color: z.string().optional(),
});

/**
 * Subcategory breakdown schema
 */
export const subcategoryBreakdownSchema = z.object({
  category: z.string(),
  subcategories: z.array(
    z.object({
      name: z.string(),
      amount: z.number(),
      percentage: z.number(),
    })
  ),
  total: z.number(),
});

/**
 * Merchant analysis schema
 */
export const merchantAnalysisSchema = z.object({
  merchantName: z.string(),
  totalAmount: z.number(),
  transactionCount: z.number().int(),
  averageAmount: z.number(),
  category: z.string(),
  lastTransaction: z.string(),
});

/**
 * Anomaly detection schema
 */
export const anomalyDetectionSchema = z.object({
  id: z.string(),
  transactionId: z.string(),
  date: z.string(),
  amount: z.number(),
  category: z.string(),
  merchantName: z.string(),
  description: z.string(),
  anomalyType: anomalyTypeSchema,
  severity: severitySchema,
  explanation: z.string(),
  expectedAmount: z.number().optional(),
  // Extended fields for UI compatibility
  transactionDate: z.string().optional(),
  currency: z.string().optional(),
  recommendation: z.string().optional(),
  type: anomalyTypeSchema.optional(), // deprecated alias
});

/**
 * Recurring pattern schema
 */
export const recurringPatternSchema = z.object({
  id: z.string(),
  merchantName: z.string(),
  category: z.string(),
  averageAmount: z.number(),
  frequency: frequencySchema,
  nextExpectedDate: z.string(),
  confidence: z.number().min(0).max(1),
  variance: z.number(),
  transactionCount: z.number().int(),
});

/**
 * Financial report schema
 */
export const financialReportSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: reportTypeSchema,
  period: z.object({
    from: z.string(),
    to: z.string(),
  }),
  summary: z.object({
    totalIncome: z.number(),
    totalExpenses: z.number(),
    netSavings: z.number(),
    savingsRate: z.number(),
  }),
  topCategories: z.array(categoryBreakdownSchema),
  insights: z.array(z.string()),
  generatedAt: z.string(),
  downloadUrl: z.string().optional(),
});

/**
 * Analytics overview schema
 */
export const analyticOverviewSchema = z.object({
  period: z.object({
    from: z.string(),
    to: z.string(),
  }),
  totalSpent: z.number(),
  totalIncome: z.number(),
  netBalance: z.number(),
  transactionCount: z.number().int(),
  topCategory: z.string(),
  averageDaily: z.number(),
  comparisonToPrevious: z.object({
    spent: z.number(),
    income: z.number(),
    balance: z.number(),
  }),
});

// ============================================================================
// Filter/Form Schemas
// ============================================================================

/**
 * Analytics filters schema for query parameters and form validation
 */
export const analyticFiltersSchema = z.object({
  profileId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
});

/**
 * Report generation request schema
 */
export const generateReportRequestSchema = z.object({
  type: reportTypeSchema,
  filters: analyticFiltersSchema.optional(),
});

// ============================================================================
// Derived Types (for form validation)
// ============================================================================

export type AnalyticFiltersFormData = z.infer<typeof analyticFiltersSchema>;
export type GenerateReportFormData = z.infer<typeof generateReportRequestSchema>;
