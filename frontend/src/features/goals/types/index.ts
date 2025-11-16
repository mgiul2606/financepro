// features/goals/types/index.ts
export type GoalStatus = 'in_progress' | 'achieved' | 'abandoned';
export type GoalPriority = 'low' | 'medium' | 'high';

export interface Goal {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate: string;
  status: GoalStatus;
  priority: GoalPriority;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalCreate {
  name: string;
  description?: string;
  targetAmount: number;
  currency?: string;
  targetDate: string;
  priority?: GoalPriority;
  category?: string;
}

export interface GoalUpdate {
  name?: string;
  description?: string;
  targetAmount?: number;
  currentAmount?: number;
  currency?: string;
  targetDate?: string;
  status?: GoalStatus;
  priority?: GoalPriority;
  category?: string;
}
