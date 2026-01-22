/**
 * Create/Edit Profile Modal using shadcn/ui Dialog
 */
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type {
  ProfileCreate as FinancialProfileCreate,
  ProfileResponse as FinancialProfile,
} from '../profiles.types';
import { PROFILE_TYPE_OPTIONS } from '../profiles.types';

interface CreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FinancialProfileCreate) => void;
  editingProfile?: FinancialProfile | null;
  isLoading?: boolean;
}

/**
 * Profile type labels for i18n
 */
const PROFILE_TYPE_LABELS: Record<string, string> = {
  personal: 'profiles.types.personal',
  business: 'profiles.types.business',
  joint: 'profiles.types.joint',
  investment: 'profiles.types.investment',
};

/**
 * Default labels for profile types (fallback)
 */
const PROFILE_TYPE_DEFAULTS: Record<string, string> = {
  personal: 'Personal',
  business: 'Business',
  joint: 'Joint',
  investment: 'Investment',
};

export const CreateProfileModal: React.FC<CreateProfileModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingProfile,
  isLoading,
}) => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FinancialProfileCreate>({
    defaultValues: editingProfile
      ? {
          name: editingProfile.name,
          description: editingProfile.description || '',
          profile_type: editingProfile.profile_type,
          default_currency: editingProfile.default_currency,
        }
      : {
          name: '',
          description: '',
          profile_type: 'personal',
          default_currency: 'EUR',
        },
  });

  // Reset form when modal opens/closes or editing profile changes
  useEffect(() => {
    if (isOpen) {
      reset(
        editingProfile
          ? {
              name: editingProfile.name,
              description: editingProfile.description || '',
              profile_type: editingProfile.profile_type,
              default_currency: editingProfile.default_currency,
            }
          : {
              name: '',
              description: '',
              profile_type: 'personal',
              default_currency: 'EUR',
            }
      );
    }
  }, [isOpen, editingProfile, reset]);

  const handleFormSubmit = (data: FinancialProfileCreate) => {
    onSubmit(data);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingProfile
              ? t('profiles.editProfile', 'Edit Profile')
              : t('profiles.createProfile', 'Create New Profile')}
          </DialogTitle>
          <DialogDescription>
            {editingProfile
              ? t('profiles.editProfileDescription', 'Update your financial profile details.')
              : t('profiles.createProfileDescription', 'Create a new financial profile to organize your finances.')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              {t('profiles.form.name', 'Profile Name')} *
            </label>
            <Input
              id="name"
              {...register('name', {
                required: t('profiles.form.nameRequired', 'Profile name is required'),
                minLength: {
                  value: 1,
                  message: t('profiles.form.nameMinLength', 'Name must be at least 1 character'),
                },
                maxLength: {
                  value: 100,
                  message: t('profiles.form.nameMaxLength', 'Name must be less than 100 characters'),
                },
              })}
              placeholder={t('profiles.form.namePlaceholder', 'My Personal Finance')}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              {t('profiles.form.description', 'Description')}
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              placeholder={t('profiles.form.descriptionPlaceholder', 'Optional description...')}
            />
          </div>

          {/* Profile Type */}
          <div className="space-y-2">
            <label htmlFor="profile_type" className="text-sm font-medium">
              {t('profiles.form.type', 'Profile Type')}
            </label>
            <select
              id="profile_type"
              {...register('profile_type')}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {PROFILE_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {t(PROFILE_TYPE_LABELS[type], PROFILE_TYPE_DEFAULTS[type])}
                </option>
              ))}
            </select>
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <label htmlFor="default_currency" className="text-sm font-medium">
              {t('profiles.form.currency', 'Default Currency')}
            </label>
            <select
              id="default_currency"
              {...register('default_currency')}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="EUR">EUR - Euro</option>
              <option value="USD">USD - US Dollar</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="JPY">JPY - Japanese Yen</option>
              <option value="CHF">CHF - Swiss Franc</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
            </select>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? t('common.saving', 'Saving...')
                : editingProfile
                  ? t('common.update', 'Update')
                  : t('common.create', 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
