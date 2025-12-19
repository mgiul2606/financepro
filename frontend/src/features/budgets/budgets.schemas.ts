import { z } from 'zod';
import { PeriodType } from '@/api/generated/models';

export const periodTypeSchema = z.enum([
  PeriodType.monthly,
  PeriodType.quarterly,
  PeriodType.yearly,
  PeriodType.custom,
]);

export const budgetCategoryAllocationSchema = z.object({
  categoryId: z.string().uuid(),
  allocatedAmount: z.number().positive(),
});

export const budgetCreateSchema = z.object({
  name: z.string().min(1).max(100),
  periodType: periodTypeSchema,
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
  totalAmount: z.number().positive().optional(),
  currency: z.string().length(3).default('EUR'),
  scopeType: z.enum(['user', 'profile']).default('user').optional(),
  scopeProfileIds: z.array(z.string().uuid()).optional(),
  categoryAllocations: z.array(budgetCategoryAllocationSchema).optional(),
  rolloverEnabled: z.boolean().default(false).optional(),
  alertThresholdPercent: z.number().min(0).max(100).default(80).optional(),
});

export const budgetUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  periodType: periodTypeSchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  totalAmount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  scopeType: z.enum(['user', 'profile']).optional(),
  scopeProfileIds: z.array(z.string().uuid()).optional(),
  rolloverEnabled: z.boolean().optional(),
  alertThresholdPercent: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

export const budgetResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  periodType: periodTypeSchema,
  startDate: z.string(),
  endDate: z.string().nullable(),
  totalAmount: z.string(),
  totalSpent: z.string(),
  remaining: z.string(),
  usagePercentage: z.number(),
  currency: z.string().length(3),
  scopeType: z.enum(['user', 'profile']),
  scopeProfileIds: z.array(z.string().uuid()).optional(),
  categoryAllocations: z.array(budgetCategoryAllocationSchema).optional(),
  rolloverEnabled: z.boolean(),
  alertThresholdPercent: z.number(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const budgetListSchema = z.object({
  items: z.array(budgetResponseSchema),
  total: z.number().int().min(0),
});

export const budgetFiltersSchema = z.object({
  profileId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  skip: z.number().int().min(0).default(0).optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
});
