/**
 * React Query hooks for Account operations
 */
import {
  useGetAccountApiV1AccountsAccountIdGet,
  useCreateAccountApiV1AccountsPost,
  useUpdateAccountApiV1AccountsAccountIdPut,
  useDeleteAccountApiV1AccountsAccountIdDelete,
  useGetAccountBalanceApiV1AccountsAccountIdBalanceGet,
  getListAccountsApiV1AccountsGetQueryKey,
  listAccountsApiV1AccountsGet,
  type CreateAccountApiV1AccountsPostMutationResult,
  type UpdateAccountApiV1AccountsAccountIdPutMutationResult,
  type DeleteAccountApiV1AccountsAccountIdDeleteMutationResult,
  listAccountsApiV1AccountsGetResponse,
} from '@/api/generated/accounts/accounts';
import type {
  AccountCreate,
  AccountUpdate,
  AccountResponse,
  AccountBalance,
  ListAccountsApiV1AccountsGetParams,
} from '@/api/generated/models';
import { useProfileContext } from '@/contexts/ProfileContext';
import { createMultiProfileListHook } from '@/hooks/factories/createMultiProfileListHook';
import { createGetByIdHook } from '@/hooks/factories/createGetByIdHook';
import { createCreateMutationHook } from '@/hooks/factories/createCreateMutationHook';
import { createUpdateMutationHook } from '@/hooks/factories/createUpdateMutationHook';
import { createDeleteMutationHook } from '@/hooks/factories/createDeleteMutationHook';
import type { ExtractOrvalData } from '@/lib/orval-types';
import { AccountList } from './accounts.types';

/**
 * Base hook for listing accounts across multiple profiles
 * Created using the multi-profile list hook factory
 */
const useAccountsBase = createMultiProfileListHook<
  ListAccountsApiV1AccountsGetParams,
  listAccountsApiV1AccountsGetResponse,
  AccountResponse
>({
  getQueryKey: getListAccountsApiV1AccountsGetQueryKey,
  queryFn: listAccountsApiV1AccountsGet,
  extractItems: (response) => (response.data as AccountList)?.accounts,
  extractTotal: (response) => (response.data as AccountList)?.total,
});

/**
 * Hook to list all accounts
 * Fetches accounts from all active profiles and aggregates the results
 */
export const useAccounts = () => {
  const { activeProfileIds, isLoading: profileLoading } = useProfileContext();

  const result = useAccountsBase(activeProfileIds, {
    enabled: !profileLoading,
  });

  return {
    accounts: result.items,
    total: result.total,
    isLoading: result.isLoading || profileLoading,
    error: result.error,
    refetch: result.refetch,
  };
};

/**
 * Base hook for getting a single account by ID
 * Created using the GET by ID hook factory
 */
const useAccountBase = createGetByIdHook<
  { data: AccountResponse; status: number },
  AccountResponse
>({
  useQuery: useGetAccountApiV1AccountsAccountIdGet,
});

/**
 * Hook to get a single account by ID
 */
export const useAccount = (accountId: string) => {
  const result = useAccountBase(accountId);

  return {
    account: result.data,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
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
 * Base hook for creating accounts
 * Created using the CREATE mutation hook factory
 */
const useCreateAccountBase = createCreateMutationHook<
  CreateAccountApiV1AccountsPostMutationResult,
  AccountCreate
>({
  useMutation: useCreateAccountApiV1AccountsPost,
  defaultOptions: {
    invalidateKeys: getListAccountsApiV1AccountsGetQueryKey(),
  },
});

/**
 * Hook to create a new account
 */
export const useCreateAccount = () => {
  const { mutateAsync, isPending, error, reset } = useCreateAccountBase();

  return {
    createAccount: mutateAsync,
    isCreating: isPending,
    error,
    reset,
  };
};

/**
 * Base hook for updating accounts
 * Created using the UPDATE mutation hook factory
 */
const useUpdateAccountBase = createUpdateMutationHook<
  UpdateAccountApiV1AccountsAccountIdPutMutationResult,
  AccountUpdate,
  ExtractOrvalData<UpdateAccountApiV1AccountsAccountIdPutMutationResult>,
  'accountId'
>({
  useMutation: useUpdateAccountApiV1AccountsAccountIdPut,
  idParamName: 'accountId',
  defaultOptions: {
    invalidateKeys: getListAccountsApiV1AccountsGetQueryKey(),
  },
});

/**
 * Hook to update an existing account
 */
export const useUpdateAccount = () => {
  const { mutateAsync, isPending, error, reset } = useUpdateAccountBase();

  return {
    updateAccount: mutateAsync,
    isUpdating: isPending,
    error,
    reset,
  };
};

/**
 * Base hook for deleting accounts
 * Created using the DELETE mutation hook factory
 */
const useDeleteAccountBase = createDeleteMutationHook<
  DeleteAccountApiV1AccountsAccountIdDeleteMutationResult,
  'accountId'
>({
  useMutation: useDeleteAccountApiV1AccountsAccountIdDelete,
  idParamName: 'accountId',
  defaultOptions: {
    invalidateKeys: getListAccountsApiV1AccountsGetQueryKey(),
  },
});

/**
 * Hook to delete an account
 */
export const useDeleteAccount = () => {
  const { mutateAsync, isPending, error, reset } = useDeleteAccountBase();

  return {
    deleteAccount: mutateAsync,
    isDeleting: isPending,
    error,
    reset,
  };
};
