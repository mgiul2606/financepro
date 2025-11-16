import type { Budget, BudgetCreate, BudgetUpdate } from '../types';

let mockBudgets: Budget[] = [
  {
    id: '1',
    name: 'Groceries Budget',
    category: 'Groceries',
    amount: 500,
    spent: 245.50,
    period: 'monthly',
    startDate: '2025-11-01',
    endDate: '2025-11-30',
    status: 'active',
    alertThreshold: 80,
    createdAt: '2025-11-01T00:00:00Z',
    updatedAt: '2025-11-15T00:00:00Z',
  },
  {
    id: '2',
    name: 'Entertainment',
    category: 'Entertainment',
    amount: 200,
    spent: 189.99,
    period: 'monthly',
    startDate: '2025-11-01',
    endDate: '2025-11-30',
    status: 'active',
    alertThreshold: 90,
    createdAt: '2025-11-01T00:00:00Z',
    updatedAt: '2025-11-15T00:00:00Z',
  },
];

let nextId = 3;
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockBudgetsApi = {
  async getAll(): Promise<Budget[]> {
    await delay(300);
    return [...mockBudgets];
  },

  async create(data: BudgetCreate): Promise<Budget> {
    await delay(300);
    const newBudget: Budget = {
      ...data,
      id: String(nextId++),
      spent: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockBudgets.push(newBudget);
    return newBudget;
  },

  async getById(id: string): Promise<Budget | null> {
    await delay(200);
    return mockBudgets.find(b => b.id === id) || null;
  },

  async update(id: string, data: BudgetUpdate): Promise<Budget> {
    await delay(300);
    const index = mockBudgets.findIndex(b => b.id === id);
    if (index === -1) throw new Error('Budget not found');

    mockBudgets[index] = {
      ...mockBudgets[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return mockBudgets[index];
  },

  async delete(id: string): Promise<void> {
    await delay(200);
    mockBudgets = mockBudgets.filter(b => b.id !== id);
  },
};
