// frontend/src/services/types/crudService.ts
/**
 * Generic CRUD Service Type Definitions
 * Provides type-safe interfaces for standard CRUD operations
 */

/**
 * Base filter parameters for list operations
 */
export interface BaseListParams {
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * Pagination parameters
 */
export interface PaginationParams extends BaseListParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Generic CRUD Service Interface
 * 
 * @template T - Entity type (e.g., Account, Transaction)
 * @template TCreate - Creation DTO type (defaults to Partial<T>)
 * @template TUpdate - Update DTO type (defaults to Partial<T>)
 * @template TListParams - List parameters type (defaults to BaseListParams)
 * 
 * @example
 * ```typescript
 * interface CustomListParams extends BaseListParams {
 *   categoryId?: number;
 *   dateFrom?: string;
 * }
 * 
 * class TransactionService implements CrudService
 *   Transaction,
 *   TransactionCreate,
 *   TransactionUpdate,
 *   CustomListParams
 *  {
 *   // Implementation
 * }
 * ```
 */
export interface CrudService<
  T,
  TCreate = Partial<T>,
  TUpdate = Partial<T>,
  TListParams extends BaseListParams = BaseListParams
> {
  /**
   * List all entities with optional filtering
   * @param params - Filter and sort parameters
   * @returns Promise resolving to array of entities
   */
  list(params?: TListParams): Promise<T[]>;

  /**
   * Get single entity by ID
   * @param id - Entity identifier (string or number)
   * @returns Promise resolving to the entity
   * @throws {NotFoundError} When entity doesn't exist
   */
  get(id: string | number): Promise<T>;

  /**
   * Create new entity
   * @param data - Creation data
   * @returns Promise resolving to created entity
   * @throws {ValidationError} When data is invalid
   */
  create(data: TCreate): Promise<T>;

  /**
   * Update existing entity
   * @param id - Entity identifier
   * @param data - Update data
   * @returns Promise resolving to updated entity
   * @throws {NotFoundError} When entity doesn't exist
   * @throws {ValidationError} When data is invalid
   */
  update(id: string | number, data: TUpdate): Promise<T>;

  /**
   * Delete entity
   * @param id - Entity identifier
   * @returns Promise resolving when deletion is complete
   * @throws {NotFoundError} When entity doesn't exist
   */
  delete(id: string | number): Promise<void>;
}

/**
 * Extended CRUD Service with pagination support
 * 
 * @template T - Entity type
 * @template TCreate - Creation DTO type
 * @template TUpdate - Update DTO type
 * @template TListParams - Pagination parameters type
 */
export interface PaginatedCrudService<
  T,
  TCreate = Partial<T>,
  TUpdate = Partial<T>,
  TListParams extends PaginationParams = PaginationParams
> extends Omit<CrudService<T, TCreate, TUpdate, TListParams>, 'list'> {
  /**
   * List entities with pagination
   * @param params - Pagination and filter parameters
   * @returns Promise resolving to paginated response
   */
  list(params?: TListParams): Promise<PaginatedResponse<T>>;
}

/**
 * Type guard to check if service implements pagination
 */
export function isPaginatedService<T, TCreate, TUpdate>(
  service: CrudService<T, TCreate, TUpdate> | PaginatedCrudService<T, TCreate, TUpdate>
): service is PaginatedCrudService<T, TCreate, TUpdate> {
  // Check if list method returns PaginatedResponse structure
  return 'list' in service;
}