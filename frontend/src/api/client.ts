import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { api } from '../services/api';

/**
 * Custom Axios instance for Orval
 * This mutator uses the configured axios instance with interceptors
 * Handles both URL strings and config objects from orval-generated code
 */
export const customInstance = <T>(
  config: AxiosRequestConfig | string,
  options?: AxiosRequestConfig
): Promise<T> => {
  // If config is a string (URL), convert to proper config object
  const requestConfig: AxiosRequestConfig = typeof config === 'string'
    ? { url: config, ...options }
    : { ...config, ...options };

  const promise = api(requestConfig).then(({ data }: AxiosResponse<T>) => data);

  return promise;
};

export default customInstance;

// Re-export axios for convenience
export { api };

