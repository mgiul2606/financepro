// Profile Card component
import React from 'react';
import { Star, Edit2, Trash2, Building2, Users, User } from 'lucide-react';
import type { ProfileResponse as FinancialProfile } from '../profiles.types';
import { useTranslation } from 'react-i18next';

interface ProfileCardProps {
  profile: FinancialProfile;
  isMain: boolean;
  onSetMain: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  isMain,
  onSetMain,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();

  const getProfileIcon = () => {
    switch (profile.profile_type) {
      case 'business':
        return <Building2 className="w-5 h-5" />;
      case 'joint':
        return <Users className="w-5 h-5" />;
      case 'personal':
      default:
        return <User className="w-5 h-5" />;
    }
  };

  const getProfileTypeLabel = () => {
    switch (profile.profile_type) {
      case 'business':
        return t('profiles.types.business', 'Business');
      case 'joint':
        return t('profiles.types.joint', 'Joint');
      case 'personal':
      default:
        return t('profiles.types.personal', 'Personal');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg">
            {getProfileIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{profile.name}</h3>
              {isMain && (
                <span title={t('profiles.mainProfile', 'Main Profile')}><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /></span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{getProfileTypeLabel()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={t('common.edit', 'Edit')}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title={t('common.delete', 'Delete')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {profile.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{profile.description}</p>
      )}

      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <div className="flex items-center gap-1">
          <span className="font-medium">{t('profiles.currency', 'Currency')}:</span>
          <span>{profile.default_currency}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${profile.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{profile.is_active ? t('profiles.active', 'Active') : t('profiles.inactive', 'Inactive')}</span>
        </div>
      </div>

      {!isMain && (
        <button
          onClick={onSetMain}
          className="w-full py-2 px-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors"
        >
          {t('profiles.setAsMain', 'Set as Main Profile')}
        </button>
      )}
    </div>
  );
};
