// src/services/api.ts
import axios from 'axios';

// API base URL - defaults to localhost for development
// Note: import.meta.env is not used here to avoid esbuild warnings during API generation
// Configure via api.defaults.baseURL in your app initialization if needed
const API_BASE_URL = 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Allow runtime configuration of base URL
// Example: In main.tsx, you can set: api.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Interceptor per JWT token (aggiungeremo dopo auth)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor per errori
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;