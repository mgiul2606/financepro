// features/categories/hooks/useCategories.ts
/**
 * React Query hooks for Category operations
 * Wraps the generated orval hooks for better usability
 */
import { useQueries } from '@tanstack/react-query';
import {
  useListCategoriesApiV1CategoriesGet,
  getListCategoriesApiV1CategoriesGetQueryKey,
  listCategoriesApiV1CategoriesGet,
} from '@/api/generated/categories/categories';
import { useProfileContext } from '@/contexts/ProfileContext';

export interface CategoryFilters {
  profile_id?: string;
  skip?: number;
  limit?: number;
}

/**
 * Hook to list all categories
 * Fetches categories from all active profiles and aggregates the results
 */
export const useCategories = (filters?: CategoryFilters) => {
  const { activeProfileIds, isLoading: profileLoading } = useProfileContext();

  // Create queries for each active profile
  const queries = useQueries({
    queries: activeProfileIds.map((profileId) => ({
      queryKey: getListCategoriesApiV1CategoriesGetQueryKey({ ...filters, profile_id: profileId }),
      queryFn: () => listCategoriesApiV1CategoriesGet({ ...filters, profile_id: profileId }),
      enabled: !profileLoading && activeProfileIds.length > 0,
    })),
  });

  // Aggregate results from all profiles
  const allCategories = queries.flatMap((query) => query.data?.data?.categories || []);
  const totalCount = queries.reduce((sum, query) => sum + (query.data?.data?.total || 0), 0);
  const isLoading = profileLoading || queries.some((query) => query.isLoading);
  const error = queries.find((query) => query.error)?.error || null;

  const refetch = () => {
    queries.forEach((query) => query.refetch());
  };

  return {
    categories: allCategories,
    total: totalCount,
    isLoading,
    error,
    refetch,
  };
};
