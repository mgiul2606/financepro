/**
 * Mandatory Profile Creation Modal using shadcn/ui Dialog
 * Cannot be dismissed until profile is created
 */
import React from 'react';
import { useForm } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ProfileCreate as FinancialProfileCreate } from '../profiles.types';
import { PROFILE_TYPE_OPTIONS } from '../profiles.types';
import { useProfileContext } from '@/contexts/ProfileContext';

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

  const handleFormSubmit = async (data: FinancialProfileCreate) => {
    await createFirstProfile(data);
  };

  // Determine if modal should be open
  const isOpen = showCreateProfileModal && requiresProfileCreation;

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <DialogTitle>
                {t('profiles.mandatory.title', 'Create Your First Profile')}
              </DialogTitle>
              <DialogDescription>
                {t(
                  'profiles.mandatory.description',
                  'You need at least one financial profile to use FinancePro.'
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <label htmlFor="mandatory-name" className="text-sm font-medium">
              {t('profiles.form.name', 'Profile Name')} *
            </label>
            <Input
              id="mandatory-name"
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
              autoFocus
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="mandatory-description" className="text-sm font-medium">
              {t('profiles.form.description', 'Description')}
            </label>
            <textarea
              id="mandatory-description"
              {...register('description')}
              rows={3}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              placeholder={t('profiles.form.descriptionPlaceholder', 'Optional description...')}
            />
          </div>

          {/* Profile Type */}
          <div className="space-y-2">
            <label htmlFor="mandatory-profile_type" className="text-sm font-medium">
              {t('profiles.form.type', 'Profile Type')}
            </label>
            <select
              id="mandatory-profile_type"
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
            <label htmlFor="mandatory-default_currency" className="text-sm font-medium">
              {t('profiles.form.currency', 'Default Currency')}
            </label>
            <select
              id="mandatory-default_currency"
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

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isCreatingProfile}
            >
              {isCreatingProfile
                ? t('profiles.mandatory.creating', 'Creating profile...')
                : t('profiles.mandatory.create', 'Create Profile & Continue')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
