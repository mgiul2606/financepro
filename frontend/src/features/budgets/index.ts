// features/budgets/index.ts
/**
 * Public API for budgets feature
 */

// Pages
export { BudgetsPage } from './pages/BudgetsPage';

// Components
export { BudgetForm } from './components/BudgetForm';
export { BudgetDetailsModal } from './components/BudgetDetailsModal';

// Hooks
export {
  useBudgets,
  useBudget,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
} from './budgets.hooks';

// Schemas
export {
  budgetCreateSchema,
  budgetUpdateSchema,
  budgetResponseSchema,
  budgetListSchema,
  budgetFiltersSchema,
  periodTypeSchema,
  budgetCategoryAllocationSchema,
} from './budgets.schemas';

// Types
export type {
  BudgetCreate,
  BudgetUpdate,
  BudgetResponse,
  Budget,
  BudgetList,
  BudgetFilters,
  PeriodType,
  BudgetCategoryAllocation,
} from './budgets.types';

// Constants
export { PERIOD_TYPE_OPTIONS } from './budgets.types';
