// React Query hooks for profiles
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profilesApi } from '../api/profilesApi';
import type {
  FinancialProfileCreate,
  FinancialProfileUpdate,
  ProfileSelectionUpdate,
  MainProfileUpdate,
} from '../types';

export const PROFILES_QUERY_KEY = 'profiles';
export const MAIN_PROFILE_QUERY_KEY = 'mainProfile';
export const PROFILE_SELECTION_QUERY_KEY = 'profileSelection';

// List all profiles
export const useProfiles = () => {
  return useQuery({
    queryKey: [PROFILES_QUERY_KEY],
    queryFn: profilesApi.list,
  });
};

// Get single profile
export const useProfile = (profileId: string, enabled = true) => {
  return useQuery({
    queryKey: [PROFILES_QUERY_KEY, profileId],
    queryFn: () => profilesApi.get(profileId),
    enabled: enabled && !!profileId,
  });
};

// Create profile
export const useCreateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FinancialProfileCreate) => profilesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROFILES_QUERY_KEY] });
    },
  });
};

// Update profile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileId, data }: { profileId: string; data: FinancialProfileUpdate }) =>
      profilesApi.update(profileId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PROFILES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [PROFILES_QUERY_KEY, variables.profileId] });
    },
  });
};

// Delete profile
export const useDeleteProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileId: string) => profilesApi.delete(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROFILES_QUERY_KEY] });
    },
  });
};

// Get main profile
export const useMainProfile = () => {
  return useQuery({
    queryKey: [MAIN_PROFILE_QUERY_KEY],
    queryFn: profilesApi.getMainProfile,
  });
};

// Set main profile
export const useSetMainProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MainProfileUpdate) => profilesApi.setMainProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MAIN_PROFILE_QUERY_KEY] });
    },
  });
};

// Get profile selection
export const useProfileSelection = () => {
  return useQuery({
    queryKey: [PROFILE_SELECTION_QUERY_KEY],
    queryFn: profilesApi.getSelection,
  });
};

// Update profile selection
export const useUpdateProfileSelection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProfileSelectionUpdate) => profilesApi.updateSelection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROFILE_SELECTION_QUERY_KEY] });
    },
  });
};
