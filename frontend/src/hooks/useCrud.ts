// src/hooks/useCrud.ts
import { useState, useCallback, useEffect } from 'react';
import { AxiosError } from 'axios';

// Tipo per oggetti con ID
export type WithId<K extends string | number = string | number> = {
  [key: string]: K;
};

// Tipo per la risposta paginata
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

// Tipo per i parametri di caricamento
export interface LoadParams {
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
}

// Tipo per gli errori
export interface CrudError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface CrudState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  creating: boolean;
     updating: boolean;
  deleting: boolean;
  selectedItem: T | null;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CrudActions<T, C = Partial<T>, U = Partial<T>> {
  load: (params?: LoadParams) => Promise<void>;
  create: (data: C) => Promise<T | void>;
  update: (id: string | number, data: U) => Promise<T | void>;
  delete: (id: string | number) => Promise<void>;
  select: (item: T | null) => void;
  reset: () => void;
  setItems: (items: T[]) => void;
  addItem: (item: T) => void;
  removeItem: (id: string | number) => void;
  updateItem: (id: string | number, item: T) => void;
  clearError: () => void;
}

export interface UseCrudOptions<T, C = Partial<T>, U = Partial<T>> {
  service: {
    list?: (params?: LoadParams) => Promise<T[] | PaginatedResponse<T>>;
    create?: (data: C) => Promise<T>;
    update?: (id: string | number, data: U) => Promise<T>;
    delete?: (id: string | number) => Promise<void>;
    get?: (id: string | number) => Promise<T>;
  };
  initialItems?: T[];
  autoLoad?: boolean;
  loadParams?: LoadParams;
  onSuccess?: {
    create?: (item: T) => void;
    update?: (item: T) => void;
    delete?: (id: string | number) => void;
    load?: (items: T[]) => void;
  };
  onError?: {
    create?: (error: CrudError) => void;
    update?: (error: CrudError) => void;
    delete?: (error: CrudError) => void;
    load?: (error: CrudError) => void;
  };
  idField?: keyof T;
  pagination?: {
    enabled: boolean;
    pageSize?: number;
    page?: number;
  };
}

// Type guard per verificare se la risposta è paginata
function isPaginatedResponse<T>(
  result: T[] | PaginatedResponse<T>
): result is PaginatedResponse<T> {
  return (
    typeof result === 'object' &&
    result !== null &&
    'data' in result &&
    'total' in result &&
    Array.isArray((result as PaginatedResponse<T>).data)
  );
}

// Helper per estrarre ID da un item
function getItemId<T>(item: T, idField: keyof T): string | number {
  const id = item[idField];
  if (typeof id !== 'string' && typeof id !== 'number') {
    throw new Error(`Invalid ID field: ${String(idField)}`);
  }
  return id;
}

export function useCrud<T extends object, C = Partial<T>, U = Partial<T>>({
  service,
  initialItems = [],
  autoLoad = false,
  loadParams,
  onSuccess,
  onError,
  idField = 'id' as keyof T,
  pagination
}: UseCrudOptions<T, C, U>): [CrudState<T>, CrudActions<T, C, U>] {
  const [state, setState] = useState<CrudState<T>>({
    items: initialItems,
    loading: false,
    error: null,
    creating: false,
    updating: false,
    deleting: false,
    selectedItem: null,
    pagination: pagination?.enabled ? {
      page: pagination.page || 1,
      pageSize: pagination.pageSize || 10,
      total: 0,
      totalPages: 0
    } : undefined
  });

  // Helper per estrarre il messaggio di errore
  const getErrorMessage = useCallback((error: unknown): string => {
    if (error instanceof AxiosError) {
      const responseData = error.response?.data as Record<string, unknown> | undefined;
      
      if (responseData?.detail && typeof responseData.detail === 'string') {
        return responseData.detail;
      }
      if (responseData?.message && typeof responseData.message === 'string') {
        return responseData.message;
      }
      if (error.message) {
        return error.message;
      }
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return 'An error occurred';
  }, []);

  // Helper per creare oggetto CrudError
  const createCrudError = useCallback((error: unknown): CrudError => {
    const message = getErrorMessage(error);
    
    if (error instanceof AxiosError) {
      return {
        message,
        code: error.code,
        details: error.response?.data
      };
    }
    
    return { message };
  }, [getErrorMessage]);

  // Load items
  const load = useCallback(async (params?: LoadParams): Promise<void> => {
    if (!service.list) {
      console.warn('List service not provided');
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const mergedParams: LoadParams = {
        ...loadParams,
        ...params,
        ...(state.pagination && {
          page: params?.page ?? state.pagination.page,
          pageSize: params?.pageSize ?? state.pagination.pageSize
        })
      };

      const result = await service.list(mergedParams);
      
      if (pagination?.enabled && isPaginatedResponse(result)) {
        setState(prev => ({
          ...prev,
          items: result.data,
          loading: false,
          error: null,
          pagination: prev.pagination ? {
            ...prev.pagination,
            total: result.total,
            totalPages: Math.ceil(result.total / prev.pagination.pageSize)
          } : undefined
        }));
        onSuccess?.load?.(result.data);
      } else {
        const items = Array.isArray(result) ? result : [];
        setState(prev => ({
          ...prev,
          items,
          loading: false,
          error: null
        }));
        onSuccess?.load?.(items);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      onError?.load?.(createCrudError(error));
    }
  }, [service, loadParams, state.pagination, pagination?.enabled, onSuccess, onError, getErrorMessage, createCrudError]);

  // Create item
  const create = useCallback(async (data: C): Promise<T | void> => {
    if (!service.create) {
      console.warn('Create service not provided');
      return;
    }

    setState(prev => ({ ...prev, creating: true, error: null }));

    try {
      const newItem = await service.create(data);
      setState(prev => ({
        ...prev,
        items: [newItem, ...prev.items],
        creating: false,
        error: null
      }));
      onSuccess?.create?.(newItem);
      return newItem;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setState(prev => ({
        ...prev,
        creating: false,
        error: errorMessage
      }));
      onError?.create?.(createCrudError(error));
      throw error;
    }
  }, [service, onSuccess, onError, getErrorMessage, createCrudError]);

  // Update item
  const update = useCallback(async (id: string | number, data: U): Promise<T | void> => {
    if (!service.update) {
      console.warn('Update service not provided');
      return;
    }

    setState(prev => ({ ...prev, updating: true, error: null }));

    try {
      const updatedItem = await service.update(id, data);
      setState(prev => ({
        ...prev,
        items: prev.items.map(item => 
          getItemId(item, idField) === id ? updatedItem : item
        ),
        updating: false,
        error: null,
        selectedItem: prev.selectedItem && getItemId(prev.selectedItem, idField) === id 
          ? updatedItem 
          : prev.selectedItem
      }));
      onSuccess?.update?.(updatedItem);
      return updatedItem;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setState(prev => ({
        ...prev,
        updating: false,
        error: errorMessage
      }));
      onError?.update?.(createCrudError(error));
      throw error;
    }
  }, [service, idField, onSuccess, onError, getErrorMessage, createCrudError]);

  // Delete item
  const deleteItem = useCallback(async (id: string | number): Promise<void> => {
    if (!service.delete) {
      console.warn('Delete service not provided');
      return;
    }

    setState(prev => ({ ...prev, deleting: true, error: null }));

    try {
      await service.delete(id);
      setState(prev => ({
        ...prev,
        items: prev.items.filter(item => getItemId(item, idField) !== id),
        deleting: false,
        error: null,
        selectedItem: prev.selectedItem && getItemId(prev.selectedItem, idField) === id 
          ? null 
          : prev.selectedItem
      }));
      onSuccess?.delete?.(id);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setState(prev => ({
        ...prev,
        deleting: false,
        error: errorMessage
      }));
      onError?.delete?.(createCrudError(error));
      throw error;
    }
  }, [service, idField, onSuccess, onError, getErrorMessage, createCrudError]);

  // Select item
  const select = useCallback((item: T | null) => {
    setState(prev => ({ ...prev, selectedItem: item }));
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setState({
      items: initialItems,
      loading: false,
      error: null,
      creating: false,
      updating: false,
      deleting: false,
      selectedItem: null,
      pagination: pagination?.enabled ? {
        page: pagination.page || 1,
        pageSize: pagination.pageSize || 10,
        total: 0,
        totalPages: 0
      } : undefined
    });
  }, [initialItems, pagination]);

  // Set items manually
  const setItems = useCallback((items: T[]) => {
    setState(prev => ({ ...prev, items }));
  }, []);

  // Add single item
  const addItem = useCallback((item: T) => {
    setState(prev => ({ ...prev, items: [item, ...prev.items] }));
  }, []);

  // Remove single item
  const removeItem = useCallback((id: string | number) => {
    setState(prev => ({
      ...prev,
      items: prev.items.filter(item => getItemId(item, idField) !== id)
    }));
  }, [idField]);

  // Update single item
  const updateItem = useCallback((id: string | number, item: T) => {
    setState(prev => ({
      ...prev,
      items: prev.items.map(i => 
        getItemId(i, idField) === id ? item : i
      )
    }));
  }, [idField]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto load on mount
  useEffect(() => {
    if (autoLoad && service.list) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actions: CrudActions<T, C, U> = {
    load,
    create,
    update,
    delete: deleteItem,
    select,
    reset,
    setItems,
    addItem,
    removeItem,
    updateItem,
    clearError
  };

  return [state, actions];
}

// Optimistic update wrapper
export function useOptimisticCrud<T extends Record<string, unknown>, C = Partial<T>, U = Partial<T>>(
  options: UseCrudOptions<T, C, U>
): [CrudState<T>, CrudActions<T, C, U>] {
  const [state, actions] = useCrud(options);
  const idField = options.idField || ('id' as keyof T);

  const optimisticUpdate = useCallback(async (id: string | number, data: U): Promise<T | void> => {
    const currentItem = state.items.find(item => getItemId(item, idField) === id);
    
    if (currentItem) {
      const optimisticItem = { ...currentItem, ...data } as T;
      actions.updateItem(id, optimisticItem);
    }

    try {
      const result = await actions.update(id, data);
      return result;
    } catch (error) {
      if (currentItem) {
        actions.updateItem(id, currentItem);
      }
      throw error;
    }
  }, [state.items, actions, idField]);

  const optimisticDelete = useCallback(async (id: string | number): Promise<void> => {
    const itemToDelete = state.items.find(item => getItemId(item, idField) === id);
    
    actions.removeItem(id);

    try {
      await actions.delete(id);
    } catch (error) {
      if (itemToDelete) {
        actions.addItem(itemToDelete);
      }
      throw error;
    }
  }, [state.items, actions, idField]);

  return [
    state,
    {
      ...actions,
      update: optimisticUpdate,
      delete: optimisticDelete
    }
  ];
}