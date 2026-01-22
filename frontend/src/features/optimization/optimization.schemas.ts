/**
 * Optimization feature schemas with runtime validation using Zod
 *
 * These schemas are aligned with the types in optimization.types.ts
 * and can be used for form validation and runtime data validation.
 *
 * Note: Since this is a frontend-only feature with mock API,
 * schemas are primarily used for form validation.
 */
import { z } from 'zod';

// ============================================================================
// Utility Schemas
// ============================================================================

export const suggestionCategorySchema = z.enum([
  'savings',
  'subscriptions',
  'alternatives',
  'timing',
  'cashflow',
]);

export const suggestionPrioritySchema = z.enum(['low', 'medium', 'high', 'critical']);

export const wasteTypeSchema = z.enum([
  'unused_subscription',
  'duplicate_service',
  'high_cost_low_usage',
  'better_alternative',
]);

export const difficultyLevelSchema = z.enum(['easy', 'medium', 'hard']);

export const impactLevelSchema = z.enum(['low', 'medium', 'high']);

export const strategyStatusSchema = z.enum(['suggested', 'active', 'completed', 'abandoned']);

export const suggestionStatusSchema = z.enum(['active', 'implemented', 'dismissed']);

export const usageFrequencySchema = z.enum(['never', 'rarely', 'occasionally', 'frequently']);

export const billingFrequencySchema = z.enum(['monthly', 'yearly', 'quarterly']);

// ============================================================================
// Core Schemas
// ============================================================================

/**
 * Schema for optimization suggestion
 */
export const optimizationSuggestionSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string(),
  category: suggestionCategorySchema,
  priority: suggestionPrioritySchema,
  potentialSavings: z.number().nonnegative(),
  monthlySavings: z.number().nonnegative(),
  confidence: z.number().min(0).max(1),
  aiExplanation: z.string(),
  actionSteps: z.array(z.string()),
  relatedTransactions: z.array(z.string()).optional(),
  status: suggestionStatusSchema,
  createdAt: z.string(),
  implementedAt: z.string().optional(),
});

/**
 * Schema for waste detection
 */
export const wasteDetectionSchema = z.object({
  id: z.string(),
  type: wasteTypeSchema,
  merchantName: z.string().min(1),
  category: z.string(),
  subscriptionAmount: z.number().nonnegative(),
  frequency: billingFrequencySchema,
  lastUsage: z.string().optional(),
  usageCount: z.number().int().nonnegative(),
  usageFrequency: usageFrequencySchema,
  costPerUse: z.number().nonnegative(),
  monthlyCost: z.number().nonnegative(),
  detectedAt: z.string(),
  recommendation: z.string(),
  potentialSaving: z.number().nonnegative(),
});

/**
 * Schema for duplicate service item
 */
export const duplicateServiceItemSchema = z.object({
  merchantName: z.string().min(1),
  amount: z.number().nonnegative(),
  frequency: z.string(),
});

/**
 * Schema for duplicate service detection
 */
export const duplicateServiceSchema = z.object({
  id: z.string(),
  services: z.array(duplicateServiceItemSchema).min(2),
  category: z.string(),
  totalMonthlyCost: z.number().nonnegative(),
  recommendation: z.string(),
  potentialSaving: z.number().nonnegative(),
});

/**
 * Schema for strategy step
 */
export const strategyStepSchema = z.object({
  order: z.number().int().positive(),
  description: z.string().min(1),
  completed: z.boolean(),
});

/**
 * Schema for projected savings
 */
export const projectedSavingsSchema = z.object({
  monthly: z.number().nonnegative(),
  yearly: z.number().nonnegative(),
});

/**
 * Schema for savings strategy
 */
export const savingsStrategySchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string(),
  targetCategory: z.string().optional(),
  targetAmount: z.number().nonnegative(),
  timeframe: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
  difficulty: difficultyLevelSchema,
  impact: impactLevelSchema,
  steps: z.array(strategyStepSchema),
  projectedSavings: projectedSavingsSchema,
  actualSavings: z.number().nonnegative().optional(),
  startDate: z.string().optional(),
  status: strategyStatusSchema,
});

/**
 * Schema for optimization impact tracking
 */
export const optimizationImpactSchema = z.object({
  suggestionId: z.string(),
  implementedAt: z.string(),
  expectedSavings: z.number().nonnegative(),
  actualSavings: z.number().nonnegative(),
  accuracy: z.number().min(0).max(100),
  verified: z.boolean(),
  notes: z.string().optional(),
});

/**
 * Schema for waste detected summary
 */
export const wasteDetectedSummarySchema = z.object({
  unusedSubscriptions: z.number().int().nonnegative(),
  duplicateServices: z.number().int().nonnegative(),
  totalWastedAmount: z.number().nonnegative(),
});

/**
 * Schema for optimization overview
 */
export const optimizationOverviewSchema = z.object({
  totalPotentialSavings: z.number().nonnegative(),
  monthlySavingsOpportunity: z.number().nonnegative(),
  activeSuggestions: z.number().int().nonnegative(),
  implementedSuggestions: z.number().int().nonnegative(),
  totalSavedToDate: z.number().nonnegative(),
  topCategory: z.string(),
  averageAccuracy: z.number().min(0).max(100),
  wasteDetected: wasteDetectedSummarySchema,
});

/**
 * Schema for alternative recommendation
 */
export const alternativeRecommendationSchema = z.object({
  id: z.string(),
  currentMerchant: z.string().min(1),
  currentAmount: z.number().nonnegative(),
  suggestedMerchant: z.string().min(1),
  suggestedAmount: z.number().nonnegative(),
  category: z.string(),
  monthlySavings: z.number().nonnegative(),
  yearlyProjection: z.number().nonnegative(),
  qualityScore: z.number().min(0).max(100),
  reason: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
});

/**
 * Schema for cash flow pattern
 */
export const cashFlowPatternSchema = z.object({
  problematicPeriod: z.string(),
  avgBalance: z.number(),
  minBalance: z.number(),
});

/**
 * Schema for suggested cash flow pattern
 */
export const suggestedCashFlowPatternSchema = z.object({
  recommendations: z.array(z.string()),
  expectedMinBalance: z.number(),
  improvement: z.number().min(0).max(100),
});

/**
 * Schema for cash flow implementation
 */
export const cashFlowImplementationSchema = z.object({
  steps: z.array(z.string()),
  difficulty: difficultyLevelSchema,
});

/**
 * Schema for cash flow optimization
 */
export const cashFlowOptimizationSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string(),
  currentPattern: cashFlowPatternSchema,
  suggestedPattern: suggestedCashFlowPatternSchema,
  implementation: cashFlowImplementationSchema,
});

// ============================================================================
// Filter Schemas
// ============================================================================

/**
 * Schema for optimization filters
 */
export const optimizationFiltersSchema = z.object({
  profileId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  categories: z.array(z.string()).optional(),
  minSavings: z.number().nonnegative().optional(),
});

// ============================================================================
// Dashboard Schema
// ============================================================================

/**
 * Schema for complete optimization dashboard
 */
export const optimizationDashboardSchema = z.object({
  overview: optimizationOverviewSchema,
  suggestions: z.array(optimizationSuggestionSchema),
  wasteDetections: z.array(wasteDetectionSchema),
  duplicateServices: z.array(duplicateServiceSchema),
  strategies: z.array(savingsStrategySchema),
  alternatives: z.array(alternativeRecommendationSchema),
  cashFlowOptimizations: z.array(cashFlowOptimizationSchema),
});
