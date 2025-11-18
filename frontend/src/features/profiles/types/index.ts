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
  ProfileType,
  DatabaseType,
  ProfileSelectionResponse as ProfileSelection,
  ProfileSelectionUpdate,
  MainProfileResponse as MainProfile,
  MainProfileUpdate,
  ListProfilesApiV1ProfilesGetParams as ProfileFilters,
} from '@/api/generated/models';
