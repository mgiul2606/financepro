// features/profiles/index.ts
/**
 * Public API for profiles feature
 * Exports components, hooks, types, schemas, and API functions
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

// API functions
export {
  fetchProfiles,
  fetchProfile,
  fetchMainProfile,
  createProfile,
  updateProfile,
  deleteProfile,
  setMainProfile,
} from './profiles.api';

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

// Types
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
