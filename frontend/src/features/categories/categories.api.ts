import { listCategoriesApiV1CategoriesGet } from '@/api/generated/categories/categories';
import { categoryListSchema } from './categories.schemas';
import type { CategoryList, CategoryFilters } from './categories.types';

export const fetchCategories = async (filters?: CategoryFilters): Promise<CategoryList> => {
  const apiFilters = filters ? {
    profile_id: filters.profileId,
    skip: filters.skip,
    limit: filters.limit,
  } : undefined;

  const response = await listCategoriesApiV1CategoriesGet(apiFilters);
  return categoryListSchema.parse(response.data);
};
