import {
  listGoalsApiV1GoalsGet,
  getGoalApiV1GoalsGoalIdGet,
  createGoalApiV1GoalsPost,
  updateGoalApiV1GoalsGoalIdPatch,
  deleteGoalApiV1GoalsGoalIdDelete,
} from '@/api/generated/financial-goals/financial-goals';

import {
  goalCreateSchema,
  goalUpdateSchema,
  goalResponseSchema,
  goalListSchema,
} from './goals.schemas';

import type {
  GoalCreate,
  GoalUpdate,
  GoalResponse,
  GoalList,
  GoalFilters,
} from './goals.types';

export const fetchGoals = async (filters?: GoalFilters): Promise<GoalList> => {
  const response = await listGoalsApiV1GoalsGet(filters);
  return goalListSchema.parse(response.data);
};

export const fetchGoal = async (goalId: string): Promise<GoalResponse> => {
  const response = await getGoalApiV1GoalsGoalIdGet(goalId);
  return goalResponseSchema.parse(response.data);
};

export const createGoal = async (data: GoalCreate): Promise<GoalResponse> => {
  const validatedData = goalCreateSchema.parse(data);
  const response = await createGoalApiV1GoalsPost({ data: validatedData });
  return goalResponseSchema.parse(response.data);
};

export const updateGoal = async (goalId: string, data: GoalUpdate): Promise<GoalResponse> => {
  const validatedData = goalUpdateSchema.parse(data);
  const response = await updateGoalApiV1GoalsGoalIdPatch({ goalId, data: validatedData });
  return goalResponseSchema.parse(response.data);
};

export const deleteGoal = async (goalId: string): Promise<void> => {
  await deleteGoalApiV1GoalsGoalIdDelete({ goalId });
};
