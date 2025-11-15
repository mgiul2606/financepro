// src/services/accountService.ts
// frontend/src/services/accountService.ts

import { BaseCrudService } from './types/baseCrudService';
import type { BaseListParams } from './types/crudService';
import type { Account, AccountCreate, AccountUpdate } from '@/types/account';
import api from './api';

/**
 * Custom list parameters for accounts
 */
export interface AccountListParams extends BaseListParams {
  type?: 'checking' | 'savings' | 'credit' | 'investment';
  isActive?: boolean;
  minBalance?: number;
  maxBalance?: number;
}

/**
 * Account balance response
 */
export interface AccountBalance {
  accountId: number;
  balance: number;
  currency: string;
  lastUpdated: string;
}

/**
 * Account Service
 * Handles all account-related API operations
 */
class AccountService extends BaseCrudService<
  Account,
  AccountCreate,
  AccountUpdate,
  AccountListParams
> {
  protected readonly basePath = '/accounts';

  /**
   * Get account balance
   * @param id - Account ID
   * @returns Promise resolving to balance information
   */
  async getBalance(id: string | number): Promise<AccountBalance> {
    const { data } = await api.get<AccountBalance>(
      `${this.basePath}/${id}/balance`
    );
    return data;
  }

  /**
   * Get transactions for account
   * @param id - Account ID
   * @param params - Transaction filter parameters
   */
  async getTransactions(
    id: string | number,
    params?: {
      startDate?: string;
      endDate?: string;
      categoryId?: number;
      limit?: number;
    }
  ): Promise<Transaction[]> {
    const { data } = await api.get<Transaction[]>(
      `${this.basePath}/${id}/transactions`,
      { params }
    );
    return data;
  }

  /**
   * Archive account (soft delete)
   */
  async archive(id: string | number): Promise<Account> {
    const { data } = await api.post<Account>(`${this.basePath}/${id}/archive`);
    return data;
  }
}

export const accountService = new AccountService();