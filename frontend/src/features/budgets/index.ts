// features/budgets/index.ts
/**
 * Public API for budgets feature
 */

// Pages
export { BudgetsPage } from './pages/BudgetsPage';

// Components
export { BudgetForm } from './components/BudgetForm';

// Hooks
export {
  useBudgets,
  useBudget,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
} from './hooks/useBudgets';

// Types
export type {
  Budget,
  BudgetCreate,
  BudgetUpdate,
  BudgetPeriod,
  BudgetStatus,
} from './types';
