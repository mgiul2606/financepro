// src/services/accountService.ts
import api from './api';

export interface Account {
  id: number;
  name: string;
  initial_balance: number;
  current_balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface AccountCreate {
  name: string;
  initial_balance: number;
  currency?: string;
}

export interface AccountUpdate {
  name?: string;
  initial_balance?: number;
}

export const accountService = {
  async list(): Promise<Account[]> {
    const response = await api.get('/api/accounts');
    return response.data;
  },

  async get(id: number): Promise<Account> {
    const response = await api.get(`/api/accounts/${id}`);
    return response.data;
  },

  async create(data: AccountCreate): Promise<Account> {
    const response = await api.post('/api/accounts', data);
    return response.data;
  },

  async update(id: number, data: AccountUpdate): Promise<Account> {
    const response = await api.put(`/api/accounts/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/accounts/${id}`);
  },
};