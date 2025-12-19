import { z } from 'zod';

/**
 * Optimization feature schemas
 * Frontend-only schemas for financial optimization suggestions
 */

export const savingsStrategySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  potentialSavings: z.number(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  timeframe: z.string(),
  category: z.string().optional(),
  steps: z.array(z.string()),
  impactScore: z.number().min(0).max(100),
});

export const spendingSuggestionSchema = z.object({
  id: z.string(),
  type: z.enum(['reduce', 'eliminate', 'substitute', 'negotiate']),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  currentSpending: z.number(),
  suggestedSpending: z.number(),
  potentialSavings: z.number(),
  confidence: z.number().min(0).max(1),
  priority: z.enum(['low', 'medium', 'high']),
});

export const wasteDetectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  wasteAmount: z.number(),
  frequency: z.enum(['one-time', 'recurring', 'occasional']),
  severity: z.enum(['minor', 'moderate', 'severe']),
  suggestions: z.array(z.string()),
});

export const budgetOptimizationSchema = z.object({
  categoryId: z.string(),
  categoryName: z.string(),
  currentBudget: z.number(),
  suggestedBudget: z.number(),
  averageSpending: z.number(),
  reason: z.string(),
  adjustment: z.number(),
});

export const optimizationFiltersSchema = z.object({
  profileId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  categories: z.array(z.string()).optional(),
  minSavings: z.number().optional(),
});

export const optimizationOverviewSchema = z.object({
  totalPotentialSavings: z.number(),
  monthlyPotentialSavings: z.number(),
  suggestionsCount: z.number(),
  topStrategy: savingsStrategySchema.optional(),
  quickWins: z.array(spendingSuggestionSchema),
});
