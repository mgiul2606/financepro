/**
 * Financial Profiles API
 * Re-exports the generated API functions for direct use
 */

// Re-export API functions from generated code
export {
  // Query functions
  listProfilesApiV1ProfilesGet,
  getProfileApiV1ProfilesProfileIdGet,
  getMainProfileApiV1ProfilesMainGet,

  // Mutation functions
  createProfileApiV1ProfilesPost,
  updateProfileApiV1ProfilesProfileIdPatch,
  deleteProfileApiV1ProfilesProfileIdDelete,
  setMainProfileApiV1ProfilesMainPatch,

  // Query key functions
  getListProfilesApiV1ProfilesGetQueryKey,
  getGetProfileApiV1ProfilesProfileIdGetQueryKey,
  getGetMainProfileApiV1ProfilesMainGetQueryKey,

  // Query options functions
  getListProfilesApiV1ProfilesGetQueryOptions,
  getGetProfileApiV1ProfilesProfileIdGetQueryOptions,
  getGetMainProfileApiV1ProfilesMainGetQueryOptions,
} from '@/api/generated/financial-profiles/financial-profiles';
