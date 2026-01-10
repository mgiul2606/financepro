/**
 * Factory for creating type-safe UPDATE (PUT) mutation hooks
 *
 * Creates consistent hooks for updating entities with:
 * - Automatic data extraction from Orval responses
 * - Type-safe cache invalidation
 * - Optimistic updates support
 * - Success/error callbacks
 *
 * @module createUpdateMutationHook
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
 * Type signature for Orval-generated UPDATE mutation hooks
 *
 * Matches hooks like:
 * - useUpdateAccountApiV1AccountsAccountIdPut
 * - useUpdateTransactionApiV1TransactionsTransactionIdPut
 * - etc.
 *
 * UPDATE mutations expect variables: { [idParam]: string, data: TUpdate }
 * Uses `any` for variables to support all Orval-generated mutation signatures.
 */
export type OrvalUpdateMutationHook<
  TResponse,
  TUpdate,
  TError = Error
> = <TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<TResponse, TError, any, TContext>;
    request?: RequestInit;
  },
  queryClient?: QueryClient
) => UseMutationResult<TResponse, TError, any, TContext>;

/**
 * Options for update mutation hook factory
 */
export interface UpdateMutationHookOptions<TUpdate, TData> {
  /**
   * Query keys to invalidate on successful mutation
   * Can be dynamic based on the updated data
   *
   * @example
   * // Invalidate list and single entity
   * invalidateKeys: (updatedData, id) => [
   *   getListAccountsApiV1AccountsGetQueryKey(),
   *   getGetAccountApiV1AccountsAccountIdGetQueryKey(id),
   * ]
   */
  invalidateKeys?:
    | QueryKey
    | QueryKey[]
    | ((updatedData: TData, id: string) => QueryKey | QueryKey[]);

  /**
   * Success callback with unwrapped data
   */
  onSuccess?: (updatedData: TData, id: string, variables: TUpdate) => void;

  /**
   * Error callback
   */
  onError?: (error: Error, id: string, variables: TUpdate) => void;

  /**
   * Optimistic update function
   *
   * @example
   * optimisticUpdate: (id, updates, queryClient) => {
   *   const queryKey = getGetAccountApiV1AccountsAccountIdGetQueryKey(id);
   *   queryClient.setQueryData(queryKey, (old) => ({
   *     ...old,
   *     data: { ...old.data, ...updates },
   *   }));
   * }
   */
  optimisticUpdate?: (
    id: string,
    variables: TUpdate,
    queryClient: QueryClient
  ) => void;

  /**
   * Whether to show toast notifications
   * @default false
   */
  showToast?: boolean;

  /**
   * Custom success toast message
   */
  successMessage?: string | ((updatedData: TData) => string);

  /**
   * Custom error toast message
   */
  errorMessage?: string | ((error: Error) => string);
}

/**
 * Result interface for update mutation hook
 */
export interface UpdateMutationResult<TUpdate, TData> {
  /**
   * Execute the mutation
   */
  mutate: (id: string, data: TUpdate) => void;

  /**
   * Execute the mutation asynchronously
   * Returns unwrapped data
   */
  mutateAsync: (id: string, data: TUpdate) => Promise<TData>;

  /**
   * Updated data (undefined until mutation succeeds)
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
 * Creates a type-safe UPDATE mutation hook
 *
 * @example
 * ```typescript
 * // Create the hook
 * import {
 *   useUpdateAccountApiV1AccountsAccountIdPut,
 *   getListAccountsApiV1AccountsGetQueryKey,
 *   getGetAccountApiV1AccountsAccountIdGetQueryKey,
 * } from '@/api/generated/accounts/accounts';
 * import type { AccountUpdate, AccountResponse } from '@/api/generated/models';
 *
 * export const useUpdateAccount = createUpdateMutationHook<
 *   UpdateAccountApiV1AccountsAccountIdPutMutationResult,
 *   AccountUpdate,
 *   AccountResponse,
 *   'accountId'
 * >({
 *   useMutation: useUpdateAccountApiV1AccountsAccountIdPut,
 *   idParamName: 'accountId',
 *   defaultOptions: {
 *     invalidateKeys: (_, accountId) => [
 *       getListAccountsApiV1AccountsGetQueryKey(),
 *       getGetAccountApiV1AccountsAccountIdGetQueryKey(accountId),
 *     ],
 *   },
 * });
 *
 * // Use in component
 * function EditAccountForm({ accountId }: { accountId: string }) {
 *   const { mutate, isPending } = useUpdateAccount();
 *
 *   const handleSubmit = (data: AccountUpdate) => {
 *     mutate(accountId, data);
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 *
 * @example
 * ```typescript
 * // With optimistic updates
 * export const useUpdateAccount = createUpdateMutationHook({
 *   useMutation: useUpdateAccountApiV1AccountsAccountIdPut,
 *   idParamName: 'accountId',
 *   defaultOptions: {
 *     invalidateKeys: (_, id) => [
 *       getListAccountsApiV1AccountsGetQueryKey(),
 *       getGetAccountApiV1AccountsAccountIdGetQueryKey(id),
 *     ],
 *     optimisticUpdate: (id, updates, queryClient) => {
 *       // Update single entity cache
 *       const singleKey = getGetAccountApiV1AccountsAccountIdGetQueryKey(id);
 *       queryClient.setQueryData(singleKey, (old) => {
 *         if (!old) return old;
 *         return {
 *           ...old,
 *           data: { ...old.data, ...updates },
 *         };
 *       });
 *
 *       // Update list cache
 *       const listKey = getListAccountsApiV1AccountsGetQueryKey();
 *       queryClient.setQueryData(listKey, (old) => {
 *         if (!old) return old;
 *         return {
 *           ...old.data,
 *           accounts: old.data.accounts.map((acc) =>
 *             acc.id === id ? { ...acc, ...updates } : acc
 *           ),
 *         };
 *       });
 *     },
 *   },
 * });
 * ```
 */
export function createUpdateMutationHook<
  TResponse extends { data: unknown; status: number },
  TUpdate,
  TData = ExtractOrvalData<TResponse>,
  TError = Error
>(config: {
  /**
   * Orval-generated mutation hook
   * @example useUpdateAccountApiV1AccountsAccountIdPut
   */
  useMutation: OrvalUpdateMutationHook<TResponse, TUpdate, TError>;

  /**
   * Name of the ID parameter in Orval mutation
   * @example 'accountId', 'transactionId', 'budgetId'
   * @default 'id'
   */
  idParamName?: string;

  /**
   * Default options for all uses of this hook
   */
  defaultOptions?: UpdateMutationHookOptions<TUpdate, TData>;
}) {
  const { useMutation: useOrvalMutation, idParamName, defaultOptions } = config;

  // Return a hook
  return (
    options?: UpdateMutationHookOptions<TUpdate, TData>
  ): UpdateMutationResult<TUpdate, TData> => {
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
          onMutate: async (variables: any) => {
            const id = variables[idParamName ?? 'id'] as string;

            // Run optimistic update if provided
            if (optimisticUpdate) {
              optimisticUpdate(id, variables.data, queryClient);
            }
          },
          onSuccess: (response: TResponse, variables: any) => {
            const updatedData = response.data as TData;
            const id = variables[idParamName ?? 'id'] as string;

            // Invalidate queries
            if (invalidateKeys) {
              const keys =
                typeof invalidateKeys === 'function'
                  ? invalidateKeys(updatedData, id)
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
                  ? successMessage(updatedData)
                  : successMessage;
              console.log('Success:', message);
            }

            // Call custom success callback
            onSuccess?.(updatedData, id, variables.data);
          },
          onError: (error: TError, variables: any) => {
            const id = variables[idParamName ?? 'id'] as string;

            // Show error toast if enabled
            if (showToast && errorMessage) {
              const message =
                typeof errorMessage === 'function'
                  ? errorMessage(error as Error)
                  : errorMessage;
              console.error('Error:', message);
            }

            // Call custom error callback
            onError?.(error as Error, id, variables.data);
          },
        },
      },
      queryClient
    );

    return {
      mutate: (id: string, data: TUpdate) => {
        mutation.mutate({ [idParamName ?? 'id']: id, data });
      },
      mutateAsync: async (id: string, data: TUpdate): Promise<TData> => {
        const response = await mutation.mutateAsync({
          [idParamName ?? 'id']: id,
          data,
        });
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
