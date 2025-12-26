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
 *   return useGenericCreate<AccountCreate, AccountResponse>({
 *     useMutation: useCreateAccountApiV1AccountsPost,
 *     invalidateQueryKey: getListAccountsApiV1AccountsGetQueryKey,
 *     mutationName: 'createAccount',
 *   });
 * };
 * ```
 */
import { useQueryClient, type QueryKey, type UseMutationResult, type UseMutationOptions } from '@tanstack/react-query';

/**
 * Type utility to extract the data type from an Orval wrapped response
 * Orval responses have structure: { data: T, status: number, headers: Headers }
 */
export type ExtractResponseData<T> = T extends { data: infer D }
  ? D extends { data: infer Inner } // Handle nested data structure
    ? Inner
    : D
  : T;

/**
 * Type for Orval-generated mutation hook with create pattern
 * Expects mutation to accept { data: TData }
 * TWrappedResponse is the full Orval response: { data: TResponse, status: number, headers: Headers }
 * TResponse is the actual data type we want to work with
 */
export type OrvalCreateMutationHook<TData, TWrappedResponse, TError = Error> = <
  TContext = unknown
>(options?: {
  mutation?: UseMutationOptions<TWrappedResponse, TError, { data: TData }, TContext>;
  request?: RequestInit;
}, queryClient?: QueryClient) => UseMutationResult<TWrappedResponse, TError, { data: TData }, TContext>;

/**
 * Type for Orval-generated mutation hook with update pattern
 * Expects mutation to accept { [idParamName]: string, data: TData }
 * TWrappedResponse is the full Orval response: { data: TResponse, status: number, headers: Headers }
 */
export type OrvalUpdateMutationHook<TData, TWrappedResponse, TError = Error> = <
  TContext = unknown
>(options?: {
  mutation?: UseMutationOptions<TWrappedResponse, TError, Record<string, unknown> & { data: TData }, TContext>;
  request?: RequestInit;
}, queryClient?: QueryClient) => UseMutationResult<TWrappedResponse, TError, Record<string, unknown> & { data: TData }, TContext>;

/**
 * Type for Orval-generated mutation hook with delete pattern
 * Expects mutation to accept { [idParamName]: string }
 * TWrappedResponse is the full Orval response: { data: TResponse, status: number, headers: Headers }
 */
export type OrvalDeleteMutationHook<TWrappedResponse = void, TError = Error> = <
  TContext = unknown
>(options?: {
  mutation?: UseMutationOptions<TWrappedResponse, TError, Record<string, unknown>, TContext>;
  request?: RequestInit;
}, queryClient?: QueryClient) => UseMutationResult<TWrappedResponse, TError, Record<string, unknown>, TContext>;

/**
 * Options for create mutation factory
 */
export interface UseGenericCreateOptions<TData, TResponse, TError = Error> {
  /**
   * Orval-generated mutation hook (e.g., useCreateAccountApiV1AccountsPost)
   * Accepts the wrapped response type from Orval
   */
  useMutation: OrvalCreateMutationHook<TData, any, TError>;

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
   * Optional callback after successful mutation
   * Receives the unwrapped data (TResponse) from the API response
   */
  onSuccess?: (response: TResponse, data: TData) => void;

  /**
   * Optional callback on mutation error
   */
  onError?: (error: TError, data: TData) => void;
}

/**
 * Return type for useGenericCreate
 */
export type GenericCreateResult<TData, TResponse, TError = Error> = {
  isPending: boolean;
  error: TError | null;
  reset: () => void;
} & Record<string, (data: TData) => Promise<TResponse>>;

/**
 * Generic factory for create mutations
 *
 * Creates a consistent mutation hook that:
 * - Wraps an Orval-generated mutation hook
 * - Automatically extracts data from Orval's wrapped response
 * - Automatically invalidates cache on success
 * - Returns a normalized interface: { [mutationName], isPending, error, reset }
 */
export function useGenericCreate<TData, TResponse, TError = Error>({
  useMutation,
  invalidateQueryKey,
  mutationName = 'mutate',
  onSuccess,
  onError,
}: UseGenericCreateOptions<TData, TResponse, TError>): GenericCreateResult<TData, TResponse, TError> {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutation: {
      onSuccess: (wrappedResponse: any, variables: { data: TData }) => {
        // Extract the actual data from Orval's wrapped response
        const response = wrappedResponse?.data as TResponse;

        // Invalidate cache
        const queryKey = typeof invalidateQueryKey === 'function'
          ? invalidateQueryKey()
          : invalidateQueryKey;
        queryClient.invalidateQueries({ queryKey });

        // Call custom success callback with unwrapped data
        onSuccess?.(response, variables.data);
      },
      onError: (error: TError, variables: { data: TData }) => {
        onError?.(error, variables.data);
      },
    },
  });

  return {
    [mutationName]: async (data: TData) => {
      const wrappedResponse = await mutation.mutateAsync({ data });
      // Return unwrapped data to the caller
      return (wrappedResponse as any)?.data as TResponse;
    },
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  } as GenericCreateResult<TData, TResponse, TError>;
}

/**
 * Options for update mutation factory
 */
export interface UseGenericUpdateOptions<TData, TResponse, TError = Error> {
  /**
   * Orval-generated mutation hook (e.g., useUpdateAccountApiV1AccountsAccountIdPut)
   * Accepts the wrapped response type from Orval
   */
  useMutation: OrvalUpdateMutationHook<TData, any, TError>;

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
   * Receives the unwrapped data (TResponse) from the API response
   */
  onSuccess?: (response: TResponse, id: string, data: TData) => void;

  /**
   * Optional callback on mutation error
   */
  onError?: (error: TError, id: string, data: TData) => void;
}

/**
 * Return type for useGenericUpdate
 */
export type GenericUpdateResult<TData, TResponse, TError = Error> = {
  isPending: boolean;
  error: TError | null;
  reset: () => void;
} & Record<string, (id: string, data: TData) => Promise<TResponse>>;

/**
 * Generic factory for update mutations
 *
 * Creates a consistent mutation hook that:
 * - Wraps an Orval-generated mutation hook
 * - Automatically extracts data from Orval's wrapped response
 * - Automatically invalidates cache on success
 * - Returns a normalized interface: { [mutationName], isPending, error, reset }
 */
export function useGenericUpdate<TData, TResponse, TError = Error>({
  useMutation,
  invalidateQueryKey,
  mutationName = 'mutate',
  idParamName = 'id',
  onSuccess,
  onError,
}: UseGenericUpdateOptions<TData, TResponse, TError>): GenericUpdateResult<TData, TResponse, TError> {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutation: {
      onSuccess: (wrappedResponse: any, variables: Record<string, unknown>) => {
        // Extract the actual data from Orval's wrapped response
        const response = wrappedResponse?.data as TResponse;

        // Invalidate cache
        const queryKey = typeof invalidateQueryKey === 'function'
          ? invalidateQueryKey()
          : invalidateQueryKey;
        queryClient.invalidateQueries({ queryKey });

        // Call custom success callback with unwrapped data
        const id = variables[idParamName] as string;
        const data = variables.data as TData;
        onSuccess?.(response, id, data);
      },
      onError: (error: TError, variables: Record<string, unknown>) => {
        const id = variables[idParamName] as string;
        const data = variables.data as TData;
        onError?.(error, id, data);
      },
    },
  });

  return {
    [mutationName]: async (id: string, data: TData) => {
      const wrappedResponse = await mutation.mutateAsync({ [idParamName]: id, data });
      // Return unwrapped data to the caller
      return (wrappedResponse as any)?.data as TResponse;
    },
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  } as GenericUpdateResult<TData, TResponse, TError>;
}

/**
 * Options for delete mutation factory
 */
export interface UseGenericDeleteOptions<TResponse = void, TError = Error> {
  /**
   * Orval-generated mutation hook (e.g., useDeleteAccountApiV1AccountsAccountIdDelete)
   * Accepts the wrapped response type from Orval
   */
  useMutation: OrvalDeleteMutationHook<any, TError>;

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
  onError?: (error: TError, id: string) => void;
}

/**
 * Return type for useGenericDelete
 */
export type GenericDeleteResult<TResponse = void, TError = Error> = {
  isPending: boolean;
  error: TError | null;
  reset: () => void;
} & Record<string, (id: string) => Promise<TResponse>>;

/**
 * Generic factory for delete mutations
 *
 * Creates a consistent mutation hook that:
 * - Wraps an Orval-generated mutation hook
 * - Automatically extracts data from Orval's wrapped response
 * - Automatically invalidates cache on success
 * - Returns a normalized interface: { [mutationName], isPending, error, reset }
 */
export function useGenericDelete<TResponse = void, TError = Error>({
  useMutation,
  invalidateQueryKey,
  mutationName = 'mutate',
  idParamName = 'id',
  onSuccess,
  onError,
}: UseGenericDeleteOptions<TResponse, TError>): GenericDeleteResult<TResponse, TError> {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutation: {
      onSuccess: (_wrappedResponse: any, variables: Record<string, unknown>) => {
        // Invalidate cache
        const queryKey = typeof invalidateQueryKey === 'function'
          ? invalidateQueryKey()
          : invalidateQueryKey;
        queryClient.invalidateQueries({ queryKey });

        // Call custom success callback with the ID
        const id = variables[idParamName] as string;
        onSuccess?.(id);
      },
      onError: (error: TError, variables: Record<string, unknown>) => {
        const id = variables[idParamName] as string;
        onError?.(error, id);
      },
    },
  });

  return {
    [mutationName]: async (id: string) => {
      const wrappedResponse = await mutation.mutateAsync({ [idParamName]: id });
      // Return unwrapped data to the caller (usually void for delete)
      return (wrappedResponse as any)?.data as TResponse;
    },
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  } as GenericDeleteResult<TResponse, TError>;
}

/**
 * Helper to create all three CRUD mutation hooks at once
 *
 * @example
 * ```tsx
 * const accountMutations = createGenericCrudHooks({
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
 * export const { useCreate: useCreateAccount, useUpdate: useUpdateAccount, useDelete: useDeleteAccount } = accountMutations;
 * ```
 */
export function createGenericCrudHooks<TCreate, TUpdate, TResponse, TError = Error>(config: {
  /** Entity name (used for function naming) */
  entity: string;
  /** Orval-generated mutation hooks - accepts wrapped response types */
  mutations: {
    create: OrvalCreateMutationHook<TCreate, any, TError>;
    update: OrvalUpdateMutationHook<TUpdate, any, TError>;
    delete: OrvalDeleteMutationHook<any, TError>;
  };
  /** Query key to invalidate */
  invalidateQueryKey: (() => QueryKey) | QueryKey;
  /** ID parameter name (e.g., 'accountId') */
  idParamName?: string;
}) {
  const { entity, mutations, invalidateQueryKey, idParamName = 'id' } = config;

  return {
    useCreate: (): GenericCreateResult<TCreate, TResponse, TError> =>
      useGenericCreate<TCreate, TResponse, TError>({
        useMutation: mutations.create,
        invalidateQueryKey,
        mutationName: `create${capitalize(entity)}`,
      }),
    useUpdate: (): GenericUpdateResult<TUpdate, TResponse, TError> =>
      useGenericUpdate<TUpdate, TResponse, TError>({
        useMutation: mutations.update,
        invalidateQueryKey,
        mutationName: `update${capitalize(entity)}`,
        idParamName,
      }),
    useDelete: (): GenericDeleteResult<TResponse, TError> =>
      useGenericDelete<TResponse, TError>({
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
