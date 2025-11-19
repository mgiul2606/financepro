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
  getProfileSelectionApiV1ProfilesSelectionGet,

  // Mutation functions
  createProfileApiV1ProfilesPost,
  updateProfileApiV1ProfilesProfileIdPatch,
  deleteProfileApiV1ProfilesProfileIdDelete,
  setMainProfileApiV1ProfilesMainPatch,
  updateProfileSelectionApiV1ProfilesSelectionPost,

  // Query key functions
  getListProfilesApiV1ProfilesGetQueryKey,
  getGetProfileApiV1ProfilesProfileIdGetQueryKey,
  getGetMainProfileApiV1ProfilesMainGetQueryKey,
  getGetProfileSelectionApiV1ProfilesSelectionGetQueryKey,

  // Query options functions
  getListProfilesApiV1ProfilesGetQueryOptions,
  getGetProfileApiV1ProfilesProfileIdGetQueryOptions,
  getGetMainProfileApiV1ProfilesMainGetQueryOptions,
  getGetProfileSelectionApiV1ProfilesSelectionGetQueryOptions,
} from '@/api/generated/financial-profiles/financial-profiles';
