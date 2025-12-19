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

export type BudgetCreate = z.infer<typeof budgetCreateSchema>;
export type BudgetUpdate = z.infer<typeof budgetUpdateSchema>;
export type BudgetResponse = z.infer<typeof budgetResponseSchema>;
export type Budget = BudgetResponse;
export type BudgetList = z.infer<typeof budgetListSchema>;
export type BudgetFilters = z.infer<typeof budgetFiltersSchema>;
export type PeriodType = z.infer<typeof periodTypeSchema>;
export type BudgetCategoryAllocation = z.infer<typeof budgetCategoryAllocationSchema>;

export const PERIOD_TYPE_OPTIONS = ['monthly', 'quarterly', 'yearly', 'custom'] as const;
