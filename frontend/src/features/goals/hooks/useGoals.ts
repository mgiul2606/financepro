// features/goals/hooks/useGoals.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockGoalsApi } from '../api/mockGoalsApi';
import type { GoalCreate, GoalUpdate } from '../types';

const QUERY_KEY = 'goals';

/**
 * Hook to list all goals
 */
export const useGoals = () => {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => mockGoalsApi.getAll(),
  });
};

/**
 * Hook to get a single goal by ID
 */
export const useGoal = (id: string) => {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => mockGoalsApi.getById(id),
    enabled: !!id,
  });
};

/**
 * Hook to create a new goal
 */
export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GoalCreate) => mockGoalsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

/**
 * Hook to update an existing goal
 */
export const useUpdateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: GoalUpdate }) =>
      mockGoalsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

/**
 * Hook to delete a goal
 */
export const useDeleteGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mockGoalsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};
