/**
 * Factory for creating type-safe DELETE mutation hooks
 *
 * Creates consistent hooks for deleting entities with:
 * - Automatic cache invalidation
 * - Optimistic updates support
 * - Success/error callbacks
 *
 * @module createDeleteMutationHook
 */

import { useQueryClient } from '@tanstack/react-query';
import type {
  UseMutationResult,
  UseMutationOptions,
  QueryKey,
  QueryClient,
} from '@tanstack/react-query';

/**
 * Type signature for Orval-generated DELETE mutation hooks
 *
 * Matches hooks like:
 * - useDeleteAccountApiV1AccountsAccountIdDelete
 * - useDeleteTransactionApiV1TransactionsTransactionIdDelete
 * - etc.
 *
 * DELETE mutations expect variables: { [idParam]: string }
 * Usually return void (status 204)
 */
export type OrvalDeleteMutationHook<
  TResponse,
  TIdParam extends string = 'id',
  TError = Error
> = <TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<
      TResponse,
      TError,
      { [K in TIdParam]: string },
      TContext
    >;
    request?: RequestInit;
  },
  queryClient?: QueryClient
) => UseMutationResult<TResponse, TError, { [K in TIdParam]: string }, TContext>;

/**
 * Options for delete mutation hook factory
 */
export interface DeleteMutationHookOptions {
  /**
   * Query keys to invalidate on successful deletion
   *
   * @example
   * // Invalidate list after delete
   * invalidateKeys: getListAccountsApiV1AccountsGetQueryKey()
   *
   * @example
   * // Invalidate multiple keys
   * invalidateKeys: (id) => [
   *   getListAccountsApiV1AccountsGetQueryKey(),
   *   getAccountStatsQueryKey(),
   * ]
   */
  invalidateKeys?: QueryKey | QueryKey[] | ((id: string) => QueryKey | QueryKey[]);

  /**
   * Success callback
   */
  onSuccess?: (id: string) => void;

  /**
   * Error callback
   */
  onError?: (error: Error, id: string) => void;

  /**
   * Optimistic delete function
   * Removes item from cache immediately
   *
   * @example
   * optimisticDelete: (id, queryClient) => {
   *   const queryKey = getListAccountsApiV1AccountsGetQueryKey();
   *   queryClient.setQueryData(queryKey, (old) => {
   *     if (!old) return old;
   *     return {
   *       ...old.data,
   *       accounts: old.data.accounts.filter(acc => acc.id !== id),
   *       total: old.data.total - 1,
   *     };
   *   });
   * }
   */
  optimisticDelete?: (id: string, queryClient: QueryClient) => void;

  /**
   * Whether to show toast notifications
   * @default false
   */
  showToast?: boolean;

  /**
   * Custom success toast message
   */
  successMessage?: string | ((id: string) => string);

  /**
   * Custom error toast message
   */
  errorMessage?: string | ((error: Error) => string);
}

/**
 * Result interface for delete mutation hook
 */
export interface DeleteMutationResult {
  /**
   * Execute the delete mutation
   */
  mutate: (id: string) => void;

  /**
   * Execute the delete mutation asynchronously
   * Returns void on success
   */
  mutateAsync: (id: string) => Promise<void>;

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
 * Creates a type-safe DELETE mutation hook
 *
 * @example
 * ```typescript
 * // Create the hook
 * import {
 *   useDeleteAccountApiV1AccountsAccountIdDelete,
 *   getListAccountsApiV1AccountsGetQueryKey,
 * } from '@/api/generated/accounts/accounts';
 *
 * export const useDeleteAccount = createDeleteMutationHook({
 *   useMutation: useDeleteAccountApiV1AccountsAccountIdDelete,
 *   idParamName: 'accountId',
 *   defaultOptions: {
 *     invalidateKeys: getListAccountsApiV1AccountsGetQueryKey(),
 *   },
 * });
 *
 * // Use in component
 * function AccountItem({ account }: { account: AccountResponse }) {
 *   const { mutate, isPending } = useDeleteAccount();
 *
 *   const handleDelete = () => {
 *     if (confirm('Delete account?')) {
 *       mutate(account.id);
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleDelete} disabled={isPending}>
 *       Delete
 *     </button>
 *   );
 * }
 * ```
 *
 * @example
 * ```typescript
 * // With optimistic delete
 * export const useDeleteAccount = createDeleteMutationHook({
 *   useMutation: useDeleteAccountApiV1AccountsAccountIdDelete,
 *   idParamName: 'accountId',
 *   defaultOptions: {
 *     invalidateKeys: getListAccountsApiV1AccountsGetQueryKey(),
 *     optimisticDelete: (id, queryClient) => {
 *       const queryKey = getListAccountsApiV1AccountsGetQueryKey();
 *       queryClient.setQueryData(queryKey, (old) => {
 *         if (!old) return old;
 *         return {
 *           ...old.data,
 *           accounts: old.data.accounts.filter(acc => acc.id !== id),
 *           total: old.data.total - 1,
 *         };
 *       });
 *     },
 *     onSuccess: (id) => {
 *       console.log('Deleted account:', id);
 *     },
 *   },
 * });
 * ```
 */
export function createDeleteMutationHook<
  TResponse extends { data: unknown; status: number },
  TIdParam extends string = 'id',
  TError = Error
>(config: {
  /**
   * Orval-generated mutation hook
   * @example useDeleteAccountApiV1AccountsAccountIdDelete
   */
  useMutation: OrvalDeleteMutationHook<TResponse, TIdParam, TError>;

  /**
   * Name of the ID parameter in Orval mutation
   * @example 'accountId', 'transactionId', 'budgetId'
   * @default 'id'
   */
  idParamName?: TIdParam;

  /**
   * Default options for all uses of this hook
   */
  defaultOptions?: DeleteMutationHookOptions;
}) {
  const { useMutation: useOrvalMutation, idParamName, defaultOptions } = config;

  // Return a hook
  return (options?: DeleteMutationHookOptions): DeleteMutationResult => {
    const queryClient = useQueryClient();

    // Merge options
    const mergedOptions = { ...defaultOptions, ...options };
    const {
      invalidateKeys,
      onSuccess,
      onError,
      optimisticDelete,
      showToast,
      successMessage,
      errorMessage,
    } = mergedOptions;

    // Call Orval mutation hook
    const mutation = useOrvalMutation(
      {
        mutation: {
          onMutate: async (variables: { [K in TIdParam]: string }) => {
            const id = variables[idParamName as TIdParam] as string;

            // Run optimistic delete if provided
            if (optimisticDelete) {
              optimisticDelete(id, queryClient);
            }
          },
          onSuccess: (
            _response: TResponse,
            variables: { [K in TIdParam]: string }
          ) => {
            const id = variables[idParamName as TIdParam] as string;

            // Invalidate queries
            if (invalidateKeys) {
              const keys =
                typeof invalidateKeys === 'function'
                  ? invalidateKeys(id)
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
                  ? successMessage(id)
                  : successMessage;
              console.log('Success:', message);
            }

            // Call custom success callback
            onSuccess?.(id);
          },
          onError: (error: TError, variables: { [K in TIdParam]: string }) => {
            const id = variables[idParamName as TIdParam] as string;

            // Show error toast if enabled
            if (showToast && errorMessage) {
              const message =
                typeof errorMessage === 'function'
                  ? errorMessage(error as Error)
                  : errorMessage;
              console.error('Error:', message);
            }

            // Call custom error callback
            onError?.(error as Error, id);
          },
        },
      },
      queryClient
    );

    return {
      mutate: (id: string) => {
        mutation.mutate({ [idParamName as TIdParam]: id } as {
          [K in TIdParam]: string;
        });
      },
      mutateAsync: async (id: string): Promise<void> => {
        await mutation.mutateAsync({ [idParamName as TIdParam]: id } as {
          [K in TIdParam]: string;
        });
      },
      isPending: mutation.isPending,
      isError: mutation.isError,
      isSuccess: mutation.isSuccess,
      error: mutation.error as Error | null,
      reset: mutation.reset,
    };
  };
}
