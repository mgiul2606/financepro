import { z } from 'zod';
import {
  goalCreateSchema,
  goalUpdateSchema,
  goalResponseSchema,
  goalListSchema,
  goalFiltersSchema,
  goalTypeSchema,
  goalStatusSchema,
} from './goals.schemas';

export type GoalCreate = z.infer<typeof goalCreateSchema>;
export type GoalUpdate = z.infer<typeof goalUpdateSchema>;
export type GoalResponse = z.infer<typeof goalResponseSchema>;
export type Goal = GoalResponse;
export type GoalList = z.infer<typeof goalListSchema>;
export type GoalFilters = z.infer<typeof goalFiltersSchema>;
export type GoalType = z.infer<typeof goalTypeSchema>;
export type GoalStatus = z.infer<typeof goalStatusSchema>;

export const GOAL_TYPE_OPTIONS = [
  'savings',
  'debt_reduction',
  'investment',
  'purchase',
  'emergency_fund',
  'retirement',
  'custom',
] as const;

export const GOAL_STATUS_OPTIONS = [
  'not_started',
  'in_progress',
  'completed',
  'paused',
  'cancelled',
] as const;
