// features/accounts/hooks/useAccounts.ts
/**
 * React Query hooks for Account operations
 * Wraps the generated orval hooks for better usability
 */
import { useQueryClient } from '@tanstack/react-query';
import {
  useListAccountsApiV1AccountsGet,
  useGetAccountApiV1AccountsAccountIdGet,
  useCreateAccountApiV1AccountsPost,
  useUpdateAccountApiV1AccountsAccountIdPut,
  useDeleteAccountApiV1AccountsAccountIdDelete,
  useGetAccountBalanceApiV1AccountsAccountIdBalanceGet,
  getListAccountsApiV1AccountsGetQueryKey,
} from '@/api/generated/accounts/accounts';
import type { AccountCreate, AccountUpdate } from '../types';

/**
 * Hook to list all accounts
 */
export const useAccounts = () => {
  const query = useListAccountsApiV1AccountsGet();

  return {
    accounts: query.data?.data?.accounts || [],
    total: query.data?.data?.total || 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to get a single account by ID
 */
export const useAccount = (accountId: number) => {
  const query = useGetAccountApiV1AccountsAccountIdGet(accountId, {
    query: {
      enabled: !!accountId && accountId > 0,
    },
  });

  return {
    account: query.data?.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to get account balance
 */
export const useAccountBalance = (accountId: number) => {
  const query = useGetAccountBalanceApiV1AccountsAccountIdBalanceGet(accountId, {
    query: {
      enabled: !!accountId && accountId > 0,
    },
  });

  return {
    balance: query.data?.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to create a new account
 */
export const useCreateAccount = () => {
  const queryClient = useQueryClient();

  const mutation = useCreateAccountApiV1AccountsPost({
    mutation: {
      onSuccess: () => {
        // Invalidate accounts list to refetch
        queryClient.invalidateQueries({
          queryKey: getListAccountsApiV1AccountsGetQueryKey(),
        });
      },
    },
  });

  return {
    createAccount: (data: AccountCreate) => mutation.mutateAsync({ data }),
    isCreating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * Hook to update an existing account
 */
export const useUpdateAccount = () => {
  const queryClient = useQueryClient();

  const mutation = useUpdateAccountApiV1AccountsAccountIdPut({
    mutation: {
      onSuccess: () => {
        // Invalidate accounts list to refetch
        queryClient.invalidateQueries({
          queryKey: getListAccountsApiV1AccountsGetQueryKey(),
        });
      },
    },
  });

  return {
    updateAccount: (accountId: number, data: AccountUpdate) =>
      mutation.mutateAsync({ accountId, data }),
    isUpdating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * Hook to delete an account
 */
export const useDeleteAccount = () => {
  const queryClient = useQueryClient();

  const mutation = useDeleteAccountApiV1AccountsAccountIdDelete({
    mutation: {
      onSuccess: () => {
        // Invalidate accounts list to refetch
        queryClient.invalidateQueries({
          queryKey: getListAccountsApiV1AccountsGetQueryKey(),
        });
      },
    },
  });

  return {
    deleteAccount: (accountId: number) => mutation.mutateAsync({ accountId }),
    isDeleting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
