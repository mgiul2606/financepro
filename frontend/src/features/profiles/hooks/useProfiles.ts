/**
 * React Query hooks for Financial Profile operations
 * Wraps the generated orval hooks for better usability
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
  useGetProfileSelectionApiV1ProfilesSelectionGet,
  useUpdateProfileSelectionApiV1ProfilesSelectionPost,
  getListProfilesApiV1ProfilesGetQueryKey,
  getGetMainProfileApiV1ProfilesMainGetQueryKey,
  getGetProfileSelectionApiV1ProfilesSelectionGetQueryKey,
} from '@/api/generated/financial-profiles/financial-profiles';
import type {
  FinancialProfileCreate,
  FinancialProfileUpdate,
  ProfileSelectionUpdate,
  MainProfileUpdate,
  ProfileFilters,
} from '../types';

/**
 * Hook to list all financial profiles
 */
export const useProfiles = (filters?: ProfileFilters) => {
  const query = useListProfilesApiV1ProfilesGet(filters);

  return {
    profiles: query.data?.data?.profiles || [],
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
    profile: query.data?.data,
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
    createProfile: (data: FinancialProfileCreate) => mutation.mutateAsync({ data }),
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
    updateProfile: (profileId: string, data: FinancialProfileUpdate) =>
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
    mainProfile: query.data?.data,
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
        // Invalidate main profile to refetch
        queryClient.invalidateQueries({
          queryKey: getGetMainProfileApiV1ProfilesMainGetQueryKey(),
        });
      },
    },
  });

  return {
    setMainProfile: (data: MainProfileUpdate) => mutation.mutateAsync({ data }),
    isSetting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * Hook to get the profile selection
 */
export const useProfileSelection = () => {
  const query = useGetProfileSelectionApiV1ProfilesSelectionGet();

  return {
    selection: query.data?.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to update the profile selection
 */
export const useUpdateProfileSelection = () => {
  const queryClient = useQueryClient();

  const mutation = useUpdateProfileSelectionApiV1ProfilesSelectionPost({
    mutation: {
      onSuccess: () => {
        // Invalidate profile selection to refetch
        queryClient.invalidateQueries({
          queryKey: getGetProfileSelectionApiV1ProfilesSelectionGetQueryKey(),
        });
      },
    },
  });

  return {
    updateSelection: (data: ProfileSelectionUpdate) => mutation.mutateAsync({ data }),
    isUpdating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
