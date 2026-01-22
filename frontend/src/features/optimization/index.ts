/**
 * Optimization feature public API
 *
 * This file exports all public components, hooks, types, and schemas
 * from the optimization feature.
 */

// ============================================================================
// Pages
// ============================================================================

export { OptimizationPage } from './pages/OptimizationPage';

// ============================================================================
// Components
// ============================================================================

export { SavingsStrategyCard } from './components/SavingsStrategyCard';
export type { SavingsStrategyCardProps } from './components/SavingsStrategyCard';

export { SuggestionCard } from './components/SuggestionCard';
export type { SuggestionCardProps } from './components/SuggestionCard';

export { WasteCard } from './components/WasteCard';
export type { WasteCardProps } from './components/WasteCard';

// ============================================================================
// Hooks
// ============================================================================

export {
  // Query keys
  optimizationKeys,
  // Query hooks
  useOptimizationOverview,
  useOptimizationSuggestions,
  useOptimizationSuggestion,
  useWasteDetections,
  useDuplicateServices,
  useSavingsStrategies,
  useAlternatives,
  useCashFlowOptimizations,
  // Mutation hooks
  useImplementSuggestion,
  useDismissSuggestion,
} from './optimization.hooks';

// ============================================================================
// Types
// ============================================================================

export type {
  // Utility types
  SuggestionCategory,
  SuggestionPriority,
  WasteType,
  DifficultyLevel,
  ImpactLevel,
  StrategyStatus,
  SuggestionStatus,
  UsageFrequency,
  BillingFrequency,
  // Core types
  OptimizationSuggestion,
  WasteDetection,
  DuplicateService,
  StrategyStep,
  ProjectedSavings,
  SavingsStrategy,
  OptimizationImpact,
  WasteDetectedSummary,
  OptimizationOverview,
  AlternativeRecommendation,
  CashFlowPattern,
  SuggestedCashFlowPattern,
  CashFlowImplementation,
  CashFlowOptimization,
  // Filter types
  OptimizationFilters,
  // Dashboard types
  OptimizationDashboard,
} from './optimization.types';

// ============================================================================
// Schemas
// ============================================================================

export {
  // Utility schemas
  suggestionCategorySchema,
  suggestionPrioritySchema,
  wasteTypeSchema,
  difficultyLevelSchema,
  impactLevelSchema,
  strategyStatusSchema,
  suggestionStatusSchema,
  usageFrequencySchema,
  billingFrequencySchema,
  // Core schemas
  optimizationSuggestionSchema,
  wasteDetectionSchema,
  duplicateServiceItemSchema,
  duplicateServiceSchema,
  strategyStepSchema,
  projectedSavingsSchema,
  savingsStrategySchema,
  optimizationImpactSchema,
  wasteDetectedSummarySchema,
  optimizationOverviewSchema,
  alternativeRecommendationSchema,
  cashFlowPatternSchema,
  suggestedCashFlowPatternSchema,
  cashFlowImplementationSchema,
  cashFlowOptimizationSchema,
  // Filter schemas
  optimizationFiltersSchema,
  // Dashboard schema
  optimizationDashboardSchema,
} from './optimization.schemas';

// ============================================================================
// Mock API (for testing purposes)
// ============================================================================

export { mockOptimizationApi } from './api/mockOptimizationApi';
