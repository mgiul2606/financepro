// features/optimization/index.ts
export { OptimizationPage } from './pages/OptimizationPage';

// Components
export { SavingsStrategyCard } from './components/SavingsStrategyCard';
export { SuggestionCard } from './components/SuggestionCard';
export { WasteCard } from './components/WasteCard';

// Hooks
export {
  useOptimizationDashboard,
  useSavingsStrategies,
  useSpendingSuggestions,
  useWasteDetections,
  useImplementSuggestion,
  useDismissSuggestion,
  optimizationKeys,
} from './optimization.hooks';

// API
export {
  fetchOptimizationDashboard,
  fetchSavingsStrategies,
  fetchSpendingSuggestions,
  fetchWasteDetections,
  implementSuggestion,
  dismissSuggestion,
} from './optimization.api';

// Schemas
export {
  savingsStrategySchema,
  spendingSuggestionSchema,
  wasteDetectionSchema,
  budgetOptimizationSchema,
  optimizationFiltersSchema,
  optimizationOverviewSchema,
} from './optimization.schemas';

// Types
export type {
  SavingsStrategy,
  SpendingSuggestion,
  WasteDetection,
  BudgetOptimization,
  OptimizationFilters,
  OptimizationOverview,
  OptimizationDashboard,
} from './optimization.types';
