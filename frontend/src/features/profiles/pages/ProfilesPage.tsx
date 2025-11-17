// Profiles management page
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { ProfileCard } from '../components/ProfileCard';
import { CreateProfileModal } from '../components/CreateProfileModal';
import { useProfileContext } from '../../../contexts/ProfileContext';
import {
  useCreateProfile,
  useUpdateProfile,
  useDeleteProfile,
} from '../hooks/useProfiles';
import type { FinancialProfile, FinancialProfileCreate } from '../types';
import { useTranslation } from 'react-i18next';

export const ProfilesPage: React.FC = () => {
  const { t } = useTranslation();
  const {
    profiles,
    mainProfileId,
    setMainProfile,
    refreshProfiles,
    isLoading: profilesLoading,
  } = useProfileContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<FinancialProfile | null>(null);

  const createMutation = useCreateProfile();
  const updateMutation = useUpdateProfile();
  const deleteMutation = useDeleteProfile();

  const handleCreateProfile = async (data: FinancialProfileCreate) => {
    try {
      await createMutation.mutateAsync(data);
      setIsModalOpen(false);
      refreshProfiles();
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const handleUpdateProfile = async (data: FinancialProfileCreate) => {
    if (!editingProfile) return;

    try {
      await updateMutation.mutateAsync({
        profileId: editingProfile.id,
        data,
      });
      setIsModalOpen(false);
      setEditingProfile(null);
      refreshProfiles();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm(t('profiles.confirmDelete', 'Are you sure you want to delete this profile?'))) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(profileId);
      refreshProfiles();
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
  };

  const handleSetMain = async (profileId: string) => {
    try {
      await setMainProfile(profileId);
      refreshProfiles();
    } catch (error) {
      console.error('Error setting main profile:', error);
    }
  };

  const handleEditProfile = (profile: FinancialProfile) => {
    setEditingProfile(profile);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProfile(null);
  };

  if (profilesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t('common.loading', 'Loading...')}</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">
            {t('profiles.title', 'Financial Profiles')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t(
              'profiles.subtitle',
              'Manage your financial profiles. Each profile has its own accounts, transactions, and budgets.'
            )}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t('profiles.createNew', 'Create Profile')}
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <h3 className="font-medium mb-2">{t('profiles.info.title', 'About Profiles')}</h3>
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
          <li>
            • {t('profiles.info.main', 'Main profile is used by default for new transactions, budgets, and goals')}
          </li>
          <li>
            • {t('profiles.info.multiple', 'You can select multiple profiles for analysis and statistics')}
          </li>
          <li>
            • {t('profiles.info.types', 'Each profile can be Personal, Family, or Business type')}
          </li>
          <li>
            • {t('profiles.info.currency', 'Each profile has its own default currency')}
          </li>
        </ul>
      </div>

      {/* Profiles Grid */}
      {profiles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t('profiles.noProfilesMessage', 'No profiles yet. Create your first profile to get started.')}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('profiles.createFirst', 'Create Your First Profile')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              isMain={profile.id === mainProfileId}
              onSetMain={() => handleSetMain(profile.id)}
              onEdit={() => handleEditProfile(profile)}
              onDelete={() => handleDeleteProfile(profile.id)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <CreateProfileModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={editingProfile ? handleUpdateProfile : handleCreateProfile}
        editingProfile={editingProfile}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};
