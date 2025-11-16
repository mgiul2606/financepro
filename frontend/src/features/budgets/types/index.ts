export type BudgetPeriod = 'monthly' | 'quarterly' | 'yearly' | 'custom';
export type BudgetStatus = 'active' | 'exceeded' | 'completed';

export interface Budget {
  id: string;
  name: string;
  category: string;
  amount: number;
  spent: number;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
  status: BudgetStatus;
  alertThreshold?: number; // percentage (e.g., 80 for 80%)
  createdAt: string;
  updatedAt: string;
}

export interface BudgetCreate {
  name: string;
  category: string;
  amount: number;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
  alertThreshold?: number;
}

export interface BudgetUpdate {
  name?: string;
  category?: string;
  amount?: number;
  period?: BudgetPeriod;
  startDate?: string;
  endDate?: string;
  alertThreshold?: number;
}
