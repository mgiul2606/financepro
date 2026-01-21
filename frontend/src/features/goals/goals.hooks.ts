/**
 * React Query hooks for Goal operations
 *
 * Uses factory pattern for consistency with other features (accounts, transactions)
 */
import {
  useGetGoalApiV1GoalsGoalIdGet,
  useCreateGoalApiV1GoalsPost,
  useUpdateGoalApiV1GoalsGoalIdPatch,
  useDeleteGoalApiV1GoalsGoalIdDelete,
  getListGoalsApiV1GoalsGetQueryKey,
  listGoalsApiV1GoalsGet,
  type listGoalsApiV1GoalsGetResponse,
  type CreateGoalApiV1GoalsPostMutationResult,
  type UpdateGoalApiV1GoalsGoalIdPatchMutationResult,
  type DeleteGoalApiV1GoalsGoalIdDeleteMutationResult,
} from '@/api/generated/financial-goals/financial-goals';
import type {
  FinancialGoalCreate,
  FinancialGoalUpdate,
  FinancialGoalResponse,
  ListGoalsApiV1GoalsGetParams,
} from '@/api/generated/models';
import { useProfileContext } from '@/contexts/ProfileContext';
import { createMultiProfileListHook } from '@/hooks/factories/createMultiProfileListHook';
import { createGetByIdHook } from '@/hooks/factories/createGetByIdHook';
import { createCreateMutationHook } from '@/hooks/factories/createCreateMutationHook';
import { createUpdateMutationHook } from '@/hooks/factories/createUpdateMutationHook';
import { createDeleteMutationHook } from '@/hooks/factories/createDeleteMutationHook';
import type { ExtractOrvalData } from '@/lib/orval-types';
import type { GoalList, GoalFilters, GoalResponse } from './goals.types';

/**
 * Base hook for listing goals across multiple profiles
 * Created using the multi-profile list hook factory
 */
const useGoalsBase = createMultiProfileListHook<
  ListGoalsApiV1GoalsGetParams,
  listGoalsApiV1GoalsGetResponse,
  FinancialGoalResponse
>({
  getQueryKey: getListGoalsApiV1GoalsGetQueryKey,
  queryFn: listGoalsApiV1GoalsGet,
  extractItems: (response) => (response.data as GoalList)?.items ?? [],
  extractTotal: (response) => (response.data as GoalList)?.total ?? 0,
});

/**
 * Hook to list all goals
 * Fetches goals from all active profiles and aggregates the results
 *
 * @param filters - Optional filters for the goals query
 */
export const useGoals = (filters?: GoalFilters) => {
  const { activeProfileIds, isLoading: profileLoading } = useProfileContext();

  const result = useGoalsBase(activeProfileIds, {
    enabled: !profileLoading,
  });

  return {
    goals: result.items as GoalResponse[],
    total: result.total,
    isLoading: result.isLoading || profileLoading,
    error: result.error,
    refetch: result.refetch,
  };
};

/**
 * Base hook for getting a single goal by ID
 * Created using the GET by ID hook factory
 */
const useGoalBase = createGetByIdHook<
  { data: FinancialGoalResponse; status: number },
  FinancialGoalResponse
>({
  useQuery: useGetGoalApiV1GoalsGoalIdGet,
});

/**
 * Hook to get a single goal by ID
 */
export const useGoal = (goalId: string) => {
  const result = useGoalBase(goalId);

  return {
    goal: result.data as GoalResponse | undefined,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
};

/**
 * Base hook for creating goals
 * Created using the CREATE mutation hook factory
 */
const useCreateGoalBase = createCreateMutationHook<
  CreateGoalApiV1GoalsPostMutationResult,
  FinancialGoalCreate
>({
  useMutation: useCreateGoalApiV1GoalsPost,
  defaultOptions: {
    invalidateKeys: getListGoalsApiV1GoalsGetQueryKey(),
  },
});

/**
 * Hook to create a new goal
 */
export const useCreateGoal = () => {
  const { mutateAsync, isPending, error, reset } = useCreateGoalBase();

  return {
    createGoal: mutateAsync,
    isCreating: isPending,
    error,
    reset,
  };
};

/**
 * Base hook for updating goals
 * Created using the UPDATE mutation hook factory
 */
const useUpdateGoalBase = createUpdateMutationHook<
  UpdateGoalApiV1GoalsGoalIdPatchMutationResult,
  FinancialGoalUpdate,
  ExtractOrvalData<UpdateGoalApiV1GoalsGoalIdPatchMutationResult>,
  'goalId'
>({
  useMutation: useUpdateGoalApiV1GoalsGoalIdPatch,
  idParamName: 'goalId',
  defaultOptions: {
    invalidateKeys: getListGoalsApiV1GoalsGetQueryKey(),
  },
});

/**
 * Hook to update an existing goal
 */
export const useUpdateGoal = () => {
  const { mutateAsync, isPending, error, reset } = useUpdateGoalBase();

  return {
    updateGoal: mutateAsync,
    isUpdating: isPending,
    error,
    reset,
  };
};

/**
 * Base hook for deleting goals
 * Created using the DELETE mutation hook factory
 */
const useDeleteGoalBase = createDeleteMutationHook<
  DeleteGoalApiV1GoalsGoalIdDeleteMutationResult,
  'goalId'
>({
  useMutation: useDeleteGoalApiV1GoalsGoalIdDelete,
  idParamName: 'goalId',
  defaultOptions: {
    invalidateKeys: getListGoalsApiV1GoalsGetQueryKey(),
  },
});

/**
 * Hook to delete a goal
 */
export const useDeleteGoal = () => {
  const { mutateAsync, isPending, error, reset } = useDeleteGoalBase();

  return {
    deleteGoal: mutateAsync,
    isDeleting: isPending,
    error,
    reset,
  };
};
