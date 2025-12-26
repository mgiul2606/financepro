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
import { useQueryClient, type QueryKey, type UseMutationResult, type UseMutationOptions, type QueryClient } from '@tanstack/react-query';

/**
 * Type utility to extract the data type from an Orval wrapped response
 * Orval responses have structure: { data: T, status: number, headers: Headers }
 *
 * This utility is useful when you need to infer the unwrapped type from an existing
 * Orval response type, especially in advanced type manipulations.
 *
 * @example
 * ```typescript
 * type AccountAPIResponse = createAccountApiV1AccountsPostResponse;
 * type UnwrappedAccount = ExtractResponseData<AccountAPIResponse>; // AccountResponse
 * ```
 */
export type ExtractResponseData<T> = T extends { data: infer D }
  ? D extends { data: infer Inner } // Handle nested data structure
    ? Inner
    : D
  : T;

/**
 * Type for Orval-generated mutation hook with create pattern
 * Expects mutation to accept { data: TData }
 * TWrappedResponse is the full Orval response type (union with status literals, headers, etc.)
 * TVariables is the complete variables type (defaults to { data: TData } for flexibility)
 * This is intentionally flexible to accommodate Orval's complex union types
 */
export type OrvalCreateMutationHook<TData, TWrappedResponse, TError = Error, TVariables = { data: TData }> = <
  TContext = unknown
>(options?: {
  mutation?: UseMutationOptions<TWrappedResponse, TError, TVariables, TContext>;
  request?: RequestInit;
}, queryClient?: QueryClient) => UseMutationResult<TWrappedResponse, TError, TVariables, TContext>;

/**
 * Type for Orval-generated mutation hook with update pattern
 * Expects mutation to accept { [idParamName]: string, data: TData }
 * TWrappedResponse is the full Orval response type (union with status literals, headers, etc.)
 * TVariables is the complete variables type (defaults to Record<string, unknown> & { data: TData } for flexibility)
 * This is intentionally flexible to accommodate Orval's complex union types
 */
export type OrvalUpdateMutationHook<TData, TWrappedResponse, TError = Error, TVariables = Record<string, unknown> & { data: TData }> = <
  TContext = unknown
>(options?: {
  mutation?: UseMutationOptions<TWrappedResponse, TError, TVariables, TContext>;
  request?: RequestInit;
}, queryClient?: QueryClient) => UseMutationResult<TWrappedResponse, TError, TVariables, TContext>;

/**
 * Type for Orval-generated mutation hook with delete pattern
 * Expects mutation to accept { [idParamName]: string }
 * TWrappedResponse is the full Orval response type (union with status literals, headers, etc.)
 * TVariables is the variables type (defaults to Record<string, unknown> for flexibility)
 * This is intentionally flexible to accommodate Orval's complex union types
 */
export type OrvalDeleteMutationHook<TWrappedResponse, TError = Error, TVariables = Record<string, unknown>> = <
  TContext = unknown
>(options?: {
  mutation?: UseMutationOptions<TWrappedResponse, TError, TVariables, TContext>;
  request?: RequestInit;
}, queryClient?: QueryClient) => UseMutationResult<TWrappedResponse, TError, TVariables, TContext>;

/**
 * Options for create mutation factory
 */
export interface UseGenericCreateOptions<TData, TWrappedResponse, TResponse, TError = Error, TVariables = { data: TData }> {
  /**
   * Orval-generated mutation hook (e.g., useCreateAccountApiV1AccountsPost)
   * Returns the full Orval response type which must have a 'data' property of type TResponse
   */
  useMutation: OrvalCreateMutationHook<TData, TWrappedResponse, TError, TVariables>;

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
export function useGenericCreate<
  TData,
  TWrappedResponse extends { data: TResponse },
  TResponse = ExtractResponseData<TWrappedResponse>,
  TError = Error,
  TVariables extends { data: unknown } = { data: TData }
>({
  useMutation,
  invalidateQueryKey,
  mutationName = 'mutate',
  onSuccess,
  onError,
}: UseGenericCreateOptions<TData, TWrappedResponse, TResponse, TError, TVariables>): GenericCreateResult<TData, TResponse, TError> {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutation: {
      onSuccess: (wrappedResponse: TWrappedResponse, variables: TVariables) => {
        // Extract the actual data from Orval's wrapped response
        const response = wrappedResponse.data;

        // Invalidate cache
        const queryKey = typeof invalidateQueryKey === 'function'
          ? invalidateQueryKey()
          : invalidateQueryKey;
        queryClient.invalidateQueries({ queryKey });

        // Call custom success callback with unwrapped data
        onSuccess?.(response, variables.data as TData);
      },
      onError: (error: TError, variables: TVariables) => {
        onError?.(error, variables.data as TData);
      },
    },
  });

  return {
    [mutationName]: async (data: TData): Promise<TResponse> => {
      const wrappedResponse = await mutation.mutateAsync({ data } as TVariables);
      // Return unwrapped data to the caller
      return wrappedResponse.data;
    },
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  } as GenericCreateResult<TData, TResponse, TError>;
}

/**
 * Options for update mutation factory
 */
export interface UseGenericUpdateOptions<TData, TWrappedResponse, TResponse, TError = Error, TVariables = Record<string, unknown> & { data: TData }> {
  /**
   * Orval-generated mutation hook (e.g., useUpdateAccountApiV1AccountsAccountIdPut)
   * Returns the full Orval response type which must have a 'data' property of type TResponse
   */
  useMutation: OrvalUpdateMutationHook<TData, TWrappedResponse, TError, TVariables>;

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
export function useGenericUpdate<
  TData,
  TWrappedResponse extends { data: TResponse },
  TResponse = ExtractResponseData<TWrappedResponse>,
  TError = Error,
  TVariables extends Record<string, unknown> & { data: unknown } = Record<string, unknown> & { data: TData }
>({
  useMutation,
  invalidateQueryKey,
  mutationName = 'mutate',
  idParamName = 'id',
  onSuccess,
  onError,
}: UseGenericUpdateOptions<TData, TWrappedResponse, TResponse, TError, TVariables>): GenericUpdateResult<TData, TResponse, TError> {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutation: {
      onSuccess: (wrappedResponse: TWrappedResponse, variables: TVariables) => {
        // Extract the actual data from Orval's wrapped response
        const response = wrappedResponse.data;

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
      onError: (error: TError, variables: TVariables) => {
        const id = variables[idParamName] as string;
        const data = variables.data as TData;
        onError?.(error, id, data);
      },
    },
  });

  return {
    [mutationName]: async (id: string, data: TData): Promise<TResponse> => {
      const wrappedResponse = await mutation.mutateAsync({ [idParamName]: id, data } as TVariables);
      // Return unwrapped data to the caller
      return wrappedResponse.data;
    },
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  } as GenericUpdateResult<TData, TResponse, TError>;
}

/**
 * Options for delete mutation factory
 */
export interface UseGenericDeleteOptions<TWrappedResponse, TResponse = void, TError = Error, TVariables = Record<string, unknown>> {
  /**
   * Orval-generated mutation hook (e.g., useDeleteAccountApiV1AccountsAccountIdDelete)
   * Returns the full Orval response type which must have a 'data' property of type TResponse
   */
  useMutation: OrvalDeleteMutationHook<TWrappedResponse, TError, TVariables>;

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
export function useGenericDelete<
  TWrappedResponse extends { data: TResponse },
  TResponse = ExtractResponseData<TWrappedResponse>,
  TError = Error,
  TVariables = Record<string, unknown>
>({
  useMutation,
  invalidateQueryKey,
  mutationName = 'mutate',
  idParamName = 'id',
  onSuccess,
  onError,
}: UseGenericDeleteOptions<TWrappedResponse, TResponse, TError, TVariables>): GenericDeleteResult<TResponse, TError> {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutation: {
      onSuccess: (_wrappedResponse: TWrappedResponse, variables: TVariables) => {
        // Invalidate cache
        const queryKey = typeof invalidateQueryKey === 'function'
          ? invalidateQueryKey()
          : invalidateQueryKey;
        queryClient.invalidateQueries({ queryKey });

        // Call custom success callback with the ID
        const id = (variables as Record<string, unknown>)[idParamName] as string;
        onSuccess?.(id);
      },
      onError: (error: TError, variables: TVariables) => {
        const id = (variables as Record<string, unknown>)[idParamName] as string;
        onError?.(error, id);
      },
    },
  });

  return {
    [mutationName]: async (id: string): Promise<TResponse> => {
      const wrappedResponse = await mutation.mutateAsync({ [idParamName]: id } as TVariables);
      // Return unwrapped data to the caller (usually void for delete)
      return wrappedResponse.data;
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
export function createGenericCrudHooks<
  TCreate,
  TUpdate,
  TWrappedResponse extends { data: TResponse },
  TResponse = ExtractResponseData<TWrappedResponse>,
  TError = Error,
  TCreateVariables extends { data: unknown } = { data: TCreate },
  TUpdateVariables extends Record<string, unknown> & { data: unknown } = Record<string, unknown> & { data: TUpdate },
  TDeleteVariables = Record<string, unknown>
>(config: {
  /** Entity name (used for function naming) */
  entity: string;
  /** Orval-generated mutation hooks that return wrapped responses with 'data' property */
  mutations: {
    create: OrvalCreateMutationHook<TCreate, TWrappedResponse, TError, TCreateVariables>;
    update: OrvalUpdateMutationHook<TUpdate, TWrappedResponse, TError, TUpdateVariables>;
    delete: OrvalDeleteMutationHook<TWrappedResponse, TError, TDeleteVariables>;
  };
  /** Query key to invalidate */
  invalidateQueryKey: (() => QueryKey) | QueryKey;
  /** ID parameter name (e.g., 'accountId') */
  idParamName?: string;
}) {
  const { entity, mutations, invalidateQueryKey, idParamName = 'id' } = config;

  return {
    useCreate: (): GenericCreateResult<TCreate, TResponse, TError> =>
      useGenericCreate<TCreate, TWrappedResponse, TResponse, TError, TCreateVariables>({
        useMutation: mutations.create,
        invalidateQueryKey,
        mutationName: `create${capitalize(entity)}`,
      }),
    useUpdate: (): GenericUpdateResult<TUpdate, TResponse, TError> =>
      useGenericUpdate<TUpdate, TWrappedResponse, TResponse, TError, TUpdateVariables>({
        useMutation: mutations.update,
        invalidateQueryKey,
        mutationName: `update${capitalize(entity)}`,
        idParamName,
      }),
    useDelete: (): GenericDeleteResult<TResponse, TError> =>
      useGenericDelete<TWrappedResponse, TResponse, TError, TDeleteVariables>({
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
