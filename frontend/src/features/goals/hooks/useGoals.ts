/**
 * React Query hooks for Financial Goal operations
 * Wraps the generated orval hooks for better usability
 */
import { useQueryClient, useQueries } from '@tanstack/react-query';
import {
  useListGoalsApiV1GoalsGet,
  useGetGoalApiV1GoalsGoalIdGet,
  useCreateGoalApiV1GoalsPost,
  useUpdateGoalApiV1GoalsGoalIdPatch,
  useDeleteGoalApiV1GoalsGoalIdDelete,
  useCompleteGoalApiV1GoalsGoalIdCompletePost,
  getListGoalsApiV1GoalsGetQueryKey,
  listGoalsApiV1GoalsGet,
} from '@/api/generated/financial-goals/financial-goals';
import { useProfileContext } from '@/contexts/ProfileContext';
import type { GoalCreate, GoalUpdate, GoalFilters } from '../types';

/**
 * Hook to list all financial goals with optional filters
 * Fetches goals from all active profiles and aggregates the results
 */
export const useGoals = (filters?: GoalFilters) => {
  const { activeProfileIds, isLoading: profileLoading } = useProfileContext();

  // Create queries for each active profile
  const queries = useQueries({
    queries: activeProfileIds.map((profileId) => ({
      queryKey: getListGoalsApiV1GoalsGetQueryKey({ ...filters, profile_id: profileId }),
      queryFn: () => listGoalsApiV1GoalsGet({ ...filters, profile_id: profileId }),
      enabled: !profileLoading && activeProfileIds.length > 0,
    })),
  });

  // Aggregate results from all profiles
  const allGoals = queries.flatMap((query) => query.data?.data?.items || []);
  const totalCount = queries.reduce((sum, query) => sum + (query.data?.data?.total || 0), 0);
  const isLoading = profileLoading || queries.some((query) => query.isLoading);
  const error = queries.find((query) => query.error)?.error || null;

  const refetch = () => {
    queries.forEach((query) => query.refetch());
  };

  return {
    goals: allGoals,
    total: totalCount,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook to get a single financial goal by ID
 */
export const useGoal = (goalId: string) => {
  const query = useGetGoalApiV1GoalsGoalIdGet(goalId, {
    query: {
      enabled: !!goalId,
    },
  });

  return {
    goal: query.data?.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to create a new financial goal
 */
export const useCreateGoal = () => {
  const queryClient = useQueryClient();

  const mutation = useCreateGoalApiV1GoalsPost({
    mutation: {
      onSuccess: () => {
        // Invalidate goals list to refetch
        queryClient.invalidateQueries({
          queryKey: getListGoalsApiV1GoalsGetQueryKey(),
        });
      },
    },
  });

  return {
    createGoal: (data: GoalCreate) => mutation.mutateAsync({ data }),
    isCreating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * Hook to update an existing financial goal
 */
export const useUpdateGoal = () => {
  const queryClient = useQueryClient();

  const mutation = useUpdateGoalApiV1GoalsGoalIdPatch({
    mutation: {
      onSuccess: () => {
        // Invalidate goals list to refetch
        queryClient.invalidateQueries({
          queryKey: getListGoalsApiV1GoalsGetQueryKey(),
        });
      },
    },
  });

  return {
    updateGoal: (goalId: string, data: GoalUpdate) =>
      mutation.mutateAsync({ goalId, data }),
    isUpdating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * Hook to delete a financial goal
 */
export const useDeleteGoal = () => {
  const queryClient = useQueryClient();

  const mutation = useDeleteGoalApiV1GoalsGoalIdDelete({
    mutation: {
      onSuccess: () => {
        // Invalidate goals list to refetch
        queryClient.invalidateQueries({
          queryKey: getListGoalsApiV1GoalsGetQueryKey(),
        });
      },
    },
  });

  return {
    deleteGoal: (goalId: string) => mutation.mutateAsync({ goalId }),
    isDeleting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * Hook to mark a goal as completed
 */
export const useCompleteGoal = () => {
  const queryClient = useQueryClient();

  const mutation = useCompleteGoalApiV1GoalsGoalIdCompletePost({
    mutation: {
      onSuccess: () => {
        // Invalidate goals list to refetch
        queryClient.invalidateQueries({
          queryKey: getListGoalsApiV1GoalsGetQueryKey(),
        });
      },
    },
  });

  return {
    completeGoal: (goalId: string) => mutation.mutateAsync({ goalId }),
    isCompleting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
