// src/pages/Settings.tsx
import { useState } from 'react';
import { User, Bell, Shield, Globe } from 'lucide-react';
import { PageHeader } from '@/core/components/composite/PageHeader';
import { Card, CardHeader, CardBody } from '@/core/components/atomic/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/core/components/atomic/Tabs';
import { FormField, SelectField } from '@/components/ui/FormField';
import { Button } from '@/core/components/atomic/Button';
import { Toggle } from '@/core/components/atomic/Toggle';
import { useAuth } from '@/contexts/AuthContext';

export const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Settings state (would be managed via API in production)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [goalReminders, setGoalReminders] = useState(true);

  return (
    <div className="p-8">
      <PageHeader
        title="Settings"
        subtitle="Manage your account and preferences"
      />

      <div className="max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <Globe className="h-4 w-4 mr-2" />
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card variant="bordered">
              <CardHeader title="Profile Information" subtitle="Update your personal details" />
              <CardBody>
                <form className="space-y-4">
                  <FormField
                    label="Email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    hint="Email cannot be changed"
                  />

                  <FormField
                    label="Full Name"
                    placeholder="John Doe"
                    hint="Your display name"
                  />

                  <SelectField
                    label="Language"
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'it', label: 'Italian' },
                      { value: 'es', label: 'Spanish' },
                    ]}
                    value="en"
                  />

                  <SelectField
                    label="Timezone"
                    options={[
                      { value: 'UTC', label: 'UTC' },
                      { value: 'Europe/Rome', label: 'Europe/Rome' },
                      { value: 'America/New_York', label: 'America/New York' },
                    ]}
                    value="Europe/Rome"
                  />

                  <div className="pt-4">
                    <Button variant="primary">Save Changes</Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card variant="bordered">
              <CardHeader
                title="Notification Preferences"
                subtitle="Choose how you want to be notified"
              />
              <CardBody>
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <h4 className="font-medium text-gray-900">Email Notifications</h4>
                      <p className="text-sm text-gray-500">
                        Receive updates and alerts via email
                      </p>
                    </div>
                    <Toggle
                      checked={emailNotifications}
                      onChange={(checked) => setEmailNotifications(checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <h4 className="font-medium text-gray-900">Push Notifications</h4>
                      <p className="text-sm text-gray-500">
                        Get push notifications on your devices
                      </p>
                    </div>
                    <Toggle
                      checked={pushNotifications}
                      onChange={(checked) => setPushNotifications(checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <h4 className="font-medium text-gray-900">Budget Alerts</h4>
                      <p className="text-sm text-gray-500">
                        Alert me when approaching budget limits
                      </p>
                    </div>
                    <Toggle
                      checked={budgetAlerts}
                      onChange={(checked) => setBudgetAlerts(checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="font-medium text-gray-900">Goal Reminders</h4>
                      <p className="text-sm text-gray-500">
                        Remind me about my financial goals progress
                      </p>
                    </div>
                    <Toggle
                      checked={goalReminders}
                      onChange={(checked) => setGoalReminders(checked)}
                    />
                  </div>

                  <div className="pt-4">
                    <Button variant="primary">Save Preferences</Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="space-y-6">
              <Card variant="bordered">
                <CardHeader title="Change Password" subtitle="Update your password" />
                <CardBody>
                  <form className="space-y-4">
                    <FormField
                      label="Current Password"
                      type="password"
                      placeholder="Enter current password"
                    />

                    <FormField
                      label="New Password"
                      type="password"
                      placeholder="Enter new password"
                      hint="At least 8 characters"
                    />

                    <FormField
                      label="Confirm New Password"
                      type="password"
                      placeholder="Confirm new password"
                    />

                    <div className="pt-4">
                      <Button variant="primary">Update Password</Button>
                    </div>
                  </form>
                </CardBody>
              </Card>

              <Card variant="bordered">
                <CardHeader
                  title="Two-Factor Authentication"
                  subtitle="Add an extra layer of security"
                />
                <CardBody>
                  <p className="text-sm text-gray-600 mb-4">
                    Two-factor authentication is currently disabled. Enable it to add an extra
                    layer of security to your account.
                  </p>
                  <Button variant="secondary">Enable 2FA</Button>
                </CardBody>
              </Card>

              <Card variant="bordered">
                <CardHeader title="Active Sessions" subtitle="Manage your active sessions" />
                <CardBody>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900">Current Device</p>
                        <p className="text-sm text-gray-500">Chrome on Windows • Active now</p>
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
            <Card variant="bordered">
              <CardHeader title="Application Preferences" subtitle="Customize your experience" />
              <CardBody>
                <form className="space-y-4">
                  <SelectField
                    label="Default Currency"
                    options={[
                      { value: 'EUR', label: 'EUR (€)' },
                      { value: 'USD', label: 'USD ($)' },
                      { value: 'GBP', label: 'GBP (£)' },
                    ]}
                    value="EUR"
                    hint="Currency used for new transactions and accounts"
                  />

                  <SelectField
                    label="Date Format"
                    options={[
                      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                      { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                      { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                    ]}
                    value="DD/MM/YYYY"
                  />

                  <SelectField
                    label="First Day of Week"
                    options={[
                      { value: 'monday', label: 'Monday' },
                      { value: 'sunday', label: 'Sunday' },
                    ]}
                    value="monday"
                  />

                  <div className="flex items-center justify-between py-3 border-t border-gray-200 mt-6">
                    <div>
                      <h4 className="font-medium text-gray-900">Dark Mode</h4>
                      <p className="text-sm text-gray-500">
                        Use dark theme for the interface
                      </p>
                    </div>
                    <Toggle checked={false} onChange={() => {}} />
                  </div>

                  <div className="pt-4">
                    <Button variant="primary">Save Preferences</Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
