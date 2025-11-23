// Profile Selector component for topbar/sidebar
import React, { useState } from 'react';
import { ChevronDown, Check, Star } from 'lucide-react';
import { useProfileContext } from '../../../contexts/ProfileContext';
import { useTranslation } from 'react-i18next';

export const ProfileSelector: React.FC = () => {
  const { t } = useTranslation();
  const {
    profiles,
    activeProfileIds,
    mainProfileId,
    setMainProfile,
    toggleProfileSelection,
    isLoading,
  } = useProfileContext();

  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="px-4 py-2 text-sm text-gray-500">
        {t('profiles.loading', 'Loading profiles...')}
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="px-4 py-2 text-sm text-gray-500">
        {t('profiles.noProfiles', 'No profiles')}
      </div>
    );
  }

  const activeProfilesCount = activeProfileIds.length;
  const displayText =
    activeProfilesCount === 1
      ? profiles.find((p) => p.id === activeProfileIds[0])?.name || t('profiles.selectProfile', 'Select Profile')
      : t('profiles.multipleSelected', `${activeProfilesCount} profiles selected`, { count: activeProfilesCount });

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white"
      >
        <span className="text-sm font-medium">{displayText}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                {t('profiles.selectProfiles', 'Select Profiles')}
              </div>

              {profiles.map((profile) => {
                const isActive = activeProfileIds.includes(profile.id);
                const isMain = profile.id === mainProfileId;

                return (
                  <div
                    key={profile.id}
                    className="group relative"
                  >
                    <button
                      onClick={() => {
                        toggleProfileSelection(profile.id);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {/* Checkbox */}
                      <div
                        className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                          isActive
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {isActive && <Check className="w-3 h-3 text-white" />}
                      </div>

                      {/* Profile info */}
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate text-gray-900 dark:text-white">{profile.name}</span>
                          {isMain && (
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {profile.profile_type || 'personal'} • {profile.default_currency || 'USD'}
                        </span>
                      </div>

                      {/* Set as main button */}
                      {isActive && !isMain && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMainProfile(profile.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-opacity"
                          title={t('profiles.setAsMain', 'Set as main')}
                        >
                          <Star className="w-3 h-3 text-gray-400" />
                        </button>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 p-2">
              <a
                href="/settings/profiles"
                className="block px-3 py-2 text-sm text-center text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {t('profiles.manageProfiles', 'Manage Profiles')}
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
