/**
 * EXAMPLE FILE - Demonstrates how to use the hook factories
 *
 * This file shows concrete examples of creating type-safe hooks
 * using the factory functions with real Orval-generated methods.
 *
 * Copy these patterns to create your own domain-specific hooks.
 *
 * @module useAccountsExample
 */

import {
  useGetAccountApiV1AccountsAccountIdGet,
  useListAccountsApiV1AccountsGet,
  getListAccountsApiV1AccountsGetQueryKey,
  listAccountsApiV1AccountsGet,
  type GetAccountApiV1AccountsAccountIdGetQueryResult,
  type ListAccountsApiV1AccountsGetQueryResult,
  type ListAccountsApiV1AccountsGetParams,
} from '@/api/generated/accounts/accounts';
import type { AccountResponse, AccountList } from '@/api/generated/models';
import { createGetByIdHook, createGetByIdHookWithSelect } from '../factories/createGetByIdHook';
import { createMultiProfileListHook } from '../factories/createMultiProfileListHook';

// ============================================================================
// Example 1: GET by ID Hook
// ============================================================================

/**
 * Hook to fetch a single account by ID
 *
 * @example
 * ```tsx
 * function AccountDetails({ accountId }: { accountId: string }) {
 *   const { data, isLoading, error } = useAccount(accountId);
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!data) return <div>Account not found</div>;
 *
 *   return (
 *     <div>
 *       <h1>{data.name}</h1>
 *       <p>Balance: {data.currentBalance}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export const useAccount = createGetByIdHook<
  GetAccountApiV1AccountsAccountIdGetQueryResult,
  AccountResponse
>({
  useQuery: useGetAccountApiV1AccountsAccountIdGet,
  defaultOptions: {
    staleTime: 30000, // Consider data fresh for 30 seconds
  },
});

/**
 * Alternative: Using the select-based approach
 *
 * This version uses TanStack Query's `select` option to unwrap
 * data at the query level, which is more idiomatic.
 */
export const useAccountWithSelect = createGetByIdHookWithSelect<
  GetAccountApiV1AccountsAccountIdGetQueryResult,
  AccountResponse
>({
  useQuery: useGetAccountApiV1AccountsAccountIdGet,
  defaultOptions: {
    staleTime: 30000,
  },
});

/**
 * With custom ID validation
 *
 * This version validates that the ID is a valid UUID before making the request.
 */
export const useAccountWithValidation = createGetByIdHook<
  GetAccountApiV1AccountsAccountIdGetQueryResult,
  AccountResponse
>({
  useQuery: useGetAccountApiV1AccountsAccountIdGet,
  defaultOptions: {
    isIdValid: (id) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id),
    staleTime: 30000,
  },
});

// ============================================================================
// Example 2: Multi-Profile List Hook (Context-based filtering)
// ============================================================================

/**
 * Base hook for fetching accounts from multiple profiles
 *
 * This version assumes the API uses context/headers for profile filtering
 * (no profile_ids parameter needed).
 */
const useAccountsMultiProfileBase = createMultiProfileListHook<
  ListAccountsApiV1AccountsGetParams,
  ListAccountsApiV1AccountsGetQueryResult,
  AccountResponse
>({
  getQueryKey: getListAccountsApiV1AccountsGetQueryKey,
  queryFn: listAccountsApiV1AccountsGet,
  extractItems: (response) => response.data.accounts,
  extractTotal: (response) => response.data.total,
  // No mapProfileToParams - API uses context for filtering
  baseParams: {}, // Could add filters like { is_active: true }
});

/**
 * Wrapper hook that integrates with ProfileContext
 *
 * @example
 * ```tsx
 * function AccountsList() {
 *   const { accounts, total, isLoading } = useAccountsMultiProfile();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       <h2>Accounts ({total})</h2>
 *       {accounts.map(account => (
 *         <div key={account.id}>
 *           {account.name} - {account.currentBalance}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useAccountsMultiProfile = () => {
  // In real code, get these from ProfileContext:
  // const { activeProfileIds, isLoading: profilesLoading } = useProfileContext();
  const activeProfileIds = ['profile-1', 'profile-2']; // Example
  const profilesLoading = false; // Example

  const result = useAccountsMultiProfileBase(activeProfileIds, {
    enabled: !profilesLoading,
  });

  return {
    accounts: result.items,
    total: result.total,
    isLoading: result.isLoading || profilesLoading,
    error: result.error,
    refetch: result.refetch,
  };
};

// ============================================================================
// Example 3: Multi-Profile List Hook (Parameter-based filtering)
// ============================================================================

/**
 * If the API accepted a profile_ids parameter, you would use this pattern:
 */
type AccountParamsWithProfile = ListAccountsApiV1AccountsGetParams & {
  profile_ids?: string[];
};

const useAccountsWithParamsBase = createMultiProfileListHook<
  AccountParamsWithProfile,
  ListAccountsApiV1AccountsGetQueryResult,
  AccountResponse
>({
  getQueryKey: getListAccountsApiV1AccountsGetQueryKey,
  queryFn: listAccountsApiV1AccountsGet as any, // Cast needed due to extended params
  extractItems: (response) => response.data.accounts,
  extractTotal: (response) => response.data.total,
  mapProfileToParams: (profileId) => ({
    profile_ids: [profileId],
  }),
  baseParams: {
    // Additional filters applied to all queries
  },
});

/**
 * Wrapper for the parameter-based version
 */
export const useAccountsWithParams = () => {
  const activeProfileIds = ['profile-1', 'profile-2'];

  const result = useAccountsWithParamsBase(activeProfileIds);

  return {
    accounts: result.items,
    total: result.total,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
};

// ============================================================================
// Example 4: Filtered List Hook
// ============================================================================

/**
 * Example of a hook with fixed filters
 */
const useActiveAccountsBase = createMultiProfileListHook<
  ListAccountsApiV1AccountsGetParams,
  ListAccountsApiV1AccountsGetQueryResult,
  AccountResponse
>({
  getQueryKey: getListAccountsApiV1AccountsGetQueryKey,
  queryFn: listAccountsApiV1AccountsGet,
  extractItems: (response) => response.data.accounts,
  extractTotal: (response) => response.data.total,
  baseParams: {
    // If the API supported these filters:
    // is_active: true,
    // is_included_in_totals: true,
  },
});

/**
 * Hook that returns only active accounts
 */
export const useActiveAccounts = () => {
  const activeProfileIds = ['profile-1'];

  return useActiveAccountsBase(activeProfileIds);
};

// ============================================================================
// Example 5: Using the Original Orval Hook Directly
// ============================================================================

/**
 * Sometimes you don't need the wrapper and can use Orval hooks directly
 *
 * This is fine for simple cases where you:
 * - Don't need multi-profile support
 * - Don't mind working with the wrapped response type
 * - Want full control over query options
 */
export const useAccountsOriginal = (params: ListAccountsApiV1AccountsGetParams) => {
  return useListAccountsApiV1AccountsGet(params, {
    query: {
      // Use select to unwrap the data
      select: (response) => response.data,
      staleTime: 30000,
    },
  });
};

/**
 * Using the imperative query function directly
 *
 * Useful for one-off fetches or in event handlers
 */
export const fetchAccountById = async (accountId: string): Promise<AccountResponse | null> => {
  try {
    const response = await useGetAccountApiV1AccountsAccountIdGet(accountId);
    if (response.status === 200) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch account:', error);
    return null;
  }
};

// ============================================================================
// Type Exports for Consumers
// ============================================================================

/**
 * Export types for use in components
 */
export type AccountHookResult = ReturnType<typeof useAccount>;
export type AccountsListHookResult = ReturnType<typeof useAccountsMultiProfile>;
