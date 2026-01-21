// features/goals/goals.constants.ts

/**
 * Goal type options for forms and filters
 */
export const GOAL_TYPE_OPTIONS = [
  { value: 'savings', label: 'goals.types.savings' },
  { value: 'debt_reduction', label: 'goals.types.debt_reduction' },
  { value: 'investment', label: 'goals.types.investment' },
  { value: 'purchase', label: 'goals.types.purchase' },
  { value: 'emergency_fund', label: 'goals.types.emergency_fund' },
  { value: 'retirement', label: 'goals.types.retirement' },
  { value: 'custom', label: 'goals.types.custom' },
] as const;

/**
 * Goal status options for forms and filters
 */
export const GOAL_STATUS_OPTIONS = [
  { value: 'not_started', label: 'goals.statuses.not_started' },
  { value: 'in_progress', label: 'goals.statuses.in_progress' },
  { value: 'completed', label: 'goals.statuses.completed' },
  { value: 'paused', label: 'goals.statuses.paused' },
  { value: 'cancelled', label: 'goals.statuses.cancelled' },
] as const;

/**
 * Goal priority options for forms
 */
export const GOAL_PRIORITY_OPTIONS = [
  { value: 'low', label: 'goals.priorities.low' },
  { value: 'medium', label: 'goals.priorities.medium' },
  { value: 'high', label: 'goals.priorities.high' },
] as const;

/**
 * Goal category options for forms
 */
export const GOAL_CATEGORY_OPTIONS = [
  { value: 'Savings', label: 'goals.categories.savings' },
  { value: 'Investment', label: 'goals.categories.investment' },
  { value: 'Travel', label: 'goals.categories.travel' },
  { value: 'Education', label: 'goals.categories.education' },
  { value: 'Home', label: 'goals.categories.home' },
  { value: 'Other', label: 'goals.categories.other' },
] as const;

/**
 * Available currency options for goals
 * Imported from accounts for consistency
 */
export { CURRENCY_OPTIONS } from '@/features/accounts/accounts.constants';
