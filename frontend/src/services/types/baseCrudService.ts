// frontend/src/services/types/baseCrudService.ts

import api from '../api';
import type { CrudService, BaseListParams } from '../types/crudService';

/**
 * Abstract base class for CRUD services
 * Implements standard CRUD operations to reduce boilerplate
 * 
 * @template T - Entity type
 * @template TCreate - Creation DTO type
 * @template TUpdate - Update DTO type
 * @template TListParams - List parameters type
 * 
 * @example
 * ```typescript
 * class AccountService extends BaseCrudService<
 *   Account,
 *   AccountCreate,
 *   AccountUpdate
 * > {
 *   protected readonly basePath = '/accounts';
 *   
 *   // Add custom methods here
 *   async getBalance(id: string | number): Promise<number> {
 *     const { data } = await api.get(`${this.basePath}/${id}/balance`);
 *     return data.balance;
 *   }
 * }
 * ```
 */
export abstract class BaseCrudService<
  T,
  TCreate = Partial<T>,
  TUpdate = Partial<T>,
  TListParams extends BaseListParams = BaseListParams
> implements CrudService<T, TCreate, TUpdate, TListParams> {
  
  /**
   * Base API path for the resource
   * Must be defined by concrete implementations
   * @example '/accounts', '/transactions'
   */
  protected abstract readonly basePath: string;

  /**
   * List all entities with optional filtering
   */
  async list(params?: TListParams): Promise<T[]> {
    const { data } = await api.get<T[]>(this.basePath, { params });
    return data;
  }

  /**
   * Get single entity by ID
   */
  async get(id: string | number): Promise<T> {
    const { data } = await api.get<T>(`${this.basePath}/${id}`);
    return data;
  }

  /**
   * Create new entity
   */
  async create(data: TCreate): Promise<T> {
    const { data: entity } = await api.post<T>(this.basePath, data);
    return entity;
  }

  /**
   * Update existing entity (full update)
   */
  async update(id: string | number, data: TUpdate): Promise<T> {
    const { data: entity } = await api.put<T>(`${this.basePath}/${id}`, data);
    return entity;
  }

  /**
   * Partially update entity (PATCH)
   * Optional method for services that need partial updates
   */
  async patch(id: string | number, data: Partial<TUpdate>): Promise<T> {
    const { data: entity } = await api.patch<T>(`${this.basePath}/${id}`, data);
    return entity;
  }

  /**
   * Delete entity
   */
  async delete(id: string | number): Promise<void> {
    await api.delete(`${this.basePath}/${id}`);
  }
}