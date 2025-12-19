import { z } from 'zod';

export const categoryResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  description: z.string().nullable(),
  parentCategoryId: z.string().uuid().nullable(),
  fullPath: z.string().nullable(),
  subcategories: z.array(z.lazy(() => categoryResponseSchema)).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const categoryListSchema = z.object({
  categories: z.array(categoryResponseSchema),
  total: z.number().int().min(0),
});

export const categoryFiltersSchema = z.object({
  profileId: z.string().uuid().optional(),
  skip: z.number().int().min(0).default(0).optional(),
  limit: z.number().int().min(1).max(100).default(100).optional(),
});
