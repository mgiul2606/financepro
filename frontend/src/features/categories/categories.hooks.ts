/**
 * React Query hooks for Category operations
 *
 * NOTE: Categories are USER-level resources, shared across all profiles.
 * Unlike accounts/transactions/budgets/goals, categories do NOT support
 * profile_id filtering. They are fetched once for the entire user.
 */
import { useQueryClient } from '@tanstack/react-query';
import {
  useListCategoriesApiV1CategoriesGet,
  useGetCategoryApiV1CategoriesCategoryIdGet,
  useCreateCategoryApiV1CategoriesPost,
  useUpdateCategoryApiV1CategoriesCategoryIdPut,
  useDeleteCategoryApiV1CategoriesCategoryIdDelete,
  getListCategoriesApiV1CategoriesGetQueryKey,
  type CreateCategoryApiV1CategoriesPostMutationResult,
  type UpdateCategoryApiV1CategoriesCategoryIdPutMutationResult,
  type DeleteCategoryApiV1CategoriesCategoryIdDeleteMutationResult,
} from '@/api/generated/categories/categories';
import type {
  CategoryResponse,
  CategoryCreate,
  CategoryUpdate,
  CategoryListResponse,
} from '@/api/generated/models';
import type { CategoryUIFilters } from './categories.types';

/**
 * Hook to list all categories for the current user
 *
 * Categories are USER-level (not profile-level), so this hook fetches
 * all categories for the authenticated user without profile filtering.
 *
 * @param filters - Optional filters for is_active and is_income
 * @returns Categories list with loading and error states
 */
export const useCategories = (filters?: CategoryUIFilters) => {
  const query = useListCategoriesApiV1CategoriesGet(
    {
      is_active: filters?.isActive,
      is_income: filters?.isIncome,
    },
    {
      query: {
        // Stale time for categories - they don't change often
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    }
  );

  // Extract data from the response envelope
  const data = query.data?.data as CategoryListResponse | undefined;

  return {
    categories: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to get a single category by ID
 *
 * @param categoryId - The ID of the category to fetch
 * @returns Category data with loading and error states
 */
export const useCategory = (categoryId: string) => {
  const query = useGetCategoryApiV1CategoriesCategoryIdGet(
    categoryId,
    {
      query: {
        enabled: !!categoryId && categoryId.length > 0,
      },
    }
  );

  return {
    category: query.data?.data as CategoryResponse | undefined,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to create a new category
 *
 * @returns Mutation function and state for creating categories
 */
export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  const mutation = useCreateCategoryApiV1CategoriesPost({
    mutation: {
      onSuccess: () => {
        // Invalidate the categories list to refetch with new data
        queryClient.invalidateQueries({
          queryKey: getListCategoriesApiV1CategoriesGetQueryKey(),
        });
      },
    },
  });

  const createCategory = async (data: CategoryCreate) => {
    return mutation.mutateAsync({ data });
  };

  return {
    createCategory,
    isCreating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * Hook to update an existing category
 *
 * @returns Mutation function and state for updating categories
 */
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  const mutation = useUpdateCategoryApiV1CategoriesCategoryIdPut({
    mutation: {
      onSuccess: () => {
        // Invalidate the categories list to refetch with updated data
        queryClient.invalidateQueries({
          queryKey: getListCategoriesApiV1CategoriesGetQueryKey(),
        });
      },
    },
  });

  const updateCategory = async (categoryId: string, data: CategoryUpdate) => {
    return mutation.mutateAsync({ categoryId, data });
  };

  return {
    updateCategory,
    isUpdating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * Hook to delete a category
 *
 * @returns Mutation function and state for deleting categories
 */
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  const mutation = useDeleteCategoryApiV1CategoriesCategoryIdDelete({
    mutation: {
      onSuccess: () => {
        // Invalidate the categories list to refetch after deletion
        queryClient.invalidateQueries({
          queryKey: getListCategoriesApiV1CategoriesGetQueryKey(),
        });
      },
    },
  });

  const deleteCategory = async (categoryId: string) => {
    return mutation.mutateAsync({ categoryId });
  };

  return {
    deleteCategory,
    isDeleting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
