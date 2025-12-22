/**
 * Generic React Query mutation hook factories
 *
 * This module provides reusable factory functions for creating
 * mutation hooks with automatic cache invalidation.
 *
 * These factories work with Orval-generated mutation hooks and
 * provide a consistent interface across all entity types.
 *
 * @example
 * ```tsx
 * // In accounts.hooks.ts
 * export const useCreateAccount = () => {
 *   return useGenericCreate({
 *     useMutation: useCreateAccountApiV1AccountsPost,
 *     invalidateQueryKey: getListAccountsApiV1AccountsGetQueryKey,
 *     mutationName: 'createAccount',
 *     paramMapper: (data) => ({ data }),
 *   });
 * };
 * ```
 */
import { useQueryClient, type QueryKey } from '@tanstack/react-query';

/**
 * Options for create mutation factory
 */
export interface UseGenericCreateOptions<TData, TResponse> {
  /**
   * Orval-generated mutation hook (e.g., useCreateAccountApiV1AccountsPost)
   */
  useMutation: (options?: any) => any;

  /**
   * Query key getter function or static query key to invalidate on success
   * Can be a function that returns the query key or a static array
   */
  invalidateQueryKey: (() => QueryKey) | QueryKey;

  /**
   * Name of the mutation function in the returned object
   * @default 'mutate'
   */
  mutationName?: string;

  /**
   * Maps input data to mutation parameters
   * @default (data) => ({ data })
   */
  paramMapper?: (data: TData) => any;

  /**
   * Optional callback after successful mutation
   */
  onSuccess?: (response: TResponse) => void;

  /**
   * Optional callback on mutation error
   */
  onError?: (error: Error) => void;
}

/**
 * Generic factory for create mutations
 *
 * Creates a consistent mutation hook that:
 * - Wraps an Orval-generated mutation hook
 * - Automatically invalidates cache on success
 * - Returns a normalized interface: { [mutationName], isPending, error, reset }
 */
export function useGenericCreate<TData, TResponse = any>({
  useMutation,
  invalidateQueryKey,
  mutationName = 'mutate',
  paramMapper = (data: TData) => ({ data }),
  onSuccess,
  onError,
}: UseGenericCreateOptions<TData, TResponse>) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutation: {
      onSuccess: (response: TResponse) => {
        // Invalidate cache
        const queryKey = typeof invalidateQueryKey === 'function'
          ? invalidateQueryKey()
          : invalidateQueryKey;
        queryClient.invalidateQueries({ queryKey });

        // Call custom success callback
        onSuccess?.(response);
      },
      onError: (error: Error) => {
        onError?.(error);
      },
    },
  });

  return {
    [mutationName]: (data: TData) => mutation.mutateAsync(paramMapper(data)),
    isPending: mutation.isPending,
    error: mutation.error as Error | null,
    reset: mutation.reset,
  };
}

/**
 * Options for update mutation factory
 */
export interface UseGenericUpdateOptions<TData, TResponse> {
  /**
   * Orval-generated mutation hook (e.g., useUpdateAccountApiV1AccountsAccountIdPut)
   */
  useMutation: (options?: any) => any;

  /**
   * Query key getter function or static query key to invalidate on success
   */
  invalidateQueryKey: (() => QueryKey) | QueryKey;

  /**
   * Name of the mutation function in the returned object
   * @default 'mutate'
   */
  mutationName?: string;

  /**
   * Name of the ID parameter in the Orval mutation
   * @default 'id'
   * @example 'accountId', 'budgetId', 'goalId'
   */
  idParamName?: string;

  /**
   * Optional callback after successful mutation
   */
  onSuccess?: (response: TResponse) => void;

  /**
   * Optional callback on mutation error
   */
  onError?: (error: Error) => void;
}

/**
 * Generic factory for update mutations
 *
 * Creates a consistent mutation hook that:
 * - Wraps an Orval-generated mutation hook
 * - Automatically invalidates cache on success
 * - Returns a normalized interface: { [mutationName], isPending, error, reset }
 */
export function useGenericUpdate<TData, TResponse = any>({
  useMutation,
  invalidateQueryKey,
  mutationName = 'mutate',
  idParamName = 'id',
  onSuccess,
  onError,
}: UseGenericUpdateOptions<TData, TResponse>) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutation: {
      onSuccess: (response: TResponse) => {
        // Invalidate cache
        const queryKey = typeof invalidateQueryKey === 'function'
          ? invalidateQueryKey()
          : invalidateQueryKey;
        queryClient.invalidateQueries({ queryKey });

        // Call custom success callback
        onSuccess?.(response);
      },
      onError: (error: Error) => {
        onError?.(error);
      },
    },
  });

  return {
    [mutationName]: (id: string, data: TData) =>
      mutation.mutateAsync({ [idParamName]: id, data }),
    isPending: mutation.isPending,
    error: mutation.error as Error | null,
    reset: mutation.reset,
  };
}

/**
 * Options for delete mutation factory
 */
export interface UseGenericDeleteOptions<TResponse = void> {
  /**
   * Orval-generated mutation hook (e.g., useDeleteAccountApiV1AccountsAccountIdDelete)
   */
  useMutation: (options?: any) => any;

  /**
   * Query key getter function or static query key to invalidate on success
   */
  invalidateQueryKey: (() => QueryKey) | QueryKey;

  /**
   * Name of the mutation function in the returned object
   * @default 'mutate'
   */
  mutationName?: string;

  /**
   * Name of the ID parameter in the Orval mutation
   * @default 'id'
   * @example 'accountId', 'budgetId', 'goalId'
   */
  idParamName?: string;

  /**
   * Optional callback after successful mutation
   */
  onSuccess?: (id: string) => void;

  /**
   * Optional callback on mutation error
   */
  onError?: (error: Error) => void;
}

/**
 * Generic factory for delete mutations
 *
 * Creates a consistent mutation hook that:
 * - Wraps an Orval-generated mutation hook
 * - Automatically invalidates cache on success
 * - Returns a normalized interface: { [mutationName], isPending, error, reset }
 */
export function useGenericDelete<TResponse = void>({
  useMutation,
  invalidateQueryKey,
  mutationName = 'mutate',
  idParamName = 'id',
  onSuccess,
  onError,
}: UseGenericDeleteOptions<TResponse>) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutation: {
      onSuccess: (_response: TResponse, variables: any) => {
        // Invalidate cache
        const queryKey = typeof invalidateQueryKey === 'function'
          ? invalidateQueryKey()
          : invalidateQueryKey;
        queryClient.invalidateQueries({ queryKey });

        // Call custom success callback with the ID
        const id = variables[idParamName];
        onSuccess?.(id);
      },
      onError: (error: Error) => {
        onError?.(error);
      },
    },
  });

  return {
    [mutationName]: (id: string) =>
      mutation.mutateAsync({ [idParamName]: id }),
    isPending: mutation.isPending,
    error: mutation.error as Error | null,
    reset: mutation.reset,
  };
}

/**
 * Helper to create all three CRUD mutation hooks at once
 *
 * @example
 * ```tsx
 * const accountMutations = useGenericCrudMutations({
 *   entity: 'account',
 *   mutations: {
 *     create: useCreateAccountApiV1AccountsPost,
 *     update: useUpdateAccountApiV1AccountsAccountIdPut,
 *     delete: useDeleteAccountApiV1AccountsAccountIdDelete,
 *   },
 *   invalidateQueryKey: getListAccountsApiV1AccountsGetQueryKey,
 *   idParamName: 'accountId',
 * });
 *
 * // Returns: { useCreate, useUpdate, useDelete }
 * ```
 */
export function createGenericCrudHooks<TCreate, TUpdate, TResponse = any>(config: {
  /** Entity name (used for function naming) */
  entity: string;
  /** Orval-generated mutation hooks */
  mutations: {
    create: (options?: any) => any;
    update: (options?: any) => any;
    delete: (options?: any) => any;
  };
  /** Query key to invalidate */
  invalidateQueryKey: (() => QueryKey) | QueryKey;
  /** ID parameter name (e.g., 'accountId') */
  idParamName?: string;
}) {
  const { entity, mutations, invalidateQueryKey, idParamName = 'id' } = config;

  return {
    useCreate: () => useGenericCreate<TCreate, TResponse>({
      useMutation: mutations.create,
      invalidateQueryKey,
      mutationName: `create${capitalize(entity)}`,
    }),
    useUpdate: () => useGenericUpdate<TUpdate, TResponse>({
      useMutation: mutations.update,
      invalidateQueryKey,
      mutationName: `update${capitalize(entity)}`,
      idParamName,
    }),
    useDelete: () => useGenericDelete({
      useMutation: mutations.delete,
      invalidateQueryKey,
      mutationName: `delete${capitalize(entity)}`,
      idParamName,
    }),
  };
}

/**
 * Capitalize first letter of a string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
