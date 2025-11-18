/**
 * Budget Types - Re-export from generated API types
 * This ensures consistency with the backend API
 */

// Re-export types from generated API
export type {
  BudgetResponse as Budget,
  BudgetCreate,
  BudgetUpdate,
  BudgetListResponse,
  PeriodType as BudgetPeriod,
  BudgetCategoryAllocation,
  ListBudgetsApiV1BudgetsGetParams as BudgetFilters,
} from '@/api/generated/models';
