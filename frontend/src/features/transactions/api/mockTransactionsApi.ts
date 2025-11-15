// Mock Transactions API
// This will be replaced with real API when backend is ready

import { Transaction, TransactionCreate, TransactionUpdate, TransactionFilters } from '../types';

// Mock data
let mockTransactions: Transaction[] = [
  {
    id: '1',
    accountId: 1,
    type: 'expense',
    amount: 45.50,
    currency: 'EUR',
    category: 'Groceries',
    description: 'Weekly grocery shopping',
    date: '2025-11-10T10:30:00Z',
    status: 'completed',
    tags: ['food', 'essential'],
    merchantName: 'SuperMarket SpA',
    createdAt: '2025-11-10T10:30:00Z',
    updatedAt: '2025-11-10T10:30:00Z',
  },
  {
    id: '2',
    accountId: 1,
    type: 'income',
    amount: 3500.00,
    currency: 'EUR',
    category: 'Salary',
    description: 'Monthly salary',
    date: '2025-11-01T00:00:00Z',
    status: 'completed',
    merchantName: 'My Company SRL',
    createdAt: '2025-11-01T00:00:00Z',
    updatedAt: '2025-11-01T00:00:00Z',
  },
  {
    id: '3',
    accountId: 1,
    type: 'expense',
    amount: 89.99,
    currency: 'EUR',
    category: 'Entertainment',
    description: 'Concert tickets',
    date: '2025-11-08T19:00:00Z',
    status: 'completed',
    tags: ['leisure', 'entertainment'],
    merchantName: 'TicketMaster',
    createdAt: '2025-11-08T19:00:00Z',
    updatedAt: '2025-11-08T19:00:00Z',
  },
  {
    id: '4',
    accountId: 1,
    type: 'expense',
    amount: 1200.00,
    currency: 'EUR',
    category: 'Rent',
    description: 'November rent payment',
    date: '2025-11-05T00:00:00Z',
    status: 'completed',
    tags: ['housing', 'recurring'],
    isRecurring: true,
    merchantName: 'Real Estate Agency',
    createdAt: '2025-11-05T00:00:00Z',
    updatedAt: '2025-11-05T00:00:00Z',
  },
  {
    id: '5',
    accountId: 1,
    type: 'expense',
    amount: 15.50,
    currency: 'EUR',
    category: 'Transport',
    description: 'Taxi ride',
    date: '2025-11-12T08:30:00Z',
    status: 'completed',
    tags: ['transport'],
    merchantName: 'Uber',
    location: 'City Center',
    createdAt: '2025-11-12T08:30:00Z',
    updatedAt: '2025-11-12T08:30:00Z',
  },
];

let nextId = 6;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockTransactionsApi = {
  async getAll(filters?: TransactionFilters): Promise<Transaction[]> {
    await delay(300); // Simulate network delay

    let filtered = [...mockTransactions];

    if (filters) {
      if (filters.accountId) {
        filtered = filtered.filter(t => t.accountId === filters.accountId);
      }
      if (filters.type) {
        filtered = filtered.filter(t => t.type === filters.type);
      }
      if (filters.category) {
        filtered = filtered.filter(t => t.category === filters.category);
      }
      if (filters.dateFrom) {
        filtered = filtered.filter(t => t.date >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        filtered = filtered.filter(t => t.date <= filters.dateTo!);
      }
      if (filters.minAmount) {
        filtered = filtered.filter(t => t.amount >= filters.minAmount!);
      }
      if (filters.maxAmount) {
        filtered = filtered.filter(t => t.amount <= filters.maxAmount!);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(
          t =>
            t.description.toLowerCase().includes(search) ||
            t.merchantName?.toLowerCase().includes(search) ||
            t.category?.toLowerCase().includes(search)
        );
      }
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return filtered;
  },

  async getById(id: string): Promise<Transaction | null> {
    await delay(200);
    return mockTransactions.find(t => t.id === id) || null;
  },

  async create(data: TransactionCreate): Promise<Transaction> {
    await delay(300);

    const newTransaction: Transaction = {
      ...data,
      id: String(nextId++),
      currency: data.currency || 'EUR',
      status: data.status || 'completed',
      tags: data.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockTransactions.push(newTransaction);
    return newTransaction;
  },

  async update(id: string, data: TransactionUpdate): Promise<Transaction> {
    await delay(300);

    const index = mockTransactions.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Transaction not found');
    }

    mockTransactions[index] = {
      ...mockTransactions[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return mockTransactions[index];
  },

  async delete(id: string): Promise<void> {
    await delay(200);
    mockTransactions = mockTransactions.filter(t => t.id !== id);
  },

  async getStats(accountId?: number) {
    await delay(300);

    const transactions = accountId
      ? mockTransactions.filter(t => t.accountId === accountId)
      : mockTransactions;

    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome: income,
      totalExpenses: expenses,
      balance: income - expenses,
      transactionCount: transactions.length,
    };
  },
};
