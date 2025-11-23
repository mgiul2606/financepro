/**
 * React Query hooks for Financial Goal operations
 * Wraps the generated orval hooks for better usability
 */
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  useListGoalsApiV1GoalsGet,
  useGetGoalApiV1GoalsGoalIdGet,
  useCreateGoalApiV1GoalsPost,
  useUpdateGoalApiV1GoalsGoalIdPatch,
  useDeleteGoalApiV1GoalsGoalIdDelete,
  getListGoalsApiV1GoalsGetQueryKey,
} from '@/api/generated/financial-goals/financial-goals';
import { useProfileContext } from '@/contexts/ProfileContext';
import type { GoalCreate, GoalUpdate, GoalFilters } from '../types';

/**
 * Hook to list all financial goals with optional filters
 * Goals are USER-LEVEL entities, so we fetch all goals for the user
 * and they will be filtered by scope_profile_ids on the backend
 */
export const useGoals = (filters?: GoalFilters) => {
  const { activeProfileIds, isLoading: profileLoading, isInitialized } = useProfileContext();
  const queryClient = useQueryClient();

  // Single query for all user goals (goals are USER-LEVEL, not profile-level)
  const query = useListGoalsApiV1GoalsGet(filters, {
    query: {
      enabled: !profileLoading && isInitialized,
    },
  });

  // Refetch when active profiles change to ensure fresh data
  useEffect(() => {
    if (isInitialized && !profileLoading && activeProfileIds.length > 0) {
      query.refetch();
    }
  }, [activeProfileIds, isInitialized, profileLoading]);

  return {
    goals: query.data?.data?.items || [],
    total: query.data?.data?.total || 0,
    isLoading: profileLoading || query.isLoading,
    error: query.error,
    refetch: query.refetch,
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

