import { useQueries } from '@tanstack/react-query';
import {
  getListCategoriesApiV1CategoriesGetQueryKey,
  listCategoriesApiV1CategoriesGet,
} from '@/api/generated/categories/categories';
import { useProfileContext } from '@/contexts/ProfileContext';
import type { CategoryFilters, CategoryResponse } from './categories.types';

export const useCategories = (filters?: CategoryFilters) => {
  const { activeProfileIds, isLoading: profileLoading } = useProfileContext();

  const queries = useQueries({
    queries: activeProfileIds.map((profileId) => ({
      queryKey: getListCategoriesApiV1CategoriesGetQueryKey({
        ...filters,
        profile_id: profileId
      }),
      queryFn: () => listCategoriesApiV1CategoriesGet({
        ...filters,
        profile_id: profileId
      }),
      enabled: !profileLoading && activeProfileIds.length > 0,
    })),
  });

  const allCategories = queries.flatMap((query) => query.data?.data?.categories || []);
  const totalCount = queries.reduce((sum, query) => sum + (query.data?.data?.total || 0), 0);
  const isLoading = profileLoading || queries.some((query) => query.isLoading);
  const error = queries.find((query) => query.error)?.error || null;

  const refetch = () => queries.forEach((query) => query.refetch());

  return {
    categories: allCategories as CategoryResponse[],
    total: totalCount,
    isLoading,
    error,
    refetch,
  };
};
