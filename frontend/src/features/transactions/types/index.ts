// Transaction Types

export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionStatus = 'pending' | 'completed' | 'cancelled';

export interface Transaction {
  id: string;
  accountId: number;
  type: TransactionType;
  amount: number;
  currency: string;
  category?: string;
  description: string;
  date: string; // ISO date string
  status: TransactionStatus;
  tags?: string[];
  merchantName?: string;
  location?: string;
  notes?: string;
  isRecurring?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionCreate {
  accountId: number;
  type: TransactionType;
  amount: number;
  currency?: string;
  category?: string;
  description: string;
  date: string;
  status?: TransactionStatus;
  tags?: string[];
  merchantName?: string;
  location?: string;
  notes?: string;
}

export interface TransactionUpdate {
  type?: TransactionType;
  amount?: number;
  category?: string;
  description?: string;
  date?: string;
  status?: TransactionStatus;
  tags?: string[];
  merchantName?: string;
  location?: string;
  notes?: string;
}

export interface TransactionFilters {
  accountId?: number;
  type?: TransactionType;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}
