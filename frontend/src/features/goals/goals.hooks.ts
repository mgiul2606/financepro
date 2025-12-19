import { useQueryClient, useQueries } from '@tanstack/react-query';
import {
  useGetGoalApiV1GoalsGoalIdGet,
  useCreateGoalApiV1GoalsPost,
  useUpdateGoalApiV1GoalsGoalIdPatch,
  useDeleteGoalApiV1GoalsGoalIdDelete,
  getListGoalsApiV1GoalsGetQueryKey,
  listGoalsApiV1GoalsGet,
} from '@/api/generated/financial-goals/financial-goals';
import { useProfileContext } from '@/contexts/ProfileContext';

import type { GoalCreate, GoalUpdate, GoalFilters, GoalResponse } from './goals.types';

export const useGoals = (filters?: GoalFilters) => {
  const { activeProfileIds, isLoading: profileLoading } = useProfileContext();

  const queries = useQueries({
    queries: activeProfileIds.map((profileId) => ({
      queryKey: getListGoalsApiV1GoalsGetQueryKey({ ...filters, profile_id: profileId }),
      queryFn: () => listGoalsApiV1GoalsGet({ ...filters, profile_id: profileId }),
      enabled: !profileLoading && activeProfileIds.length > 0,
    })),
  });

  const allGoals = queries.flatMap((query) => query.data?.data?.items || []);
  const totalCount = queries.reduce((sum, query) => sum + (query.data?.data?.total || 0), 0);
  const isLoading = profileLoading || queries.some((query) => query.isLoading);
  const error = queries.find((query) => query.error)?.error || null;

  const refetch = () => queries.forEach((query) => query.refetch());

  return {
    goals: allGoals as GoalResponse[],
    total: totalCount,
    isLoading,
    error,
    refetch,
  };
};

export const useGoal = (goalId: string) => {
  const query = useGetGoalApiV1GoalsGoalIdGet(goalId, {
    query: { enabled: !!goalId },
  });
  return {
    goal: query.data?.data as GoalResponse | undefined,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  const mutation = useCreateGoalApiV1GoalsPost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGoalsApiV1GoalsGetQueryKey() });
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

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();
  const mutation = useUpdateGoalApiV1GoalsGoalIdPatch({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGoalsApiV1GoalsGetQueryKey() });
      },
    },
  });
  return {
    updateGoal: (goalId: string, data: GoalUpdate) => mutation.mutateAsync({ goalId, data }),
    isUpdating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();
  const mutation = useDeleteGoalApiV1GoalsGoalIdDelete({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGoalsApiV1GoalsGetQueryKey() });
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
