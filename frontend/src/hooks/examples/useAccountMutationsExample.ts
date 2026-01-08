/**
 * EXAMPLE FILE - Demonstrates how to use the mutation hook factories
 *
 * This file shows concrete examples of creating type-safe mutation hooks
 * using the factory functions with real Orval-generated methods.
 *
 * Copy these patterns to create your own domain-specific mutation hooks.
 *
 * @module useAccountMutationsExample
 */

import {
  useCreateAccountApiV1AccountsPost,
  useUpdateAccountApiV1AccountsAccountIdPut,
  useDeleteAccountApiV1AccountsAccountIdDelete,
  getListAccountsApiV1AccountsGetQueryKey,
  getGetAccountApiV1AccountsAccountIdGetQueryKey,
  type CreateAccountApiV1AccountsPostMutationResult,
  type UpdateAccountApiV1AccountsAccountIdPutMutationResult,
  type DeleteAccountApiV1AccountsAccountIdDeleteMutationResult,
} from '@/api/generated/accounts/accounts';
import type {
  AccountCreate,
  AccountUpdate,
  AccountResponse,
} from '@/api/generated/models';
import { createCreateMutationHook } from '../factories/createCreateMutationHook';
import { createUpdateMutationHook } from '../factories/createUpdateMutationHook';
import { createDeleteMutationHook } from '../factories/createDeleteMutationHook';

// ============================================================================
// Example 1: CREATE Mutation (Basic)
// ============================================================================

/**
 * Hook to create a new account
 *
 * @example
 * ```tsx
 * function CreateAccountForm() {
 *   const { mutate, isPending, error } = useCreateAccount();
 *
 *   const handleSubmit = (data: AccountCreate) => {
 *     mutate(data);
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {error && <div>Error: {error.message}</div>}
 *       <button type="submit" disabled={isPending}>
 *         {isPending ? 'Creating...' : 'Create Account'}
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 */
export const useCreateAccount = createCreateMutationHook<
  CreateAccountApiV1AccountsPostMutationResult,
  AccountCreate,
  AccountResponse
>({
  useMutation: useCreateAccountApiV1AccountsPost,
  defaultOptions: {
    // Invalidate list after creating
    invalidateKeys: getListAccountsApiV1AccountsGetQueryKey({}),
  },
});

// ============================================================================
// Example 2: CREATE Mutation (With Callbacks)
// ============================================================================

/**
 * Hook to create account with success/error callbacks
 */
export const useCreateAccountWithCallbacks = createCreateMutationHook<
  CreateAccountApiV1AccountsPostMutationResult,
  AccountCreate,
  AccountResponse
>({
  useMutation: useCreateAccountApiV1AccountsPost,
  defaultOptions: {
    invalidateKeys: getListAccountsApiV1AccountsGetQueryKey({}),
    onSuccess: (account) => {
      console.log('Account created successfully:', account.name);
      // Could navigate to account details page
      // router.push(`/accounts/${account.id}`);
    },
    onError: (error) => {
      console.error('Failed to create account:', error);
    },
  },
});

// ============================================================================
// Example 3: CREATE Mutation (With Optimistic Updates)
// ============================================================================

/**
 * Hook to create account with optimistic UI update
 *
 * The account appears in the list immediately, before the API responds
 */
export const useCreateAccountOptimistic = createCreateMutationHook<
  CreateAccountApiV1AccountsPostMutationResult,
  AccountCreate,
  AccountResponse
>({
  useMutation: useCreateAccountApiV1AccountsPost,
  defaultOptions: {
    invalidateKeys: (createdAccount) => [
      getListAccountsApiV1AccountsGetQueryKey({}),
      // Also invalidate the single account query for the new ID
      getGetAccountApiV1AccountsAccountIdGetQueryKey(createdAccount.id),
    ],
    optimisticUpdate: (newAccount, queryClient) => {
      const queryKey = getListAccountsApiV1AccountsGetQueryKey({});

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;

        // Add temporary account to list
        return {
          ...old,
          data: {
            ...old.data,
            accounts: [
              ...old.data.accounts,
              {
                ...newAccount,
                id: 'temp-' + Date.now(), // Temporary ID
                currentBalance: newAccount.initialBalance ?? '0',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
            total: old.data.total + 1,
          },
        };
      });
    },
    onSuccess: (account) => {
      console.log('Account created:', account.id);
    },
  },
});

// ============================================================================
// Example 4: UPDATE Mutation (Basic)
// ============================================================================

/**
 * Hook to update an existing account
 *
 * @example
 * ```tsx
 * function EditAccountForm({ account }: { account: AccountResponse }) {
 *   const { mutate, isPending } = useUpdateAccount();
 *
 *   const handleSubmit = (data: AccountUpdate) => {
 *     mutate(account.id, data);
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <button type="submit" disabled={isPending}>
 *         {isPending ? 'Saving...' : 'Save Changes'}
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 */
export const useUpdateAccount = createUpdateMutationHook<
  UpdateAccountApiV1AccountsAccountIdPutMutationResult,
  AccountUpdate,
  AccountResponse
>({
  useMutation: useUpdateAccountApiV1AccountsAccountIdPut,
  idParamName: 'accountId',
  defaultOptions: {
    // Invalidate both list and single account
    invalidateKeys: (_, accountId) => [
      getListAccountsApiV1AccountsGetQueryKey({}),
      getGetAccountApiV1AccountsAccountIdGetQueryKey(accountId),
    ],
  },
});

// ============================================================================
// Example 5: UPDATE Mutation (With Optimistic Updates)
// ============================================================================

/**
 * Hook to update account with optimistic UI update
 *
 * Changes appear immediately in the UI
 */
export const useUpdateAccountOptimistic = createUpdateMutationHook<
  UpdateAccountApiV1AccountsAccountIdPutMutationResult,
  AccountUpdate,
  AccountResponse
>({
  useMutation: useUpdateAccountApiV1AccountsAccountIdPut,
  idParamName: 'accountId',
  defaultOptions: {
    invalidateKeys: (_, accountId) => [
      getListAccountsApiV1AccountsGetQueryKey({}),
      getGetAccountApiV1AccountsAccountIdGetQueryKey(accountId),
    ],
    optimisticUpdate: (accountId, updates, queryClient) => {
      // Update single account query
      const singleKey = getGetAccountApiV1AccountsAccountIdGetQueryKey(accountId);
      queryClient.setQueryData(singleKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            ...updates,
            updatedAt: new Date().toISOString(),
          },
        };
      });

      // Update list query
      const listKey = getListAccountsApiV1AccountsGetQueryKey({});
      queryClient.setQueryData(listKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            accounts: old.data.accounts.map((acc: AccountResponse) =>
              acc.id === accountId
                ? { ...acc, ...updates, updatedAt: new Date().toISOString() }
                : acc
            ),
          },
        };
      });
    },
    onSuccess: (account) => {
      console.log('Account updated:', account.name);
    },
  },
});

// ============================================================================
// Example 6: DELETE Mutation (Basic)
// ============================================================================

/**
 * Hook to delete an account
 *
 * @example
 * ```tsx
 * function AccountListItem({ account }: { account: AccountResponse }) {
 *   const { mutate, isPending } = useDeleteAccount();
 *
 *   const handleDelete = () => {
 *     if (confirm(`Delete ${account.name}?`)) {
 *       mutate(account.id);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <h3>{account.name}</h3>
 *       <button onClick={handleDelete} disabled={isPending}>
 *         {isPending ? 'Deleting...' : 'Delete'}
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useDeleteAccount = createDeleteMutationHook<
  DeleteAccountApiV1AccountsAccountIdDeleteMutationResult
>({
  useMutation: useDeleteAccountApiV1AccountsAccountIdDelete,
  idParamName: 'accountId',
  defaultOptions: {
    invalidateKeys: getListAccountsApiV1AccountsGetQueryKey({}),
  },
});

// ============================================================================
// Example 7: DELETE Mutation (With Optimistic Delete)
// ============================================================================

/**
 * Hook to delete account with optimistic UI update
 *
 * Account disappears from list immediately
 */
export const useDeleteAccountOptimistic = createDeleteMutationHook<
  DeleteAccountApiV1AccountsAccountIdDeleteMutationResult
>({
  useMutation: useDeleteAccountApiV1AccountsAccountIdDelete,
  idParamName: 'accountId',
  defaultOptions: {
    invalidateKeys: getListAccountsApiV1AccountsGetQueryKey({}),
    optimisticDelete: (accountId, queryClient) => {
      const listKey = getListAccountsApiV1AccountsGetQueryKey({});

      queryClient.setQueryData(listKey, (old: any) => {
        if (!old) return old;

        return {
          ...old,
          data: {
            ...old.data,
            accounts: old.data.accounts.filter(
              (acc: AccountResponse) => acc.id !== accountId
            ),
            total: old.data.total - 1,
          },
        };
      });
    },
    onSuccess: (accountId) => {
      console.log('Account deleted:', accountId);
    },
    onError: (error, accountId) => {
      console.error('Failed to delete account:', accountId, error);
      // Optimistic update will be reverted automatically by React Query
    },
  },
});

// ============================================================================
// Example 8: Using mutateAsync for Chained Operations
// ============================================================================

/**
 * Example: Create account and then navigate to it
 *
 * @example
 * ```tsx
 * function CreateAccountWithNavigation() {
 *   const { mutateAsync, isPending } = useCreateAccount();
 *   const router = useRouter();
 *
 *   const handleSubmit = async (data: AccountCreate) => {
 *     try {
 *       const account = await mutateAsync(data);
 *       router.push(`/accounts/${account.id}`);
 *     } catch (error) {
 *       console.error('Failed to create account:', error);
 *     }
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export const useCreateAccountWithNavigation = () => {
  return useCreateAccount();
};

// ============================================================================
// Example 9: Combining Multiple Mutations
// ============================================================================

/**
 * Example: Custom hook that combines multiple mutations
 *
 * @example
 * ```tsx
 * function AccountManager() {
 *   const { create, update, remove } = useAccountMutations();
 *
 *   const handleCreate = (data: AccountCreate) => {
 *     create.mutate(data);
 *   };
 *
 *   const handleUpdate = (id: string, data: AccountUpdate) => {
 *     update.mutate(id, data);
 *   };
 *
 *   const handleDelete = (id: string) => {
 *     remove.mutate(id);
 *   };
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export const useAccountMutations = () => {
  const create = useCreateAccount();
  const update = useUpdateAccount();
  const remove = useDeleteAccount();

  return {
    create,
    update,
    remove,
    // Convenience flags
    isAnyPending: create.isPending || update.isPending || remove.isPending,
    hasError: create.isError || update.isError || remove.isError,
  };
};

// ============================================================================
// Example 10: Runtime Options Override
// ============================================================================

/**
 * Example: Using runtime options to override defaults
 *
 * @example
 * ```tsx
 * function SpecialAccountForm() {
 *   const { mutate } = useCreateAccount();
 *
 *   const handleSubmit = (data: AccountCreate) => {
 *     // Override default invalidation for this specific call
 *     mutate(data, {
 *       invalidateKeys: [
 *         getListAccountsApiV1AccountsGetQueryKey({}),
 *         // Additional key specific to this case
 *         ['special-accounts'],
 *       ],
 *       onSuccess: (account) => {
 *         console.log('Special account created:', account);
 *       },
 *     });
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 *
 * NOTE: This feature would require modifications to the factory
 * to accept runtime options. The current implementation uses
 * default options only.
 */

// ============================================================================
// Type Exports for Consumers
// ============================================================================

export type CreateAccountMutationResult = ReturnType<typeof useCreateAccount>;
export type UpdateAccountMutationResult = ReturnType<typeof useUpdateAccount>;
export type DeleteAccountMutationResult = ReturnType<typeof useDeleteAccount>;
