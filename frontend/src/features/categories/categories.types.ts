/**
 * Category types for the application
 *
 * NOTE: Categories are USER-level resources, shared across all profiles.
 * We re-export Orval types directly for consistency and type safety.
 */
import { z } from 'zod';

// Re-export types directly from Orval models for API operations
export type {
  CategoryResponse,
  CategoryCreate,
  CategoryUpdate,
  CategoryListResponse,
  ListCategoriesApiV1CategoriesGetParams,
} from '@/api/generated/models';

// Import schemas for UI-specific type inference
import { categoryUIFiltersSchema } from './categories.schemas';

/**
 * Category alias for convenience
 */
export type { CategoryResponse as Category } from '@/api/generated/models';

/**
 * Category list alias (same as CategoryListResponse)
 */
export type { CategoryListResponse as CategoryList } from '@/api/generated/models';

/**
 * API filters type (snake_case parameters)
 */
export type { ListCategoriesApiV1CategoriesGetParams as CategoryApiFilters } from '@/api/generated/models';

/**
 * UI filters type (camelCase parameters)
 * Used in the application layer before transforming to API format
 */
export type CategoryUIFilters = z.infer<typeof categoryUIFiltersSchema>;
