// Create/Edit Profile Modal
import React from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { FinancialProfileCreate, FinancialProfile } from '../types';
import { ProfileType } from '../types';
import { useTranslation } from 'react-i18next';

interface CreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FinancialProfileCreate) => void;
  editingProfile?: FinancialProfile | null;
  isLoading?: boolean;
}

export const CreateProfileModal: React.FC<CreateProfileModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingProfile,
  isLoading,
}) => {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FinancialProfileCreate>({
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
          profile_type: ProfileType.PERSONAL,
          default_currency: 'EUR',
        },
  });

  if (!isOpen) return null;

  const handleFormSubmit = (data: FinancialProfileCreate) => {
    onSubmit(data);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            {editingProfile
              ? t('profiles.editProfile', 'Edit Profile')
              : t('profiles.createProfile', 'Create New Profile')}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('profiles.form.name', 'Profile Name')} *
            </label>
            <input
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('profiles.form.namePlaceholder', 'My Personal Finance')}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('profiles.form.description', 'Description')}
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder={t('profiles.form.descriptionPlaceholder', 'Optional description...')}
            />
          </div>

          {/* Profile Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('profiles.form.type', 'Profile Type')}
            </label>
            <select
              {...register('profile_type')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={ProfileType.PERSONAL}>{t('profiles.types.personal', 'Personal')}</option>
              <option value={ProfileType.FAMILY}>{t('profiles.types.family', 'Family')}</option>
              <option value={ProfileType.BUSINESS}>{t('profiles.types.business', 'Business')}</option>
            </select>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('profiles.form.currency', 'Default Currency')}
            </label>
            <select
              {...register('default_currency')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading
                ? t('common.saving', 'Saving...')
                : editingProfile
                ? t('common.update', 'Update')
                : t('common.create', 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
