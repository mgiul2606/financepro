/**
 * React Query hooks for Financial Profile operations
 * Provides optimistic updates and cache management
 */
import { useQueryClient } from '@tanstack/react-query';
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
} from '@/api/generated/financial-profiles/financial-profiles';

import type {
  ProfileCreate,
  ProfileUpdate,
  ProfileResponse,
  MainProfileUpdate,
  ProfileFilters,
} from './profiles.types';

/**
 * Hook to list all financial profiles
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
    profiles: (query.data?.data?.profiles || []) as ProfileResponse[],
    total: query.data?.data?.total || 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to get a single financial profile by ID
 */
export const useProfile = (profileId: string, enabled = true) => {
  const query = useGetProfileApiV1ProfilesProfileIdGet(profileId, {
    query: {
      enabled: enabled && !!profileId,
    },
  });

  return {
    profile: query.data?.data as ProfileResponse | undefined,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to create a new financial profile
 */
export const useCreateProfile = () => {
  const queryClient = useQueryClient();

  const mutation = useCreateProfileApiV1ProfilesPost({
    mutation: {
      onSuccess: () => {
        // Invalidate profiles list to refetch
        queryClient.invalidateQueries({
          queryKey: getListProfilesApiV1ProfilesGetQueryKey(),
        });
      },
    },
  });

  return {
    createProfile: (data: ProfileCreate) => mutation.mutateAsync({ data }),
    isCreating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * Hook to update an existing financial profile
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  const mutation = useUpdateProfileApiV1ProfilesProfileIdPatch({
    mutation: {
      onSuccess: () => {
        // Invalidate profiles list to refetch
        queryClient.invalidateQueries({
          queryKey: getListProfilesApiV1ProfilesGetQueryKey(),
        });
      },
    },
  });

  return {
    updateProfile: (profileId: string, data: ProfileUpdate) =>
      mutation.mutateAsync({ profileId, data }),
    isUpdating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * Hook to delete a financial profile
 */
export const useDeleteProfile = () => {
  const queryClient = useQueryClient();

  const mutation = useDeleteProfileApiV1ProfilesProfileIdDelete({
    mutation: {
      onSuccess: () => {
        // Invalidate profiles list to refetch
        queryClient.invalidateQueries({
          queryKey: getListProfilesApiV1ProfilesGetQueryKey(),
        });
      },
    },
  });

  return {
    deleteProfile: (profileId: string) => mutation.mutateAsync({ profileId }),
    isDeleting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * Hook to get the main financial profile
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
    error: mutation.error,
    reset: mutation.reset,
  };
};
