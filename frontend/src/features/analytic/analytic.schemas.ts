import { z } from 'zod';

/**
 * Analytic feature schemas
 * These are frontend-only since analytics might not have dedicated backend endpoints yet
 */

export const anomalySchema = z.object({
  id: z.string(),
  type: z.enum(['spending', 'income', 'pattern']),
  severity: z.enum(['low', 'medium', 'high']),
  title: z.string(),
  description: z.string(),
  amount: z.number(),
  date: z.string(),
  category: z.string().optional(),
  suggestion: z.string().optional(),
});

export const recurringPatternSchema = z.object({
  id: z.string(),
  name: z.string(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  averageAmount: z.number(),
  lastOccurrence: z.string(),
  nextExpected: z.string(),
  category: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

export const overviewStatsSchema = z.object({
  totalIncome: z.number(),
  totalExpenses: z.number(),
  netSavings: z.number(),
  savingsRate: z.number(),
  transactionCount: z.number(),
  averageTransaction: z.number(),
  topCategory: z.string().optional(),
  topCategoryAmount: z.number().optional(),
});

export const reportSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['monthly', 'quarterly', 'yearly', 'custom']),
  period: z.object({
    start: z.string(),
    end: z.string(),
  }),
  generatedAt: z.string(),
  fileUrl: z.string().optional(),
  status: z.enum(['generating', 'ready', 'failed']),
});

export const analyticsFiltersSchema = z.object({
  profileId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
});

export const trendDataSchema = z.object({
  period: z.string(),
  income: z.number(),
  expenses: z.number(),
  savings: z.number(),
});

export const categoryBreakdownSchema = z.object({
  categoryId: z.string(),
  categoryName: z.string(),
  amount: z.number(),
  percentage: z.number(),
  transactionCount: z.number(),
});
