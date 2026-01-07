/**
 * Type utilities for working with Orval-generated API types
 *
 * These utilities provide type-level transformations for extracting
 * data from Orval's wrapped response types without runtime overhead.
 *
 * @module orval-types
 */

/**
 * Extracts the data type from an Orval response type
 *
 * Works with any success status code (200, 201, 204, etc.)
 * Handles union types by extracting all successful response data types
 *
 * @example
 * ```typescript
 * type Response =
 *   | { data: AccountList; status: 200 }
 *   | { data: void; status: 400 }
 *   | { data: HTTPValidationError; status: 422 };
 *
 * type Data = ExtractOrvalData<Response>;
 * //   ^? AccountList
 * ```
 *
 * @example
 * ```typescript
 * type PostResponse =
 *   | { data: AccountResponse; status: 201 }
 *   | { data: HTTPValidationError; status: 422 };
 *
 * type Data = ExtractOrvalData<PostResponse>;
 * //   ^? AccountResponse
 * ```
 */
export type ExtractOrvalData<TResponse> = TResponse extends {
  data: infer TData;
  status: infer TStatus;
}
  ? TStatus extends 200 | 201 | 204
    ? TData
    : never
  : never;

/**
 * Extracts all possible error data types from an Orval response
 *
 * @example
 * ```typescript
 * type Response =
 *   | { data: Account; status: 200 }
 *   | { data: void; status: 400 }
 *   | { data: void; status: 403 }
 *   | { data: HTTPValidationError; status: 422 };
 *
 * type Errors = ExtractOrvalError<Response>;
 * //   ^? void | HTTPValidationError
 * ```
 */
export type ExtractOrvalError<TResponse> = TResponse extends {
  data: infer TData;
  status: infer TStatus;
}
  ? TStatus extends 400 | 401 | 403 | 404 | 422 | 500
    ? TData
    : never
  : never;

/**
 * Checks if a response type includes a successful status code
 *
 * @example
 * ```typescript
 * type Response200 = { data: Account; status: 200 };
 * type Response400 = { data: void; status: 400 };
 *
 * type IsSuccess1 = IsSuccessResponse<Response200>;  // true
 * type IsSuccess2 = IsSuccessResponse<Response400>;  // false
 * ```
 */
export type IsSuccessResponse<TResponse> = TResponse extends {
  status: 200 | 201 | 204;
}
  ? true
  : false;

/**
 * Type-safe wrapper for query results
 *
 * Provides a consistent interface for working with query data
 * without needing to check response status codes manually.
 */
export type SafeQueryResult<TData> = {
  /** Extracted data (undefined if loading or error) */
  data: TData | undefined;
  /** True while the query is in-flight */
  isLoading: boolean;
  /** True if the query encountered an error */
  isError: boolean;
  /** Error object if isError is true */
  error: Error | null;
  /** Function to manually refetch the data */
  refetch: () => void;
};

/**
 * Type-safe wrapper for mutation results
 */
export type SafeMutationResult<TData, TVariables> = {
  /** Mutation function */
  mutate: (variables: TVariables) => void;
  /** Async mutation function */
  mutateAsync: (variables: TVariables) => Promise<TData>;
  /** Mutation result data */
  data: TData | undefined;
  /** True while mutation is executing */
  isLoading: boolean;
  /** True if mutation encountered an error */
  isError: boolean;
  /** True if mutation succeeded */
  isSuccess: boolean;
  /** Error object if isError is true */
  error: Error | null;
  /** Reset mutation state */
  reset: () => void;
};

/**
 * Unwraps Orval's query result type to get the inner response type
 *
 * Orval generates types like:
 * - `Awaited<ReturnType<typeof xxxGet>>`
 * - `NonNullable<Awaited<ReturnType<typeof xxxGet>>>`
 *
 * This utility extracts the actual response type from these wrappers.
 *
 * @example
 * ```typescript
 * type QueryResult = Awaited<ReturnType<typeof listAccountsApiV1AccountsGet>>;
 * type Response = UnwrapQueryResult<QueryResult>;
 * //   ^? listAccountsApiV1AccountsGetResponse
 * ```
 */
export type UnwrapQueryResult<T> = T extends Promise<infer U>
  ? U
  : T extends NonNullable<infer V>
    ? V
    : T;

/**
 * Extracts the success response type from a union of responses
 *
 * Filters out error responses (400, 403, 404, 422, etc.)
 * and returns only successful response types.
 *
 * @example
 * ```typescript
 * type Responses =
 *   | { data: Account; status: 200; headers: Headers }
 *   | { data: void; status: 400; headers: Headers }
 *   | { data: HTTPValidationError; status: 422; headers: Headers };
 *
 * type Success = ExtractSuccessResponse<Responses>;
 * //   ^? { data: Account; status: 200; headers: Headers }
 * ```
 */
export type ExtractSuccessResponse<TResponse> = TResponse extends {
  status: 200 | 201 | 204;
}
  ? TResponse
  : never;

/**
 * Extracts the error response types from a union of responses
 *
 * Filters out successful responses and returns only error response types.
 *
 * @example
 * ```typescript
 * type Responses =
 *   | { data: Account; status: 200; headers: Headers }
 *   | { data: void; status: 400; headers: Headers }
 *   | { data: HTTPValidationError; status: 422; headers: Headers };
 *
 * type Errors = ExtractErrorResponse<Responses>;
 * //   ^? { data: void; status: 400; headers: Headers }
 * //    | { data: HTTPValidationError; status: 422; headers: Headers }
 * ```
 */
export type ExtractErrorResponse<TResponse> = TResponse extends {
  status: 200 | 201 | 204;
}
  ? never
  : TResponse;
