// src/pages/Settings.tsx
import { useState } from 'react';
import { User, Bell, Shield, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/core/components/composite/PageHeader';
import { Card, CardHeader, CardBody } from '@/core/components/atomic/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/core/components/atomic/Tabs';
import { FormField, SelectField } from '@/components/ui/FormField';
import { Button } from '@/core/components/atomic/Button';
import { Toggle } from '@/core/components/atomic/Toggle';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import type { SupportedCurrency, SupportedLocale } from '@/utils/currency';

export const Settings = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { preferences, updatePreferences } = usePreferences();
  const [activeTab, setActiveTab] = useState('profile');

  // Local state for notifications (in a real app, these would be synced with backend)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);

  // Language options
  const languageOptions = [
    { value: 'en', label: t('settings.languages.en') },
    { value: 'it', label: t('settings.languages.it') },
  ];

  // Locale options
  const localeOptions = [
    { value: 'en-US', label: t('settings.locales.en-US') },
    { value: 'en-GB', label: t('settings.locales.en-GB') },
    { value: 'it-IT', label: t('settings.locales.it-IT') },
    { value: 'de-DE', label: t('settings.locales.de-DE') },
    { value: 'fr-FR', label: t('settings.locales.fr-FR') },
    { value: 'es-ES', label: t('settings.locales.es-ES') },
  ];

  // Currency options
  const currencyOptions = [
    { value: 'EUR', label: t('settings.currencies.EUR') },
    { value: 'USD', label: t('settings.currencies.USD') },
    { value: 'GBP', label: t('settings.currencies.GBP') },
    { value: 'CHF', label: t('settings.currencies.CHF') },
    { value: 'JPY', label: t('settings.currencies.JPY') },
  ];

  // Theme options
  const themeOptions = [
    { value: 'light', label: t('settings.themes.light') },
    { value: 'dark', label: t('settings.themes.dark') },
    { value: 'system', label: t('settings.themes.system') },
  ];

  // Date range options
  const dateRangeOptions = [
    { value: '7days', label: t('settings.dateRanges.7days') },
    { value: '30days', label: t('settings.dateRanges.30days') },
    { value: '90days', label: t('settings.dateRanges.90days') },
    { value: '1year', label: t('settings.dateRanges.1year') },
    { value: 'all', label: t('settings.dateRanges.all') },
  ];

  // AI Proactivity options
  const aiProactivityOptions = [
    { value: 'minimal', label: t('settings.proactivityLevels.minimal') },
    { value: 'moderate', label: t('settings.proactivityLevels.moderate') },
    { value: 'proactive', label: t('settings.proactivityLevels.proactive') },
  ];

  // Week day options
  const weekDayOptions = [
    { value: 'monday', label: t('settings.weekDays.monday') },
    { value: 'sunday', label: t('settings.weekDays.sunday') },
  ];

  // Timezone options
  const timezoneOptions = [
    { value: 'UTC', label: 'UTC' },
    { value: 'Europe/Rome', label: 'Europe/Rome' },
    { value: 'Europe/London', label: 'Europe/London' },
    { value: 'Europe/Paris', label: 'Europe/Paris' },
    { value: 'Europe/Berlin', label: 'Europe/Berlin' },
    { value: 'America/New_York', label: 'America/New York' },
    { value: 'America/Los_Angeles', label: 'America/Los Angeles' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
  ];

  const handleSavePreferences = () => {
    // In a real app, this would save to backend
    console.log('Preferences saved:', preferences);
    // Show success message (you could use a toast notification)
    alert(t('settings.saveSuccess'));
  };

  return (
    <div className="p-8">
      <PageHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
      />

      <div className="max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              {t('settings.profile')}
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              {t('settings.notifications')}
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              {t('settings.security')}
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <Globe className="h-4 w-4 mr-2" />
              {t('settings.preferences')}
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card variant="bordered">
              <CardHeader
                title={t('settings.profileInformation')}
                subtitle={t('settings.profileInformationDesc')}
              />
              <CardBody>
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <FormField
                    label={t('settings.email')}
                    type="email"
                    value={user?.email || ''}
                    disabled
                    hint={t('settings.emailCannotChange')}
                  />

                  <FormField
                    label={t('settings.fullName')}
                    placeholder={t('settings.fullNamePlaceholder')}
                    hint={t('settings.fullNameHint')}
                  />

                  <SelectField
                    label={t('settings.language')}
                    hint={t('settings.languageDesc')}
                    options={languageOptions}
                    value={preferences.language}
                    onChange={(value) => updatePreferences({ language: value })}
                  />

                  <SelectField
                    label={t('settings.timezone')}
                    options={timezoneOptions}
                    value="Europe/Rome"
                  />

                  <div className="pt-4">
                    <Button variant="primary" onClick={handleSavePreferences}>
                      {t('settings.saveChanges')}
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card variant="bordered">
              <CardHeader
                title={t('settings.notificationPreferences')}
                subtitle={t('settings.notificationPreferencesDesc')}
              />
              <CardBody>
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {t('settings.emailNotifications')}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {t('settings.emailNotificationsDesc')}
                      </p>
                    </div>
                    <Toggle
                      checked={emailNotifications}
                      onChange={(checked) => setEmailNotifications(checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {t('settings.pushNotifications')}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {t('settings.pushNotificationsDesc')}
                      </p>
                    </div>
                    <Toggle
                      checked={pushNotifications}
                      onChange={(checked) => setPushNotifications(checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {t('settings.budgetAlerts')}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {t('settings.budgetAlertsDesc')}
                      </p>
                    </div>
                    <Toggle
                      checked={preferences.notifications.budgetAlerts}
                      onChange={(checked) =>
                        updatePreferences({
                          notifications: { ...preferences.notifications, budgetAlerts: checked },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {t('settings.anomalyDetection')}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {t('settings.anomalyDetectionDesc')}
                      </p>
                    </div>
                    <Toggle
                      checked={preferences.notifications.anomalyDetection}
                      onChange={(checked) =>
                        updatePreferences({
                          notifications: {
                            ...preferences.notifications,
                            anomalyDetection: checked,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {t('settings.goalMilestones')}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {t('settings.goalMilestonesDesc')}
                      </p>
                    </div>
                    <Toggle
                      checked={preferences.notifications.goalMilestones}
                      onChange={(checked) =>
                        updatePreferences({
                          notifications: {
                            ...preferences.notifications,
                            goalMilestones: checked,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {t('settings.recurringReminders')}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {t('settings.recurringRemindersDesc')}
                      </p>
                    </div>
                    <Toggle
                      checked={preferences.notifications.recurringReminders}
                      onChange={(checked) =>
                        updatePreferences({
                          notifications: {
                            ...preferences.notifications,
                            recurringReminders: checked,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="pt-4">
                    <Button variant="primary" onClick={handleSavePreferences}>
                      {t('settings.savePreferences')}
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="space-y-6">
              <Card variant="bordered">
                <CardHeader
                  title={t('settings.changePassword')}
                  subtitle={t('settings.changePasswordDesc')}
                />
                <CardBody>
                  <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <FormField
                      label={t('settings.currentPassword')}
                      type="password"
                      placeholder={t('settings.currentPassword')}
                    />

                    <FormField
                      label={t('settings.newPassword')}
                      type="password"
                      placeholder={t('settings.newPassword')}
                      hint={t('settings.passwordHint')}
                    />

                    <FormField
                      label={t('settings.confirmNewPassword')}
                      type="password"
                      placeholder={t('settings.confirmNewPassword')}
                    />

                    <div className="pt-4">
                      <Button variant="primary">{t('settings.updatePassword')}</Button>
                    </div>
                  </form>
                </CardBody>
              </Card>

              <Card variant="bordered">
                <CardHeader
                  title={t('settings.twoFactor')}
                  subtitle={t('settings.twoFactorDesc')}
                />
                <CardBody>
                  <p className="text-sm text-gray-600 mb-4">
                    {t('settings.twoFactorDisabled')}
                  </p>
                  <Button variant="secondary">{t('settings.enable2FA')}</Button>
                </CardBody>
              </Card>

              <Card variant="bordered">
                <CardHeader
                  title={t('settings.activeSessions')}
                  subtitle={t('settings.activeSessionsDesc')}
                />
                <CardBody>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900">
                          {t('settings.currentDevice')}
                        </p>
                        <p className="text-sm text-gray-500">
                          Chrome on Windows • {t('settings.activeNow')}
                        </p>
                      </div>
                      <span className="text-xs text-green-600 font-medium">Active</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <div className="space-y-6">
              {/* Language & Localization */}
              <Card variant="bordered">
                <CardHeader
                  title={t('settings.language')}
                  subtitle={t('settings.languageDesc')}
                />
                <CardBody>
                  <div className="space-y-4">
                    <SelectField
                      label={t('settings.language')}
                      hint={t('settings.languageDesc')}
                      options={languageOptions}
                      value={preferences.language}
                      onChange={(value) => updatePreferences({ language: value })}
                    />

                    <SelectField
                      label={t('settings.locale')}
                      hint={t('settings.localeDesc')}
                      options={localeOptions}
                      value={preferences.locale}
                      onChange={(value) =>
                        updatePreferences({ locale: value as SupportedLocale })
                      }
                    />

                    <SelectField
                      label={t('settings.currency')}
                      hint={t('settings.currencyDesc')}
                      options={currencyOptions}
                      value={preferences.currency}
                      onChange={(value) =>
                        updatePreferences({ currency: value as SupportedCurrency })
                      }
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Application Preferences */}
              <Card variant="bordered">
                <CardHeader
                  title={t('settings.applicationPreferences')}
                  subtitle={t('settings.applicationPreferencesDesc')}
                />
                <CardBody>
                  <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <SelectField
                      label={t('settings.theme')}
                      hint={t('settings.themeDesc')}
                      options={themeOptions}
                      value={preferences.theme}
                      onChange={(value) =>
                        updatePreferences({
                          theme: value as 'light' | 'dark' | 'system',
                        })
                      }
                    />

                    <SelectField
                      label={t('settings.dateFormat')}
                      options={[
                        { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                        { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                        { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                      ]}
                      value="DD/MM/YYYY"
                    />

                    <SelectField
                      label={t('settings.firstDayOfWeek')}
                      options={weekDayOptions}
                      value="monday"
                    />
                  </form>
                </CardBody>
              </Card>

              {/* Analytics Preferences */}
              <Card variant="bordered">
                <CardHeader
                  title={t('settings.analytics')}
                  subtitle={t('settings.defaultDateRangeDesc')}
                />
                <CardBody>
                  <SelectField
                    label={t('settings.defaultDateRange')}
                    hint={t('settings.defaultDateRangeDesc')}
                    options={dateRangeOptions}
                    value={preferences.analyticsDateRange}
                    onChange={(value) =>
                      updatePreferences({
                        analyticsDateRange: value as
                          | '7days'
                          | '30days'
                          | '90days'
                          | '1year'
                          | 'all',
                      })
                    }
                  />
                </CardBody>
              </Card>

              {/* AI Preferences */}
              <Card variant="bordered">
                <CardHeader
                  title={t('settings.aiPreferences')}
                  subtitle={t('settings.aiProactivityDesc')}
                />
                <CardBody>
                  <SelectField
                    label={t('settings.aiProactivity')}
                    hint={t('settings.aiProactivityDesc')}
                    options={aiProactivityOptions}
                    value={preferences.aiProactivity}
                    onChange={(value) =>
                      updatePreferences({
                        aiProactivity: value as 'minimal' | 'moderate' | 'proactive',
                      })
                    }
                  />
                </CardBody>
              </Card>

              <div className="pt-4">
                <Button variant="primary" onClick={handleSavePreferences}>
                  {t('settings.savePreferences')}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
