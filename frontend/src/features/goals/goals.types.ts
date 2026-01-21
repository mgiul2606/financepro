import { z } from 'zod';
import {
  goalCreateSchema,
  goalUpdateSchema,
  goalResponseSchema,
  goalListSchema,
  goalFiltersSchema,
  goalTypeSchema,
  goalStatusSchema,
  goalPrioritySchema,
  goalCategorySchema,
} from './goals.schemas';

// Core types derived from Zod schemas
export type GoalCreate = z.infer<typeof goalCreateSchema>;
export type GoalUpdate = z.infer<typeof goalUpdateSchema>;
export type GoalResponse = z.infer<typeof goalResponseSchema>;
export type Goal = GoalResponse;
export type GoalList = z.infer<typeof goalListSchema>;
export type GoalFilters = z.infer<typeof goalFiltersSchema>;
export type GoalType = z.infer<typeof goalTypeSchema>;
export type GoalStatus = z.infer<typeof goalStatusSchema>;

// UI-specific types
export type GoalPriority = z.infer<typeof goalPrioritySchema>;
export type GoalCategory = z.infer<typeof goalCategorySchema>;
