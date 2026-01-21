/**
 * React Query hooks for Budget operations
 *
 * Uses hook factories for consistent, type-safe API interactions
 */
import {
  useGetBudgetApiV1BudgetsBudgetIdGet,
  useCreateBudgetApiV1BudgetsPost,
  useUpdateBudgetApiV1BudgetsBudgetIdPatch,
  useDeleteBudgetApiV1BudgetsBudgetIdDelete,
  getListBudgetsApiV1BudgetsGetQueryKey,
  listBudgetsApiV1BudgetsGet,
  type CreateBudgetApiV1BudgetsPostMutationResult,
  type UpdateBudgetApiV1BudgetsBudgetIdPatchMutationResult,
  type DeleteBudgetApiV1BudgetsBudgetIdDeleteMutationResult,
  type listBudgetsApiV1BudgetsGetResponse,
} from '@/api/generated/budgets/budgets';
import type {
  BudgetCreate,
  BudgetUpdate,
  BudgetResponse,
  ListBudgetsApiV1BudgetsGetParams,
} from '@/api/generated/models';
import { useProfileContext } from '@/contexts/ProfileContext';
import { createMultiProfileListHook } from '@/hooks/factories/createMultiProfileListHook';
import { createGetByIdHook } from '@/hooks/factories/createGetByIdHook';
import { createCreateMutationHook } from '@/hooks/factories/createCreateMutationHook';
import { createUpdateMutationHook } from '@/hooks/factories/createUpdateMutationHook';
import { createDeleteMutationHook } from '@/hooks/factories/createDeleteMutationHook';
import type { ExtractOrvalData } from '@/lib/orval-types';
import type { BudgetList, BudgetFilters } from './budgets.types';

/**
 * Base hook for listing budgets across multiple profiles
 * Created using the multi-profile list hook factory
 */
const useBudgetsBase = createMultiProfileListHook<
  ListBudgetsApiV1BudgetsGetParams,
  listBudgetsApiV1BudgetsGetResponse,
  BudgetResponse
>({
  getQueryKey: getListBudgetsApiV1BudgetsGetQueryKey,
  queryFn: listBudgetsApiV1BudgetsGet,
  extractItems: (response) => (response.data as BudgetList)?.items ?? [],
  extractTotal: (response) => (response.data as BudgetList)?.total ?? 0,
});

/**
 * Hook to list all budgets
 * Fetches budgets from all active profiles and aggregates the results
 *
 * @param filters - Optional filters for the budget list (reserved for future use)
 */
export const useBudgets = (filters?: BudgetFilters) => {
  const { activeProfileIds, isLoading: profileLoading } = useProfileContext();

  const result = useBudgetsBase(activeProfileIds, {
    enabled: !profileLoading,
  });

  return {
    budgets: result.items,
    total: result.total,
    isLoading: result.isLoading || profileLoading,
    error: result.error,
    refetch: result.refetch,
  };
};

/**
 * Base hook for getting a single budget by ID
 * Created using the GET by ID hook factory
 */
const useBudgetBase = createGetByIdHook<
  { data: BudgetResponse; status: number },
  BudgetResponse
>({
  useQuery: useGetBudgetApiV1BudgetsBudgetIdGet,
});

/**
 * Hook to get a single budget by ID
 */
export const useBudget = (budgetId: string) => {
  const result = useBudgetBase(budgetId);

  return {
    budget: result.data,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
};

/**
 * Base hook for creating budgets
 * Created using the CREATE mutation hook factory
 */
const useCreateBudgetBase = createCreateMutationHook<
  CreateBudgetApiV1BudgetsPostMutationResult,
  BudgetCreate
>({
  useMutation: useCreateBudgetApiV1BudgetsPost,
  defaultOptions: {
    invalidateKeys: getListBudgetsApiV1BudgetsGetQueryKey(),
  },
});

/**
 * Hook to create a new budget
 */
export const useCreateBudget = () => {
  const { mutateAsync, isPending, error, reset } = useCreateBudgetBase();

  return {
    createBudget: mutateAsync,
    isCreating: isPending,
    error,
    reset,
  };
};

/**
 * Base hook for updating budgets
 * Created using the UPDATE mutation hook factory
 */
const useUpdateBudgetBase = createUpdateMutationHook<
  UpdateBudgetApiV1BudgetsBudgetIdPatchMutationResult,
  BudgetUpdate,
  ExtractOrvalData<UpdateBudgetApiV1BudgetsBudgetIdPatchMutationResult>,
  'budgetId'
>({
  useMutation: useUpdateBudgetApiV1BudgetsBudgetIdPatch,
  idParamName: 'budgetId',
  defaultOptions: {
    invalidateKeys: getListBudgetsApiV1BudgetsGetQueryKey(),
  },
});

/**
 * Hook to update an existing budget
 */
export const useUpdateBudget = () => {
  const { mutateAsync, isPending, error, reset } = useUpdateBudgetBase();

  return {
    updateBudget: mutateAsync,
    isUpdating: isPending,
    error,
    reset,
  };
};

/**
 * Base hook for deleting budgets
 * Created using the DELETE mutation hook factory
 */
const useDeleteBudgetBase = createDeleteMutationHook<
  DeleteBudgetApiV1BudgetsBudgetIdDeleteMutationResult,
  'budgetId'
>({
  useMutation: useDeleteBudgetApiV1BudgetsBudgetIdDelete,
  idParamName: 'budgetId',
  defaultOptions: {
    invalidateKeys: getListBudgetsApiV1BudgetsGetQueryKey(),
  },
});

/**
 * Hook to delete a budget
 */
export const useDeleteBudget = () => {
  const { mutateAsync, isPending, error, reset } = useDeleteBudgetBase();

  return {
    deleteBudget: mutateAsync,
    isDeleting: isPending,
    error,
    reset,
  };
};
