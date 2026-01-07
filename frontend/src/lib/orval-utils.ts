/**
 * Runtime utilities for working with Orval-generated API responses
 *
 * These utilities provide safe data extraction from Orval's wrapped
 * response types with proper type narrowing and runtime checks.
 *
 * @module orval-utils
 */

import type { UseQueryResult } from '@tanstack/react-query';
import type { ExtractOrvalData } from './orval-types';

/**
 * Type guard to check if a query result is successful
 *
 * Narrows the type to guarantee that data exists and has a success status.
 *
 * @example
 * ```typescript
 * const query = useGetAccountApiV1AccountsAccountIdGet(id);
 *
 * if (isQuerySuccess(query)) {
 *   // TypeScript knows query.data exists and has status 200
 *   const account = query.data.data;
 * }
 * ```
 */
export function isQuerySuccess<
  TResponse extends { data: unknown; status: number }
>(
  query: UseQueryResult<TResponse, unknown>
): query is UseQueryResult<TResponse, unknown> & {
  isSuccess: true;
  data: TResponse & { status: 200 | 201 };
} {
  return (
    query.isSuccess &&
    'data' in query.data &&
    (query.data.status === 200 || query.data.status === 201)
  );
}

/**
 * Type guard to check if a query result is an error
 *
 * @example
 * ```typescript
 * if (isQueryError(query)) {
 *   console.error('Query failed:', query.error);
 * }
 * ```
 */
export function isQueryError<TResponse, TError = Error>(
  query: UseQueryResult<TResponse, TError>
): query is UseQueryResult<TResponse, TError> & {
  isError: true;
  error: TError;
} {
  return query.isError && query.error !== null;
}

/**
 * Extracts data from an Orval query result in a type-safe way
 *
 * Returns the unwrapped data on success, or undefined otherwise.
 * Prefer using TanStack Query's `select` option when possible.
 *
 * @example
 * ```typescript
 * const query = useGetAccountApiV1AccountsAccountIdGet(id);
 * const account = extractQueryData(query);
 * //    ^? AccountResponse | undefined
 * ```
 *
 * @example
 * ```typescript
 * // Preferred approach using select:
 * const query = useGetAccountApiV1AccountsAccountIdGet(id, {
 *   query: {
 *     select: (response) => response.data,
 *   },
 * });
 * // query.data is already AccountResponse!
 * ```
 */
export function extractQueryData<
  TResponse extends { data: unknown; status: number }
>(
  query: UseQueryResult<TResponse, unknown>
): ExtractOrvalData<TResponse> | undefined {
  if (isQuerySuccess(query)) {
    return query.data.data as ExtractOrvalData<TResponse>;
  }
  return undefined;
}

/**
 * Extracts data from a query result with a fallback value
 *
 * @example
 * ```typescript
 * const query = useListAccountsApiV1AccountsGet();
 * const accounts = extractQueryDataOr(query, { accounts: [], total: 0 });
 * //    ^? AccountList (never undefined)
 * ```
 */
export function extractQueryDataOr<
  TResponse extends { data: unknown; status: number }
>(
  query: UseQueryResult<TResponse, unknown>,
  fallback: ExtractOrvalData<TResponse>
): ExtractOrvalData<TResponse> {
  return extractQueryData(query) ?? fallback;
}

/**
 * Checks if a response object (not a query) is successful
 *
 * Useful for checking responses from imperative fetches.
 *
 * @example
 * ```typescript
 * const response = await listAccountsApiV1AccountsGet({});
 *
 * if (isResponseSuccess(response)) {
 *   const accounts = response.data;  // Type-safe access
 * }
 * ```
 */
export function isResponseSuccess<
  TResponse extends { data: unknown; status: number }
>(
  response: TResponse
): response is TResponse & { status: 200 | 201; data: NonNullable<unknown> } {
  return (
    (response.status === 200 || response.status === 201) && 'data' in response
  );
}

/**
 * Extracts data from multiple query results
 *
 * Automatically filters out failed queries and extracts data from successful ones.
 *
 * @example
 * ```typescript
 * const accountQueries = ids.map(id => useGetAccountApiV1AccountsAccountIdGet(id));
 * const accounts = extractQueriesData(accountQueries);
 * //    ^? AccountResponse[]
 * ```
 */
export function extractQueriesData<
  TResponse extends { data: unknown; status: number }
>(
  queries: UseQueryResult<TResponse, unknown>[]
): ExtractOrvalData<TResponse>[] {
  return queries
    .filter(isQuerySuccess)
    .map((query) => query.data.data as ExtractOrvalData<TResponse>);
}

/**
 * Maps and flattens array data from multiple query results
 *
 * Useful for aggregating list responses from multiple queries.
 *
 * @example
 * ```typescript
 * const listQueries = profileIds.map(id =>
 *   useListAccountsApiV1AccountsGet({ profile_id: id })
 * );
 *
 * const allAccounts = flatMapQueries(
 *   listQueries,
 *   (data) => data.accounts
 * );
 * ```
 */
export function flatMapQueries<
  TResponse extends { data: unknown; status: number },
  TItem
>(
  queries: UseQueryResult<TResponse, unknown>[],
  accessor: (data: ExtractOrvalData<TResponse>) => TItem[]
): TItem[] {
  return queries.flatMap((query) => {
    const data = extractQueryData(query);
    return data ? accessor(data) : [];
  });
}

/**
 * Reduces multiple query results to a single value
 *
 * Automatically skips failed queries.
 *
 * @example
 * ```typescript
 * const totalBalance = reduceQueries(
 *   accountQueries,
 *   (sum, account) => sum + parseFloat(account.currentBalance),
 *   0
 * );
 * ```
 */
export function reduceQueries<
  TResponse extends { data: unknown; status: number },
  TResult
>(
  queries: UseQueryResult<TResponse, unknown>[],
  reducer: (accumulator: TResult, data: ExtractOrvalData<TResponse>) => TResult,
  initialValue: TResult
): TResult {
  return queries.reduce((acc, query) => {
    const data = extractQueryData(query);
    return data ? reducer(acc, data) : acc;
  }, initialValue);
}

/**
 * Aggregates totals from multiple list query results
 *
 * @example
 * ```typescript
 * const total = sumQueriesTotal(
 *   listQueries,
 *   (data) => data.total
 * );
 * ```
 */
export function sumQueriesTotal<
  TResponse extends { data: unknown; status: number }
>(
  queries: UseQueryResult<TResponse, unknown>[],
  accessor: (data: ExtractOrvalData<TResponse>) => number
): number {
  return reduceQueries(queries, (sum, data) => sum + accessor(data), 0);
}

/**
 * Checks if any query in an array is loading
 */
export function isAnyQueryLoading<TResponse, TError>(
  queries: UseQueryResult<TResponse, TError>[]
): boolean {
  return queries.some((query) => query.isLoading);
}

/**
 * Checks if all queries in an array are successful
 */
export function areAllQueriesSuccess<
  TResponse extends { data: unknown; status: number }
>(queries: UseQueryResult<TResponse, unknown>[]): boolean {
  return queries.length > 0 && queries.every(isQuerySuccess);
}

/**
 * Gets the first error from an array of queries
 */
export function getFirstQueryError<TResponse, TError = Error>(
  queries: UseQueryResult<TResponse, TError>[]
): TError | null {
  const errorQuery = queries.find((query) => query.isError);
  return errorQuery?.error ?? null;
}

/**
 * Refetches all queries in an array
 */
export function refetchAllQueries<TResponse, TError>(
  queries: UseQueryResult<TResponse, TError>[]
): void {
  queries.forEach((query) => query.refetch());
}
