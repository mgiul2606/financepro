// features/goals/api/mockGoalsApi.ts
import type { Goal, GoalCreate, GoalUpdate } from '../types';

let mockGoals: Goal[] = [
  {
    id: '1',
    name: 'Emergency Fund',
    description: 'Build emergency savings for 6 months',
    targetAmount: 15000,
    currentAmount: 8500,
    currency: 'EUR',
    targetDate: '2026-06-30',
    status: 'in_progress',
    priority: 'high',
    category: 'Savings',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-11-15T00:00:00Z',
  },
  {
    id: '2',
    name: 'Vacation Fund',
    description: 'Save for summer vacation',
    targetAmount: 3000,
    currentAmount: 1200,
    currency: 'EUR',
    targetDate: '2026-07-01',
    status: 'in_progress',
    priority: 'medium',
    category: 'Travel',
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-11-15T00:00:00Z',
  },
];

let nextId = 3;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockGoalsApi = {
  async getAll(): Promise<Goal[]> {
    await delay(300);
    return [...mockGoals];
  },

  async getById(id: string): Promise<Goal | null> {
    await delay(200);
    return mockGoals.find((g) => g.id === id) || null;
  },

  async create(data: GoalCreate): Promise<Goal> {
    await delay(300);
    const newGoal: Goal = {
      ...data,
      id: String(nextId++),
      currentAmount: 0,
      currency: data.currency || 'EUR',
      status: 'in_progress',
      priority: data.priority || 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockGoals.push(newGoal);
    return newGoal;
  },

  async update(id: string, data: GoalUpdate): Promise<Goal> {
    await delay(300);
    const index = mockGoals.findIndex((g) => g.id === id);
    if (index === -1) throw new Error('Goal not found');

    mockGoals[index] = {
      ...mockGoals[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return mockGoals[index];
  },

  async delete(id: string): Promise<void> {
    await delay(200);
    mockGoals = mockGoals.filter((g) => g.id !== id);
  },
};
