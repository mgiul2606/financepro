/**
 * API wrapper functions for Profile endpoints
 * Provides type-safe, validated API calls using Zod schemas
 */
import {
  listProfilesApiV1ProfilesGet,
  getProfileApiV1ProfilesProfileIdGet,
  createProfileApiV1ProfilesPost,
  updateProfileApiV1ProfilesProfileIdPatch,
  deleteProfileApiV1ProfilesProfileIdDelete,
  getMainProfileApiV1ProfilesMainGet,
  setMainProfileApiV1ProfilesMainPatch,
} from '@/api/generated/financial-profiles/financial-profiles';

import {
  profileCreateSchema,
  profileUpdateSchema,
  profileResponseSchema,
  profileListSchema,
  profileFiltersSchema,
  mainProfileUpdateSchema,
} from './profiles.schemas';

import type {
  ProfileCreate,
  ProfileUpdate,
  ProfileResponse,
  ProfileList,
  ProfileFilters,
  MainProfileUpdate,
} from './profiles.types';

/**
 * Fetch all profiles with optional filters
 */
export const fetchProfiles = async (
  filters?: ProfileFilters
): Promise<ProfileList> => {
  // Validate input
  const validatedFilters = filters
    ? profileFiltersSchema.parse(filters)
    : undefined;

  // Convert camelCase to snake_case for API
  const apiFilters = validatedFilters
    ? {
        skip: validatedFilters.skip,
        limit: validatedFilters.limit,
        is_active: validatedFilters.isActive,
      }
    : undefined;

  // Make API call
  const response = await listProfilesApiV1ProfilesGet(apiFilters);

  // Validate and return response
  return profileListSchema.parse(response.data);
};

/**
 * Fetch a single profile by ID
 */
export const fetchProfile = async (
  profileId: string
): Promise<ProfileResponse> => {
  const response = await getProfileApiV1ProfilesProfileIdGet(profileId);
  return profileResponseSchema.parse(response.data);
};

/**
 * Fetch the main profile
 */
export const fetchMainProfile = async (): Promise<ProfileResponse> => {
  const response = await getMainProfileApiV1ProfilesMainGet();
  return profileResponseSchema.parse(response.data);
};

/**
 * Create a new profile
 */
export const createProfile = async (
  data: ProfileCreate
): Promise<ProfileResponse> => {
  // Validate input
  const validatedData = profileCreateSchema.parse(data);

  // Convert camelCase to snake_case for API
  const apiData = {
    name: validatedData.name,
    description: validatedData.description,
    profile_type: validatedData.profileType,
    database_type: validatedData.databaseType,
    encryption_key: validatedData.encryptionKey,
    is_active: validatedData.isActive,
  };

  // Make API call
  const response = await createProfileApiV1ProfilesPost({ data: apiData });

  // Validate and return response
  return profileResponseSchema.parse(response.data);
};

/**
 * Update an existing profile
 */
export const updateProfile = async (
  profileId: string,
  data: ProfileUpdate
): Promise<ProfileResponse> => {
  // Validate input
  const validatedData = profileUpdateSchema.parse(data);

  // Convert camelCase to snake_case for API
  const apiData = {
    name: validatedData.name,
    description: validatedData.description,
    profile_type: validatedData.profileType,
    is_active: validatedData.isActive,
  };

  // Make API call
  const response = await updateProfileApiV1ProfilesProfileIdPatch({
    profileId,
    data: apiData,
  });

  // Validate and return response
  return profileResponseSchema.parse(response.data);
};

/**
 * Delete a profile
 */
export const deleteProfile = async (profileId: string): Promise<void> => {
  await deleteProfileApiV1ProfilesProfileIdDelete({ profileId });
};

/**
 * Set the main profile
 */
export const setMainProfile = async (
  data: MainProfileUpdate
): Promise<ProfileResponse> => {
  // Validate input
  const validatedData = mainProfileUpdateSchema.parse(data);

  // Convert camelCase to snake_case for API
  const apiData = {
    main_profile_id: validatedData.mainProfileId,
  };

  // Make API call
  const response = await setMainProfileApiV1ProfilesMainPatch({
    data: apiData,
  });

  // Validate and return response
  return profileResponseSchema.parse(response.data);
};
