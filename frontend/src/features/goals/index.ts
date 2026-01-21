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

// Schemas
export {
  goalCreateSchema,
  goalUpdateSchema,
  goalResponseSchema,
  goalListSchema,
  goalFiltersSchema,
  goalTypeSchema,
  goalStatusSchema,
  goalPrioritySchema,
  goalCategorySchema,
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
  GoalPriority,
  GoalCategory,
} from './goals.types';

// Constants
export {
  GOAL_TYPE_OPTIONS,
  GOAL_STATUS_OPTIONS,
  GOAL_PRIORITY_OPTIONS,
  GOAL_CATEGORY_OPTIONS,
  CURRENCY_OPTIONS,
} from './goals.constants';
