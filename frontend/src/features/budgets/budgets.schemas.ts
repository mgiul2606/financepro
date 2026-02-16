/**
 * Budget schemas with runtime validation using Zod
 *
 * Bridges Orval-generated schemas with application-specific needs
 */
import { z } from 'zod';
import { PeriodType } from '@/api/generated/models';

// Import auto-generated Zod schemas from Orval
import {
  CreateBudgetApiV1BudgetsPostBody,
  UpdateBudgetApiV1BudgetsBudgetIdPatchBody,
  GetBudgetApiV1BudgetsBudgetIdGetResponse,
  ListBudgetsApiV1BudgetsGetResponse,
} from '@/api/generated/zod/budgets/budgets.zod';

export const periodTypeSchema = z.enum([
  PeriodType.Monthly,
  PeriodType.Quarterly,
  PeriodType.Yearly,
  PeriodType.Custom,
]);

export const budgetCategoryAllocationSchema = z.object({
  categoryId: z.string().uuid(),
  allocatedAmount: z.number().positive(),
});

/**
 * Budget Create Schema
 * Base schema from Orval
 */
export const budgetCreateSchema = CreateBudgetApiV1BudgetsPostBody;

/**
 * Budget Update Schema
 * Base schema from Orval for partial updates
 */
export const budgetUpdateSchema = UpdateBudgetApiV1BudgetsBudgetIdPatchBody;

/**
 * Budget Response Schema
 */
export const budgetResponseSchema = GetBudgetApiV1BudgetsBudgetIdGetResponse;

/**
 * Budget List Response Schema
 */
export const budgetListSchema = ListBudgetsApiV1BudgetsGetResponse;

/**
 * Budget Filters Schema (UI-specific)
 */
export const budgetFiltersSchema = z.object({
  profileId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  skip: z.number().int().min(0).default(0).optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
});
