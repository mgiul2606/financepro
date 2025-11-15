import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { api } from '../services/api';

/**
 * Custom Axios instance for Orval
 * This mutator uses the configured axios instance with interceptors
 */
export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const promise = api({
    ...config,
    ...options,
  }).then(({ data }: AxiosResponse<T>) => data);

  return promise;
};

export default customInstance;

// Re-export axios for convenience
export { api };
