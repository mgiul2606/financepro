/**
 * Financial Profile Types - Re-export from generated API types
 * This ensures consistency with the backend API
 */

// Re-export types from generated API
export type {
  FinancialProfileResponse as FinancialProfile,
  FinancialProfileCreate,
  FinancialProfileUpdate,
  FinancialProfileListResponse,
} from '@/api/generated/models';

// Re-export const/type values for enum-like usage
export { ProfileType, DatabaseType } from '@/api/generated/models';
export type { ProfileType, DatabaseType } from '@/api/generated/models';

// Define ProfileFilters since the generated params may not exist
export interface ProfileFilters {
  skip?: number;
  limit?: number;
  is_active?: boolean;
}

// Define MainProfileUpdate
export interface MainProfileUpdate {
  profile_id: string;
}
