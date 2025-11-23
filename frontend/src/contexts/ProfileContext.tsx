// Profile Context for managing active profiles and main profile
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  useProfiles,
  useMainProfile,
  useSetMainProfile,
  useCreateProfile,
} from '../features/profiles/hooks/useProfiles';
import type { FinancialProfile, FinancialProfileCreate } from '../features/profiles/types';

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
  isInitialized: boolean;

  // Profile creation modal state
  requiresProfileCreation: boolean;
  showCreateProfileModal: boolean;
  setShowCreateProfileModal: (show: boolean) => void;
  createFirstProfile: (data: FinancialProfileCreate) => Promise<void>;
  isCreatingProfile: boolean;

  // Actions
  setMainProfile: (profileId: string) => Promise<void>;
  setActiveProfiles: (profileIds: string[]) => void;
  toggleProfileSelection: (profileId: string) => void;
  refreshProfiles: () => void;

  // Computed
  hasMultipleProfiles: boolean;
  hasActiveProfiles: boolean;
  hasProfiles: boolean;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeProfileIds, setActiveProfileIdsState] = useState<string[]>([]);
  const [mainProfileId, setMainProfileId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showCreateProfileModal, setShowCreateProfileModal] = useState(false);

  // Fetch data
  const { profiles: profilesList, isLoading: profilesLoading, refetch: refetchProfiles } = useProfiles();
  const { mainProfile: mainProfileData, isLoading: mainProfileLoading, refetch: refetchMainProfile } = useMainProfile();

  // Mutations
  const setMainProfileMutation = useSetMainProfile();
  const createProfileMutation = useCreateProfile();

  // Filter only active profiles
  const profiles = profilesList.filter((p) => p.is_active);
  const isLoading = profilesLoading || mainProfileLoading;
  const isError = false; // TODO: Add error handling

  // Check if user needs to create a profile (only after data is loaded)
  const requiresProfileCreation = !isLoading && isInitialized && profiles.length === 0;

  // Update local state when main profile data changes
  useEffect(() => {
    if (mainProfileData?.main_profile_id) {
      setMainProfileId(mainProfileData.main_profile_id);
    }
  }, [mainProfileData]);

  // Initialize: when profiles are loaded, set up initial state
  // Use profilesList to check if data actually arrived (not just loading finished)
  useEffect(() => {
    // Wait for both queries to finish loading
    if (isLoading || isInitialized) {
      return;
    }

    // Data has loaded, now initialize
    if (profilesList.length === 0) {
      // No profiles - show creation modal
      setShowCreateProfileModal(true);
      setIsInitialized(true);
    } else {
      // Has profiles - check for active ones
      const activeProfiles = profilesList.filter((p) => p.is_active);

      if (activeProfiles.length === 0) {
        // All profiles are inactive - show creation modal
        setShowCreateProfileModal(true);
        setIsInitialized(true);
      } else if (mainProfileData?.main_profile_id) {
        // Has profiles and main profile - select it
        setActiveProfileIdsState([mainProfileData.main_profile_id]);
        setMainProfileId(mainProfileData.main_profile_id);
        setIsInitialized(true);
      } else {
        // Has profiles but no main - select first active one and set it as main in backend
        const firstProfile = activeProfiles[0];
        setActiveProfileIdsState([firstProfile.id]);
        setMainProfileId(firstProfile.id);
        setIsInitialized(true);

        // Set as main profile in backend (fire and forget, we've already set local state)
        setMainProfileMutation.setMainProfile({ main_profile_id: firstProfile.id })
          .then(() => refetchMainProfile())
          .catch((error) => {
            console.error('Failed to set initial main profile:', error);
          });
      }
    }
  }, [isLoading, isInitialized, profilesList, mainProfileData, setMainProfileMutation, refetchMainProfile]);

  // Auto-show modal when profiles become empty (e.g., after deletion)
  useEffect(() => {
    if (isInitialized && profiles.length === 0 && !isLoading) {
      setShowCreateProfileModal(true);
    }
  }, [isInitialized, profiles.length, isLoading]);

  // Get active profile objects
  const activeProfiles = profiles.filter((p) => activeProfileIds.includes(p.id));

  // Get main profile object
  const mainProfile = profiles.find((p) => p.id === mainProfileId) || null;

  // Create first profile (for mandatory creation)
  const createFirstProfile = useCallback(
    async (data: FinancialProfileCreate) => {
      const newProfile = await createProfileMutation.createProfile(data);
      if (newProfile) {
        // Set as main profile
        await setMainProfileMutation.mutateAsync({ main_profile_id: newProfile.id });
        // Refresh data
        await refetchProfiles();
        await refetchMainProfile();
        // Select it
        setMainProfileId(newProfile.id);
        setActiveProfileIdsState([newProfile.id]);
        setShowCreateProfileModal(false);
      }
    },
    [createProfileMutation, setMainProfileMutation, refetchProfiles, refetchMainProfile]
  );

  // Actions
  const setMainProfile = useCallback(
    async (profileId: string) => {
      setMainProfileId(profileId);
      await setMainProfileMutation.mutateAsync({ main_profile_id: profileId });
      await refetchMainProfile();
    },
    [setMainProfileMutation, refetchMainProfile]
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

  const refreshProfiles = useCallback(async () => {
    await refetchProfiles();
    await refetchMainProfile();
  }, [refetchProfiles, refetchMainProfile]);

  const value: ProfileContextValue = {
    profiles,
    activeProfiles,
    mainProfile,
    activeProfileIds,
    mainProfileId,
    isLoading,
    isError,
    isInitialized,
    requiresProfileCreation,
    showCreateProfileModal,
    setShowCreateProfileModal,
    createFirstProfile,
    isCreatingProfile: createProfileMutation.isCreating,
    setMainProfile,
    setActiveProfiles,
    toggleProfileSelection,
    refreshProfiles,
    hasMultipleProfiles: profiles.length > 1,
    hasActiveProfiles: activeProfileIds.length > 0,
    hasProfiles: profiles.length > 0,
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
