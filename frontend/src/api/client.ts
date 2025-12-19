import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { api } from '../services/api';

/**
 * Custom Axios instance for Orval
 * This mutator uses the configured axios instance with interceptors
 * Handles both URL strings and RequestInit objects from orval-generated code
 *
 * Returns response in the format expected by Orval-generated types:
 * { data: ResponseBody, status: number, headers: Headers }
 */
export const customInstance = <T>(
  config: string,
  options?: RequestInit
): Promise<T> => {
  // Convert RequestInit to AxiosRequestConfig
  const requestConfig: AxiosRequestConfig = {
    url: config,
    method: options?.method as AxiosRequestConfig['method'],
    signal: options?.signal as any,
  };

  // Convert headers from HeadersInit to plain object
  if (options?.headers) {
    const headers = options.headers;
    if (headers instanceof Headers) {
      const headersObj: Record<string, string> = {};
      headers.forEach((value, key) => {
        headersObj[key] = value;
      });
      requestConfig.headers = headersObj;
    } else if (Array.isArray(headers)) {
      const headersObj: Record<string, string> = {};
      headers.forEach(([key, value]) => {
        headersObj[key] = value;
      });
      requestConfig.headers = headersObj;
    } else {
      requestConfig.headers = headers as Record<string, string>;
    }
  }

  // Convert body to data (Orval generates fetch-style 'body' but Axios uses 'data')
  if ('body' in (options || {}) && options?.body !== undefined) {
    requestConfig.data = options.body;
  }

  // Return response in Orval-expected format: { data, status, headers }
  const promise = api(requestConfig).then((response: AxiosResponse) => ({
    data: response.data,
    status: response.status,
    headers: response.headers as unknown as Headers,
  } as T));

  return promise;
};

export default customInstance;

// Re-export axios for convenience
export { api };

