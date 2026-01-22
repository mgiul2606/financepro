/**
 * Profiles management page
 */
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ProfileCard } from '../components/ProfileCard';
import { CreateProfileModal } from '../components/CreateProfileModal';
import { useProfileContext } from '@/contexts/ProfileContext';
import {
  useCreateProfile,
  useUpdateProfile,
  useDeleteProfile,
} from '../profiles.hooks';
import type {
  ProfileResponse as FinancialProfile,
  ProfileCreate as FinancialProfileCreate,
} from '../profiles.types';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);

  const { createProfile, isCreating } = useCreateProfile();
  const { updateProfile, isUpdating } = useUpdateProfile();
  const { deleteProfile, isDeleting } = useDeleteProfile();

  const handleCreateProfile = async (data: FinancialProfileCreate) => {
    try {
      await createProfile(data);
      setIsModalOpen(false);
      refreshProfiles();
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const handleUpdateProfile = async (data: FinancialProfileCreate) => {
    if (!editingProfile) return;

    try {
      await updateProfile(editingProfile.id, data);
      setIsModalOpen(false);
      setEditingProfile(null);
      refreshProfiles();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleDeleteClick = (profileId: string) => {
    setProfileToDelete(profileId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!profileToDelete) return;

    try {
      await deleteProfile(profileToDelete);
      refreshProfiles();
    } catch (error) {
      console.error('Error deleting profile:', error);
    } finally {
      setDeleteDialogOpen(false);
      setProfileToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setProfileToDelete(null);
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
        <div className="text-muted-foreground">{t('common.loading', 'Loading...')}</div>
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
          <p className="text-muted-foreground">
            {t(
              'profiles.subtitle',
              'Manage your financial profiles. Each profile has its own accounts, transactions, and budgets.'
            )}
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('profiles.createNew', 'Create Profile')}
        </Button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <h3 className="font-medium mb-2">{t('profiles.info.title', 'About Profiles')}</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
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
          <p className="text-muted-foreground mb-4">
            {t('profiles.noProfilesMessage', 'No profiles yet. Create your first profile to get started.')}
          </p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t('profiles.createFirst', 'Create Your First Profile')}
          </Button>
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
              onDelete={() => handleDeleteClick(profile.id)}
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
        isLoading={isCreating || isUpdating}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('profiles.deleteDialog.title', 'Delete Profile')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'profiles.deleteDialog.description',
                'Are you sure you want to delete this profile? This action cannot be undone. All accounts, transactions, and data associated with this profile will be permanently removed.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting
                ? t('common.deleting', 'Deleting...')
                : t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
