import {
  listBudgetsApiV1BudgetsGet,
  getBudgetApiV1BudgetsBudgetIdGet,
  createBudgetApiV1BudgetsPost,
  updateBudgetApiV1BudgetsBudgetIdPatch,
  deleteBudgetApiV1BudgetsBudgetIdDelete,
} from '@/api/generated/budgets/budgets';

import {
  budgetCreateSchema,
  budgetUpdateSchema,
  budgetResponseSchema,
  budgetListSchema,
} from './budgets.schemas';

import type {
  BudgetCreate,
  BudgetUpdate,
  BudgetResponse,
  BudgetList,
  BudgetFilters,
} from './budgets.types';

export const fetchBudgets = async (filters?: BudgetFilters): Promise<BudgetList> => {
  const response = await listBudgetsApiV1BudgetsGet(filters);
  return budgetListSchema.parse(response.data);
};

export const fetchBudget = async (budgetId: string): Promise<BudgetResponse> => {
  const response = await getBudgetApiV1BudgetsBudgetIdGet(budgetId);
  return budgetResponseSchema.parse(response.data);
};

export const createBudget = async (data: BudgetCreate): Promise<BudgetResponse> => {
  const validatedData = budgetCreateSchema.parse(data);
  const response = await createBudgetApiV1BudgetsPost({ data: validatedData });
  return budgetResponseSchema.parse(response.data);
};

export const updateBudget = async (budgetId: string, data: BudgetUpdate): Promise<BudgetResponse> => {
  const validatedData = budgetUpdateSchema.parse(data);
  const response = await updateBudgetApiV1BudgetsBudgetIdPatch({ budgetId, data: validatedData });
  return budgetResponseSchema.parse(response.data);
};

export const deleteBudget = async (budgetId: string): Promise<void> => {
  await deleteBudgetApiV1BudgetsBudgetIdDelete({ budgetId });
};
