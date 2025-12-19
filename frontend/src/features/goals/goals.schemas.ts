import { z } from 'zod';
import { GoalType, GoalStatus } from '@/api/generated/models';

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

export const goalCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  goalType: goalTypeSchema,
  targetAmount: z.number().positive(),
  currentAmount: z.number().min(0).default(0).optional(),
  currency: z.string().length(3).default('EUR'),
  deadline: z.string().optional().nullable(),
  linkedAccountId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().default(true).optional(),
});

export const goalUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  goalType: goalTypeSchema.optional(),
  targetAmount: z.number().positive().optional(),
  currentAmount: z.number().min(0).optional(),
  deadline: z.string().optional().nullable(),
  linkedAccountId: z.string().uuid().optional().nullable(),
  status: goalStatusSchema.optional(),
  isActive: z.boolean().optional(),
});

export const goalResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  goalType: goalTypeSchema,
  targetAmount: z.string(),
  currentAmount: z.string(),
  currency: z.string().length(3),
  progressPercentage: z.number().min(0).max(100),
  deadline: z.string().nullable(),
  linkedAccountId: z.string().uuid().nullable(),
  status: goalStatusSchema,
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const goalListSchema = z.object({
  items: z.array(goalResponseSchema),
  total: z.number().int().min(0),
});

export const goalFiltersSchema = z.object({
  profileId: z.string().uuid().optional(),
  goalType: goalTypeSchema.optional(),
  status: goalStatusSchema.optional(),
  isActive: z.boolean().optional(),
  skip: z.number().int().min(0).default(0).optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
});
