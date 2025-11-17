// API functions for profiles
import axios from 'axios';
import type {
  FinancialProfile,
  FinancialProfileCreate,
  FinancialProfileUpdate,
  FinancialProfileListResponse,
  ProfileSelection,
  ProfileSelectionUpdate,
  MainProfile,
  MainProfileUpdate,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1';

// Create axios instance with auth token
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const profilesApi = {
  // Profile CRUD
  list: async (): Promise<FinancialProfileListResponse> => {
    const response = await apiClient.get<FinancialProfileListResponse>('/profiles/');
    return response.data;
  },

  create: async (data: FinancialProfileCreate): Promise<FinancialProfile> => {
    const response = await apiClient.post<FinancialProfile>('/profiles/', data);
    return response.data;
  },

  get: async (profileId: string): Promise<FinancialProfile> => {
    const response = await apiClient.get<FinancialProfile>(`/profiles/${profileId}`);
    return response.data;
  },

  update: async (
    profileId: string,
    data: FinancialProfileUpdate
  ): Promise<FinancialProfile> => {
    const response = await apiClient.patch<FinancialProfile>(`/profiles/${profileId}`, data);
    return response.data;
  },

  delete: async (profileId: string): Promise<void> => {
    await apiClient.delete(`/profiles/${profileId}`);
  },

  // Main profile
  getMainProfile: async (): Promise<MainProfile> => {
    const response = await apiClient.get<MainProfile>('/profiles/main');
    return response.data;
  },

  setMainProfile: async (data: MainProfileUpdate): Promise<MainProfile> => {
    const response = await apiClient.patch<MainProfile>('/profiles/main', data);
    return response.data;
  },

  // Profile selection
  getSelection: async (): Promise<ProfileSelection> => {
    const response = await apiClient.get<ProfileSelection>('/profiles/selection');
    return response.data;
  },

  updateSelection: async (data: ProfileSelectionUpdate): Promise<ProfileSelection> => {
    const response = await apiClient.post<ProfileSelection>('/profiles/selection', data);
    return response.data;
  },
};
