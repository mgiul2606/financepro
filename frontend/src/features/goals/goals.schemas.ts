/**
 * Goal schemas with runtime validation using Zod
 *
 * Bridges Orval-generated schemas with application-specific needs
 */
import { z } from 'zod';
import { GoalType, GoalStatus } from '@/api/generated/models';

// Import auto-generated Zod schemas from Orval
import {
  createGoalApiV1GoalsPostBody,
  updateGoalApiV1GoalsGoalIdPatchBody,
  getGoalApiV1GoalsGoalIdGetResponse,
  listGoalsApiV1GoalsGetResponse,
} from '@/api/generated/zod/financial-goals/financial-goals.zod';

export const goalTypeSchema = z.enum([
  GoalType.savings,
  GoalType.debt_reduction,
  GoalType.investment,
  GoalType.purchase,
  GoalType.emergency_fund,
  GoalType.retirement,
  GoalType.custom,
]);

export const goalStatusSchema = z.enum([
  GoalStatus.not_started,
  GoalStatus.in_progress,
  GoalStatus.completed,
  GoalStatus.paused,
  GoalStatus.cancelled,
]);

/**
 * Goal Create Schema
 * Base schema from Orval
 */
export const goalCreateSchema = createGoalApiV1GoalsPostBody;

/**
 * Goal Update Schema
 * Base schema from Orval for partial updates
 */
export const goalUpdateSchema = updateGoalApiV1GoalsGoalIdPatchBody;

/**
 * Goal Response Schema
 */
export const goalResponseSchema = getGoalApiV1GoalsGoalIdGetResponse;

/**
 * Goal List Response Schema
 */
export const goalListSchema = listGoalsApiV1GoalsGetResponse;

export const goalFiltersSchema = z.object({
  profileId: z.string().uuid().optional(),
  goalType: goalTypeSchema.optional(),
  status: goalStatusSchema.optional(),
  isActive: z.boolean().optional(),
  skip: z.number().int().min(0).default(0).optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
});
