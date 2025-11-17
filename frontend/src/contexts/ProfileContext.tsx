// Profile Context for managing active profiles and main profile
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  useProfiles,
  useMainProfile,
  useProfileSelection,
  useSetMainProfile,
  useUpdateProfileSelection,
} from '../features/profiles/hooks/useProfiles';
import type { FinancialProfile } from '../features/profiles/types';

interface ProfileContextValue {
  // Data
  profiles: FinancialProfile[];
  activeProfiles: FinancialProfile[];
  mainProfile: FinancialProfile | null;
  activeProfileIds: string[];
  mainProfileId: string | null;

  // Loading states
  isLoading: boolean;
  isError: boolean;

  // Actions
  setMainProfile: (profileId: string) => Promise<void>;
  setActiveProfiles: (profileIds: string[]) => Promise<void>;
  toggleProfileSelection: (profileId: string) => Promise<void>;
  refreshProfiles: () => void;

  // Computed
  hasMultipleProfiles: boolean;
  hasActiveProfiles: boolean;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeProfileIds, setActiveProfileIds] = useState<string[]>([]);
  const [mainProfileId, setMainProfileId] = useState<string | null>(null);

  // Fetch data
  const { data: profilesData, isLoading: profilesLoading, refetch: refetchProfiles } = useProfiles();
  const { data: mainProfileData, isLoading: mainProfileLoading } = useMainProfile();
  const { data: selectionData, isLoading: selectionLoading } = useProfileSelection();

  // Mutations
  const setMainProfileMutation = useSetMainProfile();
  const updateSelectionMutation = useUpdateProfileSelection();

  const profiles = profilesData?.profiles || [];
  const isLoading = profilesLoading || mainProfileLoading || selectionLoading;
  const isError = false; // TODO: Add error handling

  // Update local state when data changes
  useEffect(() => {
    if (mainProfileData?.main_profile_id) {
      setMainProfileId(mainProfileData.main_profile_id);
    }
  }, [mainProfileData]);

  useEffect(() => {
    if (selectionData?.active_profile_ids) {
      setActiveProfileIds(selectionData.active_profile_ids);
    }
  }, [selectionData]);

  // Initialize: if no profiles selected, select the main one or first one
  useEffect(() => {
    if (profiles.length > 0 && activeProfileIds.length === 0 && mainProfileId) {
      // Select main profile by default
      setActiveProfileIds([mainProfileId]);
      updateSelectionMutation.mutate({ active_profile_ids: [mainProfileId] });
    }
  }, [profiles.length, activeProfileIds.length, mainProfileId]);

  // Get active profile objects
  const activeProfiles = profiles.filter((p) => activeProfileIds.includes(p.id));

  // Get main profile object
  const mainProfile = profiles.find((p) => p.id === mainProfileId) || null;

  // Actions
  const setMainProfile = useCallback(
    async (profileId: string) => {
      setMainProfileId(profileId);
      await setMainProfileMutation.mutateAsync({ main_profile_id: profileId });
    },
    [setMainProfileMutation]
  );

  const setActiveProfiles = useCallback(
    async (profileIds: string[]) => {
      setActiveProfileIds(profileIds);
      await updateSelectionMutation.mutateAsync({ active_profile_ids: profileIds });
    },
    [updateSelectionMutation]
  );

  const toggleProfileSelection = useCallback(
    async (profileId: string) => {
      const newSelection = activeProfileIds.includes(profileId)
        ? activeProfileIds.filter((id) => id !== profileId)
        : [...activeProfileIds, profileId];

      await setActiveProfiles(newSelection);
    },
    [activeProfileIds, setActiveProfiles]
  );

  const refreshProfiles = useCallback(() => {
    refetchProfiles();
  }, [refetchProfiles]);

  const value: ProfileContextValue = {
    profiles,
    activeProfiles,
    mainProfile,
    activeProfileIds,
    mainProfileId,
    isLoading,
    isError,
    setMainProfile,
    setActiveProfiles,
    toggleProfileSelection,
    refreshProfiles,
    hasMultipleProfiles: profiles.length > 1,
    hasActiveProfiles: activeProfileIds.length > 0,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export const useProfileContext = (): ProfileContextValue => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfileContext must be used within ProfileProvider');
  }
  return context;
};
