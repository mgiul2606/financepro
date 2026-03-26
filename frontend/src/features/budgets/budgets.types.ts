import { z } from 'zod';
import {
  budgetCreateSchema,
  budgetUpdateSchema,
  budgetResponseSchema,
  budgetListSchema,
  budgetFiltersSchema,
  periodTypeSchema,
  budgetCategoryAllocationSchema,
} from './budgets.schemas';

/**
 * Type definitions derived from Zod schemas
 * These ensure type safety across the application
 *
 * Note: BudgetCreate, BudgetUpdate, BudgetResponse are derived from Orval schemas
 * for API compatibility. UI-specific types are defined here.
 */

// Request types (input)
export type BudgetCreate = z.infer<typeof budgetCreateSchema>;
export type BudgetUpdate = z.infer<typeof budgetUpdateSchema>;

// Response types (output)
export type BudgetResponse = z.infer<typeof budgetResponseSchema>;
export type Budget = BudgetResponse;
export type BudgetList = z.infer<typeof budgetListSchema>;

// Query/Filter types
export type BudgetFilters = z.infer<typeof budgetFiltersSchema>;

// Utility types
export type PeriodType = z.infer<typeof periodTypeSchema>;
export type BudgetCategoryAllocation = z.infer<typeof budgetCategoryAllocationSchema>;

/**
 * Alias for PeriodType for backwards compatibility
 * Used in components that expect 'BudgetPeriod' naming
 */
export type BudgetPeriod = PeriodType;

/**
 * Period navigation info from the detail endpoint
 */
export interface BudgetPeriodInfo {
  start: string;
  end: string;
  offset: number;
  isCurrent: boolean;
  hasPrevious: boolean;
  hasNext: boolean;
}

/**
 * Per-category spending breakdown
 */
export interface BudgetCategorySpending {
  categoryId: string;
  categoryName: string;
  allocated: string;
  spent: string;
  remaining: string;
}

/**
 * Aggregated spending info
 */
export interface BudgetSpendingInfo {
  totalAllocated: string;
  totalSpent: string;
  totalRemaining: string;
  percentUsed: string;
  categories: BudgetCategorySpending[];
}

/**
 * Complete budget detail response with period navigation and spending
 */
export interface BudgetDetailResponse {
  budget: BudgetResponse;
  period: BudgetPeriodInfo;
  spending: BudgetSpendingInfo;
}
