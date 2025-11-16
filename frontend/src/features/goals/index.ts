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
} from './hooks/useGoals';

// Types
export type {
  Goal,
  GoalCreate,
  GoalUpdate,
  GoalStatus,
  GoalPriority,
} from './types';
