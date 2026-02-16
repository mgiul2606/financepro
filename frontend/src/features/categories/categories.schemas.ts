/**
 * Category schemas with runtime validation using Zod
 *
 * This file bridges Orval-generated schemas with application-specific needs:
 * - Imports base Zod schemas auto-generated from OpenAPI spec
 * - Provides simple, friendly aliases for generated schemas
 * - Defines UI-specific schemas not present in the API
 *
 * NOTE: Categories are USER-level resources, shared across all profiles.
 * The API does NOT support profile_id filtering.
 */
import { z } from 'zod';

// Import auto-generated Zod schemas from Orval
import {
  ListCategoriesApiV1CategoriesGetResponse,
  ListCategoriesApiV1CategoriesGetQueryParams,
  CreateCategoryApiV1CategoriesPostBody,
  GetCategoryApiV1CategoriesCategoryIdGetResponse,
  UpdateCategoryApiV1CategoriesCategoryIdPutBody,
} from '@/api/generated/zod/categories/categories.zod';

/**
 * Category Create Schema
 * Base schema from Orval for creating new categories
 */
export const categoryCreateSchema = CreateCategoryApiV1CategoriesPostBody;

/**
 * Category Update Schema
 * Base schema from Orval for partial updates
 */
export const categoryUpdateSchema = UpdateCategoryApiV1CategoriesCategoryIdPutBody;

/**
 * Category Response Schema
 * Validates data returned from the API
 */
export const categoryResponseSchema = GetCategoryApiV1CategoriesCategoryIdGetResponse;

/**
 * Category List Response Schema
 * Response format: { items: CategoryResponse[], total: number }
 */
export const categoryListSchema = ListCategoriesApiV1CategoriesGetResponse;

/**
 * Category Query Filters Schema
 * API supports ONLY: is_active and is_income filters
 * NOTE: No profile_id, skip, or limit parameters are supported
 */
export const categoryFiltersSchema = ListCategoriesApiV1CategoriesGetQueryParams;

/**
 * UI-specific filter schema with camelCase naming
 * Maps to snake_case API parameters
 */
export const categoryUIFiltersSchema = z.object({
  isActive: z.boolean().optional(),
  isIncome: z.boolean().optional(),
});
