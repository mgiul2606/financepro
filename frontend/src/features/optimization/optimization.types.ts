import { z } from 'zod';
import {
  savingsStrategySchema,
  spendingSuggestionSchema,
  wasteDetectionSchema,
  budgetOptimizationSchema,
  optimizationFiltersSchema,
  optimizationOverviewSchema,
} from './optimization.schemas';

export type SavingsStrategy = z.infer<typeof savingsStrategySchema>;
export type SpendingSuggestion = z.infer<typeof spendingSuggestionSchema>;
export type WasteDetection = z.infer<typeof wasteDetectionSchema>;
export type BudgetOptimization = z.infer<typeof budgetOptimizationSchema>;
export type OptimizationFilters = z.infer<typeof optimizationFiltersSchema>;
export type OptimizationOverview = z.infer<typeof optimizationOverviewSchema>;

// Dashboard data type
export interface OptimizationDashboard {
  overview: OptimizationOverview;
  strategies: SavingsStrategy[];
  suggestions: SpendingSuggestion[];
  wasteDetections: WasteDetection[];
  budgetOptimizations: BudgetOptimization[];
}
