/**
 * Category schemas with runtime validation using Zod
 *
 * Bridges Orval-generated schemas with application-specific needs
 */
import { z } from 'zod';

// Import auto-generated Zod schemas from Orval
import {
  listCategoriesApiV1CategoriesGetResponse,
} from '@/api/generated/zod/categories/categories.zod';

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

export const categoryListSchema = listCategoriesApiV1CategoriesGetResponse;

export const categoryFiltersSchema = z.object({
  profileId: z.string().uuid().optional(),
  skip: z.number().int().min(0).default(0).optional(),
  limit: z.number().int().min(1).max(100).default(100).optional(),
});
