import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { api } from '../services/api';

/**
 * Custom Axios instance for Orval
 * This mutator uses the configured axios instance with interceptors
 * Handles both URL strings and config objects from orval-generated code
 *
 * Returns response in the format expected by Orval-generated types:
 * { data: ResponseBody, status: number, headers: Headers }
 */
export const customInstance = <T>(
  config: AxiosRequestConfig | string,
  options?: AxiosRequestConfig
): Promise<T> => {
  // If config is a string (URL), convert to proper config object
  let requestConfig: AxiosRequestConfig = typeof config === 'string'
    ? { url: config, ...options }
    : { ...config, ...options };

  // Orval generates fetch-style 'body' but Axios uses 'data'
  // Convert body to data if present
  if ('body' in requestConfig && requestConfig.body !== undefined) {
    requestConfig = {
      ...requestConfig,
      data: requestConfig.body,
    };
    delete (requestConfig as any).body;
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

