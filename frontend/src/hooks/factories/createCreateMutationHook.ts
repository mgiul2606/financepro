/**
 * Factory for creating type-safe CREATE (POST) mutation hooks
 *
 * Creates consistent hooks for creating new entities with:
 * - Automatic data extraction from Orval responses
 * - Type-safe cache invalidation
 * - Optimistic updates support
 * - Success/error callbacks
 *
 * @module createCreateMutationHook
 */

import { useQueryClient } from '@tanstack/react-query';
import type {
  UseMutationResult,
  UseMutationOptions,
  QueryKey,
  QueryClient,
} from '@tanstack/react-query';
import type { ExtractOrvalData } from '@/lib/orval-types';

/**
 * Type signature for Orval-generated CREATE mutation hooks
 *
 * Matches hooks like:
 * - useCreateAccountApiV1AccountsPost
 * - useCreateTransactionApiV1TransactionsPost
 * - etc.
 *
 * CREATE mutations expect variables: { data: TCreate }
 */
export type OrvalCreateMutationHook<
  TResponse,
  TCreate,
  TError = Error
> = <TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<
      TResponse,
      TError,
      { data: TCreate },
      TContext
    >;
    request?: RequestInit;
  },
  queryClient?: QueryClient
) => UseMutationResult<TResponse, TError, { data: TCreate }, TContext>;

/**
 * Options for create mutation hook factory
 */
export interface CreateMutationHookOptions<TCreate, TData> {
  /**
   * Query keys to invalidate on successful mutation
   * Can be a single key, multiple keys, or a function returning keys
   *
   * @example
   * // Single key
   * invalidateKeys: getListAccountsApiV1AccountsGetQueryKey()
   *
   * @example
   * // Multiple keys
   * invalidateKeys: [
   *   getListAccountsApiV1AccountsGetQueryKey(),
   *   getAccountStatsQueryKey(),
   * ]
   *
   * @example
   * // Dynamic keys based on created data
   * invalidateKeys: (createdData) => [
   *   getListAccountsApiV1AccountsGetQueryKey(),
   *   getAccountByIdQueryKey(createdData.id),
   * ]
   */
  invalidateKeys?:
    | QueryKey
    | QueryKey[]
    | ((createdData: TData) => QueryKey | QueryKey[]);

  /**
   * Success callback with unwrapped data
   * Called after cache invalidation
   */
  onSuccess?: (createdData: TData, variables: TCreate) => void;

  /**
   * Error callback
   */
  onError?: (error: Error, variables: TCreate) => void;

  /**
   * Optimistic update function
   * Called immediately before mutation, allows updating cache optimistically
   *
   * @example
   * optimisticUpdate: (newData, queryClient) => {
   *   const queryKey = getListAccountsApiV1AccountsGetQueryKey();
   *   queryClient.setQueryData(queryKey, (old) => ({
   *     ...old,
   *     accounts: [...old.accounts, { ...newData, id: 'temp' }],
   *   }));
   * }
   */
  optimisticUpdate?: (variables: TCreate, queryClient: QueryClient) => void;

  /**
   * Whether to show toast notifications
   * @default false
   */
  showToast?: boolean;

  /**
   * Custom success toast message
   */
  successMessage?: string | ((createdData: TData) => string);

  /**
   * Custom error toast message
   */
  errorMessage?: string | ((error: Error) => string);
}

/**
 * Result interface for create mutation hook
 *
 * Provides a consistent, type-safe interface with fixed property names
 */
export interface CreateMutationResult<TCreate, TData> {
  /**
   * Execute the mutation
   * Returns unwrapped data on success
   */
  mutate: (data: TCreate) => void;

  /**
   * Execute the mutation asynchronously
   * Returns a promise with unwrapped data
   */
  mutateAsync: (data: TCreate) => Promise<TData>;

  /**
   * Created data (undefined until mutation succeeds)
   */
  data: TData | undefined;

  /**
   * True while mutation is executing
   */
  isPending: boolean;

  /**
   * True if mutation encountered an error
   */
  isError: boolean;

  /**
   * True if mutation succeeded
   */
  isSuccess: boolean;

  /**
   * Error object (null if no error)
   */
  error: Error | null;

  /**
   * Reset mutation state
   */
  reset: () => void;
}

/**
 * Creates a type-safe CREATE mutation hook
 *
 * This is a factory function that returns a new hook.
 *
 * @example
 * ```typescript
 * // Create the hook (in hooks/useAccounts.ts)
 * import {
 *   useCreateAccountApiV1AccountsPost,
 *   getListAccountsApiV1AccountsGetQueryKey,
 *   type CreateAccountApiV1AccountsPostMutationResult,
 * } from '@/api/generated/accounts/accounts';
 * import type { AccountCreate, AccountResponse } from '@/api/generated/models';
 *
 * export const useCreateAccount = createCreateMutationHook<
 *   CreateAccountApiV1AccountsPostMutationResult,
 *   AccountCreate,
 *   AccountResponse
 * >({
 *   useMutation: useCreateAccountApiV1AccountsPost,
 *   invalidateKeys: getListAccountsApiV1AccountsGetQueryKey(),
 * });
 *
 * // Use in component
 * function CreateAccountForm() {
 *   const { mutate, isPending } = useCreateAccount();
 *
 *   const handleSubmit = (data: AccountCreate) => {
 *     mutate(data);
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 *
 * @example
 * ```typescript
 * // With callbacks and optimistic updates
 * export const useCreateAccount = createCreateMutationHook({
 *   useMutation: useCreateAccountApiV1AccountsPost,
 *   invalidateKeys: getListAccountsApiV1AccountsGetQueryKey(),
 *   onSuccess: (account) => {
 *     console.log('Created account:', account.name);
 *   },
 *   optimisticUpdate: (newAccount, queryClient) => {
 *     const queryKey = getListAccountsApiV1AccountsGetQueryKey();
 *     queryClient.setQueryData(queryKey, (old) => {
 *       if (!old) return old;
 *       return {
 *         ...old.data,
 *         accounts: [...old.data.accounts, { ...newAccount, id: 'temp' }],
 *         total: old.data.total + 1,
 *       };
 *     });
 *   },
 * });
 * ```
 */
export function createCreateMutationHook<
  TResponse extends { data: TData; status: number },
  TCreate,
  TData = ExtractOrvalData<TResponse>,
  TError = Error
>(config: {
  /**
   * Orval-generated mutation hook
   * @example useCreateAccountApiV1AccountsPost
   */
  useMutation: OrvalCreateMutationHook<TResponse, TCreate, TError>;

  /**
   * Default options for all uses of this hook
   */
  defaultOptions?: CreateMutationHookOptions<TCreate, TData>;
}) {
  const { useMutation: useOrvalMutation, defaultOptions } = config;

  // Return a hook (function that calls hooks at top level)
  return (
    options?: CreateMutationHookOptions<TCreate, TData>
  ): CreateMutationResult<TCreate, TData> => {
    const queryClient = useQueryClient();

    // Merge options
    const mergedOptions = { ...defaultOptions, ...options };
    const {
      invalidateKeys,
      onSuccess,
      onError,
      optimisticUpdate,
      showToast,
      successMessage,
      errorMessage,
    } = mergedOptions;

    // Call Orval mutation hook
    const mutation = useOrvalMutation(
      {
        mutation: {
          onMutate: async (variables: { data: TCreate }) => {
            // Run optimistic update if provided
            if (optimisticUpdate) {
              optimisticUpdate(variables.data, queryClient);
            }
          },
          onSuccess: (response: TResponse, variables: { data: TCreate }) => {
            // Extract unwrapped data
            const createdData = response.data as TData;

            // Invalidate queries
            if (invalidateKeys) {
              const keys =
                typeof invalidateKeys === 'function'
                  ? invalidateKeys(createdData)
                  : invalidateKeys;

              const keysArray = Array.isArray(keys[0]) ? keys : [keys];

              keysArray.forEach((key) => {
                queryClient.invalidateQueries({ queryKey: key as QueryKey });
              });
            }

            // Show success toast if enabled
            if (showToast && successMessage) {
              const message =
                typeof successMessage === 'function'
                  ? successMessage(createdData)
                  : successMessage;
              // TODO: Integrate with toast system
              console.log('Success:', message);
            }

            // Call custom success callback
            onSuccess?.(createdData, variables.data);
          },
          onError: (error: TError, variables: { data: TCreate }) => {
            // Show error toast if enabled
            if (showToast && errorMessage) {
              const message =
                typeof errorMessage === 'function'
                  ? errorMessage(error as Error)
                  : errorMessage;
              // TODO: Integrate with toast system
              console.error('Error:', message);
            }

            // Call custom error callback
            onError?.(error as Error, variables.data);
          },
        },
      },
      queryClient
    );

    return {
      mutate: (data: TCreate) => {
        mutation.mutate({ data });
      },
      mutateAsync: async (data: TCreate): Promise<TData> => {
        const response = await mutation.mutateAsync({ data });
        return response.data as TData;
      },
      data: mutation.data?.data as TData | undefined,
      isPending: mutation.isPending,
      isError: mutation.isError,
      isSuccess: mutation.isSuccess,
      error: mutation.error as Error | null,
      reset: mutation.reset,
    };
  };
}

/**
 * Alternative: Simpler version without default options
 *
 * Use this when you don't need default options and want
 * a more straightforward API.
 *
 * @example
 * ```typescript
 * export const useCreateAccount = createSimpleCreateMutationHook(
 *   useCreateAccountApiV1AccountsPost,
 *   {
 *     invalidateKeys: getListAccountsApiV1AccountsGetQueryKey(),
 *   }
 * );
 * ```
 */
export function createSimpleCreateMutationHook<
  TResponse extends { data: TData; status: number },
  TCreate,
  TData = ExtractOrvalData<TResponse>,
  TError = Error
>(
  useMutation: OrvalCreateMutationHook<TResponse, TCreate, TError>,
  options: CreateMutationHookOptions<TCreate, TData>
) {
  return createCreateMutationHook({
    useMutation,
    defaultOptions: options,
  });
}
