// Mandatory Profile Creation Modal - Cannot be dismissed until profile is created
import React from 'react';
import { useForm } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';
import type { ProfileCreate as FinancialProfileCreate, ProfileType } from '../profiles.types';
import { PROFILE_TYPE_OPTIONS } from '../profiles.types';
import { useTranslation } from 'react-i18next';
import { useProfileContext } from '../../../contexts/ProfileContext';

export const MandatoryProfileModal: React.FC = () => {
  const { t } = useTranslation();
  const {
    showCreateProfileModal,
    createFirstProfile,
    isCreatingProfile,
    requiresProfileCreation,
  } = useProfileContext();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FinancialProfileCreate>({
    defaultValues: {
      name: '',
      description: '',
      profile_type: 'personal',
      default_currency: 'EUR',
    },
  });

  if (!showCreateProfileModal || !requiresProfileCreation) return null;

  const handleFormSubmit = async (data: FinancialProfileCreate) => {
    await createFirstProfile(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - no click to close */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        {/* Warning Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-shrink-0 w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">
              {t('profiles.mandatory.title', 'Create Your First Profile')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t(
                'profiles.mandatory.description',
                'You need at least one financial profile to use FinancePro.'
              )}
            </p>
          </div>
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
              autoFocus
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
              <option value="personal">
                {t('profiles.types.personal', 'Personal')}
              </option>
              <option value="joint">{t('profiles.types.joint', 'Joint')}</option>
              <option value="business">
                {t('profiles.types.business', 'Business')}
              </option>
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

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isCreatingProfile}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isCreatingProfile
                ? t('profiles.mandatory.creating', 'Creating profile...')
                : t('profiles.mandatory.create', 'Create Profile & Continue')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
