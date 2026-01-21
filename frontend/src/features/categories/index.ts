// features/categories/index.ts

/**
 * Categories feature public API
 *
 * NOTE: Categories are USER-level resources, shared across all profiles.
 * Unlike accounts/transactions/budgets/goals, categories do NOT support
 * profile_id filtering.
 */

// Hooks
export {
  useCategories,
  useCategory,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from './categories.hooks';

// Schemas
export {
  categoryCreateSchema,
  categoryUpdateSchema,
  categoryResponseSchema,
  categoryListSchema,
  categoryFiltersSchema,
  categoryUIFiltersSchema,
} from './categories.schemas';

// Types
export type {
  CategoryResponse,
  CategoryCreate,
  CategoryUpdate,
  CategoryListResponse,
  Category,
  CategoryList,
  CategoryApiFilters,
  CategoryUIFilters,
} from './categories.types';

// Constants
export {
  CATEGORY_ICON_OPTIONS,
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_TYPE_OPTIONS,
  CATEGORY_STATUS_OPTIONS,
} from './categories.constants';
