// Profile Context for managing active profiles and main profile
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  useProfiles,
  useMainProfile,
  useSetMainProfile,
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
  setActiveProfiles: (profileIds: string[]) => void;
  toggleProfileSelection: (profileId: string) => void;
  refreshProfiles: () => void;

  // Computed
  hasMultipleProfiles: boolean;
  hasActiveProfiles: boolean;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeProfileIds, setActiveProfileIdsState] = useState<string[]>([]);
  const [mainProfileId, setMainProfileId] = useState<string | null>(null);

  // Fetch data
  const { data: profilesData, isLoading: profilesLoading, refetch: refetchProfiles } = useProfiles();
  const { data: mainProfileData, isLoading: mainProfileLoading } = useMainProfile();

  // Mutations
  const setMainProfileMutation = useSetMainProfile();

  const profiles = profilesData?.profiles || [];
  const isLoading = profilesLoading || mainProfileLoading;
  const isError = false; // TODO: Add error handling

  // Update local state when main profile data changes
  useEffect(() => {
    if (mainProfileData?.main_profile_id) {
      setMainProfileId(mainProfileData.main_profile_id);
    }
  }, [mainProfileData]);

  // Initialize: when main profile is loaded and no profiles selected, select the main one
  useEffect(() => {
    if (profiles.length > 0 && activeProfileIds.length === 0 && mainProfileId) {
      // Select main profile by default (local state only)
      setActiveProfileIdsState([mainProfileId]);
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
    (profileIds: string[]) => {
      setActiveProfileIdsState(profileIds);
    },
    []
  );

  const toggleProfileSelection = useCallback(
    (profileId: string) => {
      setActiveProfileIdsState((prev) =>
        prev.includes(profileId)
          ? prev.filter((id) => id !== profileId)
          : [...prev, profileId]
      );
    },
    []
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
