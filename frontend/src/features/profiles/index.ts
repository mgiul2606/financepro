/**
 * Public API for profiles feature
 * Exports components, hooks, types, schemas, and API functions
 *
 * Pattern follows accounts feature architecture with hook factories
 * for consistent, DRY, type-safe operations.
 */

// Pages
export { ProfilesPage } from './pages/ProfilesPage';

// Components
export { ProfileCard } from './components/ProfileCard';
export { ProfileSelector } from './components/ProfileSelector';
export { CreateProfileModal } from './components/CreateProfileModal';
export { MandatoryProfileModal } from './components/MandatoryProfileModal';

// Hooks
export {
  useProfiles,
  useProfile,
  useCreateProfile,
  useUpdateProfile,
  useDeleteProfile,
  useMainProfile,
  useSetMainProfile,
} from './profiles.hooks';

// API functions - Now using Orval-generated hooks directly
// To use API functions directly, import from '@/api/generated/financial-profiles/financial-profiles'

// Schemas
export {
  profileCreateSchema,
  profileUpdateSchema,
  profileResponseSchema,
  profileListSchema,
  profileFiltersSchema,
  mainProfileUpdateSchema,
  profileTypeSchema,
  databaseTypeSchema,
} from './profiles.schemas';

// Types - Using Orval-generated types for API compatibility
export type {
  FinancialProfileCreate,
  FinancialProfileUpdate,
  FinancialProfileResponse,
  FinancialProfileListResponse,
  MainProfileUpdate as OrvalMainProfileUpdate,
} from '@/api/generated/models';

// Types - Local aliases derived from Zod schemas for UI and validation
export type {
  ProfileCreate,
  ProfileUpdate,
  ProfileResponse,
  FinancialProfile,
  ProfileList,
  ProfileFilters,
  MainProfileUpdate,
  ProfileType,
  DatabaseType,
} from './profiles.types';

// Constants
export { PROFILE_TYPE_OPTIONS, DATABASE_TYPE_OPTIONS } from './profiles.types';
