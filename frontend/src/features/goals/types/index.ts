/**
 * Financial Goal Types - Re-export from generated API types
 * This ensures consistency with the backend API
 */

// Re-export types from generated API
export type {
  FinancialGoalResponse as Goal,
  FinancialGoalCreate as GoalCreate,
  FinancialGoalUpdate as GoalUpdate,
  GoalType,
  GoalStatus,
  GoalMilestoneResponse,
  ListGoalsApiV1GoalsGetParams as GoalFilters,
} from '@/api/generated/models';
