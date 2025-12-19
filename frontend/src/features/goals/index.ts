// features/goals/index.ts
/**
 * Public API for goals feature
 */

// Pages
export { GoalsPage } from './pages/GoalsPage';

// Components
export { GoalForm } from './components/GoalForm';

// Hooks
export {
  useGoals,
  useGoal,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
} from './goals.hooks';

// API
export {
  fetchGoals,
  fetchGoal,
  createGoal,
  updateGoal,
  deleteGoal,
} from './goals.api';

// Schemas
export {
  goalCreateSchema,
  goalUpdateSchema,
  goalResponseSchema,
  goalListSchema,
  goalFiltersSchema,
  goalTypeSchema,
  goalStatusSchema,
} from './goals.schemas';

// Types
export type {
  GoalCreate,
  GoalUpdate,
  GoalResponse,
  Goal,
  GoalList,
  GoalFilters,
  GoalType,
  GoalStatus,
} from './goals.types';

// Constants
export { GOAL_TYPE_OPTIONS, GOAL_STATUS_OPTIONS } from './goals.types';
