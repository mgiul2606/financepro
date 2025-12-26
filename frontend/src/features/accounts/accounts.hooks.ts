/**
 * React Query hooks for Account operations
 * Provides optimistic updates and cache management
 */
import { useQueries } from '@tanstack/react-query';
import {
  useGetAccountApiV1AccountsAccountIdGet,
  useCreateAccountApiV1AccountsPost,
  useUpdateAccountApiV1AccountsAccountIdPut,
  useDeleteAccountApiV1AccountsAccountIdDelete,
  useGetAccountBalanceApiV1AccountsAccountIdBalanceGet,
  getListAccountsApiV1AccountsGetQueryKey,
  listAccountsApiV1AccountsGet,
  createAccountApiV1AccountsPostResponse,
  updateAccountApiV1AccountsAccountIdPutResponse,
} from '@/api/generated/accounts/accounts';
import { useProfileContext } from '@/contexts/ProfileContext';
import {
  useGenericCreate,
  useGenericUpdate,
  useGenericDelete,
  ExtractResponseData,
} from '@/hooks/useGenericMutations';

import type {
  AccountCreate,
  AccountUpdate,
  AccountResponse,
  AccountBalance,
} from './accounts.types';

/**
 * Hook to list all accounts
 * Fetches accounts from all active profiles and aggregates the results
 */
export const useAccounts = () => {
  const { activeProfileIds, isLoading: profileLoading } = useProfileContext();

  // Create queries for each active profile
  const queries = useQueries({
    queries: activeProfileIds.map((profileId) => ({
      queryKey: [...getListAccountsApiV1AccountsGetQueryKey(), profileId],
      queryFn: () =>
        listAccountsApiV1AccountsGet(),
      enabled: !profileLoading && activeProfileIds.length > 0,
    })),
  });

  // Aggregate results from all profiles
  const allAccounts = queries.flatMap(
    (query) => query.data?.data?.accounts || []
  );
  const totalCount = queries.reduce(
    (sum, query) => sum + (query.data?.data?.total || 0),
    0
  );
  const isLoading = profileLoading || queries.some((query) => query.isLoading);
  const error = queries.find((query) => query.error)?.error || null;

  const refetch = () => {
    queries.forEach((query) => query.refetch());
  };

  return {
    accounts: allAccounts as AccountResponse[],
    total: totalCount,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook to get a single account by ID
 */
export const useAccount = (accountId: string) => {
  const query = useGetAccountApiV1AccountsAccountIdGet(accountId, {
    query: {
      enabled: !!accountId && accountId.length > 0,
    },
  });

  return {
    account: query.data?.data as AccountResponse | undefined,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to get account balance
 */
export const useAccountBalance = (accountId: string) => {
  const query = useGetAccountBalanceApiV1AccountsAccountIdBalanceGet(
    accountId,
    {
      query: {
        enabled: !!accountId && accountId.length > 0,
      },
    }
  );

  return {
    balance: query.data?.data as AccountBalance | undefined,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to create a new account
 * Uses generic mutation factory for consistency
 */
export const useCreateAccount = () => {
  const result = useGenericCreate<
    AccountCreate,
    createAccountApiV1AccountsPostResponse,
    ExtractResponseData<createAccountApiV1AccountsPostResponse>,
    Error,
    { data: AccountCreate }
  >({
    useMutation: useCreateAccountApiV1AccountsPost,
    invalidateQueryKey: getListAccountsApiV1AccountsGetQueryKey,
    mutationName: 'createAccount',
  });

  return {
    createAccount: result.createAccount,
    isCreating: result.isPending,
    error: result.error,
    reset: result.reset,
  };
};

/**
 * Hook to update an existing account
 * Uses generic mutation factory for consistency
 */
export const useUpdateAccount = () => {
  const result = useGenericUpdate<
    AccountUpdate,
    updateAccountApiV1AccountsAccountIdPutResponse,
    ExtractResponseData<updateAccountApiV1AccountsAccountIdPutResponse>,
    Error,
    { accountId: string; data: AccountUpdate }
  >({
    useMutation: useUpdateAccountApiV1AccountsAccountIdPut,
    invalidateQueryKey: getListAccountsApiV1AccountsGetQueryKey,
    mutationName: 'updateAccount',
    idParamName: 'accountId',
  });

  return {
    updateAccount: result.updateAccount,
    isUpdating: result.isPending,
    error: result.error,
    reset: result.reset,
  };
};

/**
 * Hook to delete an account
 * Uses generic mutation factory for consistency
 */
export const useDeleteAccount = () => {
  const result = useGenericDelete({
    useMutation: useDeleteAccountApiV1AccountsAccountIdDelete,
    invalidateQueryKey: getListAccountsApiV1AccountsGetQueryKey,
    mutationName: 'deleteAccount',
    idParamName: 'accountId',
  });

  return {
    deleteAccount: result.deleteAccount,
    isDeleting: result.isPending,
    error: result.error,
    reset: result.reset,
  };
};
