/**
 * React Query hooks for Financial Profile operations
 *
 * Uses hook factories for consistent, DRY mutation hooks.
 * Provides optimistic updates and cache management.
 */
import {
  useListProfilesApiV1ProfilesGet,
  useGetProfileApiV1ProfilesProfileIdGet,
  useCreateProfileApiV1ProfilesPost,
  useUpdateProfileApiV1ProfilesProfileIdPatch,
  useDeleteProfileApiV1ProfilesProfileIdDelete,
  useGetMainProfileApiV1ProfilesMainGet,
  useSetMainProfileApiV1ProfilesMainPatch,
  getListProfilesApiV1ProfilesGetQueryKey,
  getGetMainProfileApiV1ProfilesMainGetQueryKey,
  type CreateProfileApiV1ProfilesPostMutationResult,
  type UpdateProfileApiV1ProfilesProfileIdPatchMutationResult,
  type DeleteProfileApiV1ProfilesProfileIdDeleteMutationResult,
} from '@/api/generated/financial-profiles/financial-profiles';
import type {
  FinancialProfileCreate,
  FinancialProfileUpdate,
  FinancialProfileResponse,
} from '@/api/generated/models';
import { useQueryClient } from '@tanstack/react-query';
import { createGetByIdHook } from '@/hooks/factories/createGetByIdHook';
import { createCreateMutationHook } from '@/hooks/factories/createCreateMutationHook';
import { createUpdateMutationHook } from '@/hooks/factories/createUpdateMutationHook';
import { createDeleteMutationHook } from '@/hooks/factories/createDeleteMutationHook';
import type { ExtractOrvalData } from '@/lib/orval-types';

import type {
  ProfileCreate,
  ProfileUpdate,
  ProfileResponse,
  ProfileFilters,
  ProfileList,
  MainProfileUpdate,
} from './profiles.types';

/**
 * Hook to list all financial profiles
 *
 * Note: Profiles are the parent entity - they don't require multi-profile
 * aggregation like accounts/transactions. Manual implementation is appropriate.
 */
export const useProfiles = (filters?: ProfileFilters) => {
  // Convert camelCase to snake_case for API
  const apiFilters = filters
    ? {
        skip: filters.skip,
        limit: filters.limit,
        is_active: filters.isActive,
      }
    : undefined;

  const query = useListProfilesApiV1ProfilesGet(apiFilters);

  return {
    profiles: ((query.data?.data as ProfileList)?.profiles ?? []) as ProfileResponse[],
    total: (query.data?.data as ProfileList)?.total ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Base hook for getting a single profile by ID
 * Created using the GET by ID hook factory
 */
const useProfileBase = createGetByIdHook<
  { data: FinancialProfileResponse; status: number },
  FinancialProfileResponse
>({
  useQuery: useGetProfileApiV1ProfilesProfileIdGet,
});

/**
 * Hook to get a single financial profile by ID
 */
export const useProfile = (profileId: string, enabled = true) => {
  const result = useProfileBase(profileId, { enabled });

  return {
    profile: result.data as ProfileResponse | undefined,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
};

/**
 * Base hook for creating profiles
 * Created using the CREATE mutation hook factory
 */
const useCreateProfileBase = createCreateMutationHook<
  CreateProfileApiV1ProfilesPostMutationResult,
  FinancialProfileCreate
>({
  useMutation: useCreateProfileApiV1ProfilesPost,
  defaultOptions: {
    invalidateKeys: getListProfilesApiV1ProfilesGetQueryKey(),
  },
});

/**
 * Hook to create a new financial profile
 */
export const useCreateProfile = () => {
  const { mutateAsync, isPending, error, reset } = useCreateProfileBase();

  return {
    createProfile: (data: ProfileCreate) => mutateAsync(data),
    isCreating: isPending,
    isPending,
    error,
    reset,
  };
};

/**
 * Base hook for updating profiles
 * Created using the UPDATE mutation hook factory
 */
const useUpdateProfileBase = createUpdateMutationHook<
  UpdateProfileApiV1ProfilesProfileIdPatchMutationResult,
  FinancialProfileUpdate,
  ExtractOrvalData<UpdateProfileApiV1ProfilesProfileIdPatchMutationResult>,
  'profileId'
>({
  useMutation: useUpdateProfileApiV1ProfilesProfileIdPatch,
  idParamName: 'profileId',
  defaultOptions: {
    invalidateKeys: getListProfilesApiV1ProfilesGetQueryKey(),
  },
});

/**
 * Hook to update an existing financial profile
 */
export const useUpdateProfile = () => {
  const { mutateAsync, isPending, error, reset } = useUpdateProfileBase();

  return {
    updateProfile: (profileId: string, data: ProfileUpdate) =>
      mutateAsync(profileId, data),
    isUpdating: isPending,
    isPending,
    error,
    reset,
  };
};

/**
 * Base hook for deleting profiles
 * Created using the DELETE mutation hook factory
 */
const useDeleteProfileBase = createDeleteMutationHook<
  DeleteProfileApiV1ProfilesProfileIdDeleteMutationResult,
  'profileId'
>({
  useMutation: useDeleteProfileApiV1ProfilesProfileIdDelete,
  idParamName: 'profileId',
  defaultOptions: {
    invalidateKeys: getListProfilesApiV1ProfilesGetQueryKey(),
  },
});

/**
 * Hook to delete a financial profile
 */
export const useDeleteProfile = () => {
  const { mutateAsync, isPending, error, reset } = useDeleteProfileBase();

  return {
    deleteProfile: (profileId: string) => mutateAsync(profileId),
    isDeleting: isPending,
    isPending,
    error,
    reset,
  };
};

/**
 * Hook to get the main financial profile
 *
 * Note: Kept as manual implementation - no factory exists for this
 * specific use case (single main profile query).
 */
export const useMainProfile = () => {
  const query = useGetMainProfileApiV1ProfilesMainGet();

  return {
    mainProfile: query.data?.data as ProfileResponse | undefined,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to set the main financial profile
 *
 * Note: Kept as manual implementation - requires invalidating both
 * main profile and profiles list queries (custom invalidation logic).
 */
export const useSetMainProfile = () => {
  const queryClient = useQueryClient();

  const mutation = useSetMainProfileApiV1ProfilesMainPatch({
    mutation: {
      onSuccess: () => {
        // Invalidate both main profile and profiles list
        queryClient.invalidateQueries({
          queryKey: getGetMainProfileApiV1ProfilesMainGetQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: getListProfilesApiV1ProfilesGetQueryKey(),
        });
      },
    },
  });

  return {
    setMainProfile: (data: MainProfileUpdate) => mutation.mutateAsync({ data }),
    isUpdating: mutation.isPending,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
