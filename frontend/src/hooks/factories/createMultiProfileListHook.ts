/**
 * Factory for creating type-safe multi-profile list hooks
 *
 * Creates hooks that fetch data from multiple profiles and aggregate results.
 * Supports both parameter-based and context-based profile filtering.
 *
 * @module createMultiProfileListHook
 */

import { useQueries } from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/react-query';
import {
  extractQueriesData,
  sumQueriesTotal,
  isAnyQueryLoading,
  getFirstQueryError,
  refetchAllQueries,
} from '@/lib/orval-utils';

/**
 * Configuration for multi-profile list hooks
 *
 * @template TParams - API parameters type (e.g., ListAccountsApiV1AccountsGetParams)
 * @template TResponse - Orval response type (e.g., { data: AccountList; status: 200 })
 * @template TItem - Individual item type (e.g., AccountResponse)
 */
export interface MultiProfileListConfig<TParams, TResponse, TItem> {
  /**
   * Function to generate query key from parameters
   *
   * @example
   * getListAccountsApiV1AccountsGetQueryKey
   */
  getQueryKey: (params: TParams) => QueryKey;

  /**
   * Orval-generated query function
   *
   * @example
   * listAccountsApiV1AccountsGet
   */
  queryFn: (params: TParams, options?: RequestInit) => Promise<TResponse>;

  /**
   * Extracts items array from the response data
   *
   * @example
   * // For AccountList { accounts: AccountResponse[]; total: number }
   * (response) => response.data.accounts
   *
   * @example
   * // For TransactionList { items: TransactionResponse[]; total: number }
   * (response) => response.data.items
   */
  extractItems: (response: TResponse) => TItem[];

  /**
   * Extracts total count from the response data
   *
   * @example
   * (response) => response.data.total
   */
  extractTotal: (response: TResponse) => number;

  /**
   * Maps profile ID to API parameters (OPTIONAL)
   *
   * If omitted, queries will use baseParams only and profileId
   * will be added to the query key for cache differentiation.
   *
   * Use this when the API endpoint accepts profile filtering via parameters.
   *
   * @example
   * // For APIs that expect profile_ids as an array:
   * (profileId) => ({ profile_ids: [profileId] } as TParams)
   *
   * @example
   * // For APIs that expect profile_id as a string:
   * (profileId) => ({ profile_id: profileId } as TParams)
   */
  mapProfileToParams?: (profileId: string) => TParams;

  /**
   * Base parameters applied to all queries (OPTIONAL)
   *
   * These params are merged with profile-specific params.
   *
   * @example
   * { status: 'active', limit: 100 }
   */
  baseParams?: Partial<TParams>;

  /**
   * Request options passed to all queries
   *
   * @example
   * { headers: { 'X-Custom-Header': 'value' } }
   */
  requestOptions?: RequestInit;
}

/**
 * Options for using the created hook
 */
export interface MultiProfileListHookOptions {
  /**
   * Whether queries are enabled
   * @default true (but disabled if no active profiles)
   */
  enabled?: boolean;

  /**
   * How long data should be considered fresh (ms)
   * @default 0 (always refetch)
   */
  staleTime?: number;

  /**
   * How long unused data should stay in cache (ms)
   * @default 5 minutes
   */
  gcTime?: number;
}

/**
 * Result shape for multi-profile list hooks
 */
export interface MultiProfileListResult<TItem> {
  /** Aggregated items from all profiles */
  items: TItem[];
  /** Total count across all profiles */
  total: number;
  /** True if any query is loading */
  isLoading: boolean;
  /** True if any query has an error */
  isError: boolean;
  /** First error encountered (null if no errors) */
  error: Error | null;
  /** Refetch all queries */
  refetch: () => void;
}

/**
 * Creates a type-safe multi-profile list hook
 *
 * This factory creates hooks that:
 * - Fetch data from multiple profiles using useQueries
 * - Aggregate results (items and totals)
 * - Handle loading and error states
 * - Provide consistent interface
 *
 * @example
 * ```typescript
 * // Example 1: API that uses context/headers for profile filtering
 * // (no profile parameters needed)
 *
 * import {
 *   getListAccountsApiV1AccountsGetQueryKey,
 *   listAccountsApiV1AccountsGet,
 * } from '@/api/generated/accounts/accounts';
 *
 * const useAccountsBase = createMultiProfileListHook({
 *   getQueryKey: getListAccountsApiV1AccountsGetQueryKey,
 *   queryFn: listAccountsApiV1AccountsGet,
 *   extractItems: (response) => response.data.accounts,
 *   extractTotal: (response) => response.data.total,
 *   // No mapProfileToParams - API uses context/headers for filtering
 * });
 *
 * // Wrapper hook with profile context
 * export const useAccounts = () => {
 *   const { activeProfileIds, isLoading: profilesLoading } = useProfiles();
 *
 *   const result = useAccountsBase(activeProfileIds, {
 *     enabled: !profilesLoading,
 *   });
 *
 *   return {
 *     accounts: result.items,
 *     total: result.total,
 *     isLoading: result.isLoading || profilesLoading,
 *     error: result.error,
 *     refetch: result.refetch,
 *   };
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Example 2: API with profile_ids parameter
 *
 * const useTransactionsBase = createMultiProfileListHook({
 *   getQueryKey: getListTransactionsApiV1TransactionsGetQueryKey,
 *   queryFn: listTransactionsApiV1TransactionsGet,
 *   extractItems: (response) => response.data.items,
 *   extractTotal: (response) => response.data.total,
 *   mapProfileToParams: (profileId) => ({
 *     profile_ids: [profileId],
 *   }),
 *   baseParams: {
 *     limit: 100,
 *     status: 'active',
 *   },
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Example 3: Using the hook directly without wrapper
 *
 * function AccountsList() {
 *   const profileIds = ['profile-1', 'profile-2'];
 *
 *   const { items, total, isLoading } = useAccountsBase(profileIds);
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       <h2>Total accounts: {total}</h2>
 *       {items.map(account => (
 *         <div key={account.id}>{account.name}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function createMultiProfileListHook<
  TParams extends object,
  TResponse extends { data: unknown; status: number },
  TItem
>(
  config: MultiProfileListConfig<TParams, TResponse, TItem>
): (
  activeProfileIds: string[],
  options?: MultiProfileListHookOptions
) => MultiProfileListResult<TItem> {
  const {
    getQueryKey,
    queryFn,
    extractItems,
    extractTotal,
    mapProfileToParams,
    baseParams,
    requestOptions,
  } = config;

  // Return the hook
  return (
    activeProfileIds: string[],
    options?: MultiProfileListHookOptions
  ): MultiProfileListResult<TItem> => {
    const enabled = options?.enabled ?? true;
    const staleTime = options?.staleTime;
    const gcTime = options?.gcTime;

    // Create queries for each profile
    const queries = useQueries({
      queries: activeProfileIds.map((profileId) => {
        // Build parameters
        let params: TParams;

        if (mapProfileToParams) {
          // Merge base params with profile-specific params
          const profileParams = mapProfileToParams(profileId);
          params = { ...baseParams, ...profileParams } as TParams;
        } else {
          // Use only base params
          params = (baseParams ?? {}) as TParams;
        }

        // Generate query key and append profileId for cache differentiation
        const baseQueryKey = getQueryKey(params);
        const queryKey = [...baseQueryKey, profileId];

        return {
          queryKey,
          queryFn: () => queryFn(params, requestOptions),
          enabled: enabled && activeProfileIds.length > 0,
          staleTime,
          gcTime,
        };
      }),
    });

    // Aggregate items from all successful queries
    const items = extractQueriesData(queries).flatMap((response) =>
      extractItems(response as TResponse)
    );

    // Aggregate totals from all successful queries
    const total = sumQueriesTotal(queries, (response) =>
      extractTotal(response as TResponse)
    );

    // Compute loading and error states
    const isLoading = isAnyQueryLoading(queries);
    const error = getFirstQueryError(queries);

    // Refetch function
    const refetch = () => refetchAllQueries(queries);

    return {
      items,
      total,
      isLoading,
      isError: error !== null,
      error,
      refetch,
    };
  };
}

/**
 * Creates a simpler list hook for single-profile contexts
 *
 * When you don't need multi-profile support, this creates
 * a hook that fetches from a single source.
 *
 * @example
 * ```typescript
 * const useAccounts = createListHook({
 *   getQueryKey: getListAccountsApiV1AccountsGetQueryKey,
 *   queryFn: listAccountsApiV1AccountsGet,
 *   extractItems: (response) => response.data.accounts,
 *   extractTotal: (response) => response.data.total,
 *   params: {},  // Fixed parameters
 * });
 *
 * // Use in component:
 * const { items, total, isLoading } = useAccounts();
 * ```
 */
export function createListHook<
  TParams extends object,
  TResponse extends { data: unknown; status: number },
  TItem
>(config: {
  getQueryKey: (params: TParams) => QueryKey;
  queryFn: (params: TParams, options?: RequestInit) => Promise<TResponse>;
  extractItems: (response: TResponse) => TItem[];
  extractTotal: (response: TResponse) => number;
  params: TParams;
  requestOptions?: RequestInit;
}) {
  const { getQueryKey, queryFn, extractItems, extractTotal, params, requestOptions } = config;

  // Create a multi-profile hook with a single "profile"
  const multiHook = createMultiProfileListHook({
    getQueryKey,
    queryFn,
    extractItems,
    extractTotal,
    requestOptions,
    baseParams: params,
  });

  // Return a simpler hook that doesn't require profile IDs
  return (options?: MultiProfileListHookOptions) => {
    return multiHook(['default'], {
      ...options,
    });
  };
}
