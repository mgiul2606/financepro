// frontend/src/config/api.config.ts

/**
 * API Configuration
 * Centralized API settings matching backend configuration
 */

interface APIConfig {
  name: string;
  version: string;
  apiVersion: string;
  baseURL: string;
  timeout: number;
  endpoints: {
    openapi: string;
    docs: string;
    health: string;
  };
}

const environment = import.meta.env.MODE || 'development';

const configs: Record<string, APIConfig> = {
  development: {
    name: 'FinancePro',
    version: '1.0.0',
    apiVersion: 'v1',
    baseURL: 'http://localhost:8000',
    timeout: 30000,
    endpoints: {
      openapi: '/api/v1/openapi.json',
      docs: '/docs',
      health: '/health',
    },
  },
  production: {
    name: 'FinancePro',
    version: '1.0.0',
    apiVersion: 'v1',
    baseURL: 'https://api.financepro.app',
    timeout: 10000,
    endpoints: {
      openapi: '/api/v1/openapi.json',
      docs: '/docs',
      health: '/health',
    },
  },
};

export const apiConfig = configs[environment];

// Helper functions
export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiConfig.baseURL}/api/${apiConfig.apiVersion}${cleanPath}`;
};

export const getOpenApiUrl = (): string => {
  return `${apiConfig.baseURL}${apiConfig.endpoints.openapi}`;
};