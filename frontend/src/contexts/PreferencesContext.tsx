// contexts/PreferencesContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { getLocaleFromLanguage, type SupportedLocale, type SupportedCurrency } from '@/utils/currency';

export interface UserPreferences {
  language: string;
  locale: SupportedLocale;
  currency: SupportedCurrency;
  theme: 'light' | 'dark' | 'system';
  analyticsDateRange: '7days' | '30days' | '90days' | '1year' | 'all';
  aiProactivity: 'minimal' | 'moderate' | 'proactive';
  notifications: {
    budgetAlerts: boolean;
    anomalyDetection: boolean;
    goalMilestones: boolean;
    recurringReminders: boolean;
  };
}

interface PreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
}

const defaultPreferences: UserPreferences = {
  language: 'en',
  locale: 'en-US',
  currency: 'EUR',
  theme: 'system',
  analyticsDateRange: '30days',
  aiProactivity: 'moderate',
  notifications: {
    budgetAlerts: true,
    anomalyDetection: true,
    goalMilestones: true,
    recurringReminders: true,
  },
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const STORAGE_KEY = 'financepro_preferences';

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const { i18n } = useTranslation();

  // Load preferences from localStorage
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...defaultPreferences, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load preferences from localStorage:', error);
    }
    return defaultPreferences;
  });

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save preferences to localStorage:', error);
    }
  }, [preferences]);

  // Update i18n language when preferences change
  useEffect(() => {
    if (i18n.language !== preferences.language) {
      i18n.changeLanguage(preferences.language);
    }
  }, [preferences.language, i18n]);

  // Update locale when language changes
  useEffect(() => {
    const newLocale = getLocaleFromLanguage(preferences.language);
    if (newLocale !== preferences.locale) {
      setPreferences((prev) => ({ ...prev, locale: newLocale }));
    }
  }, [preferences.language]);

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences((prev) => ({
      ...prev,
      ...updates,
      // Handle nested notifications updates
      notifications: updates.notifications
        ? { ...prev.notifications, ...updates.notifications }
        : prev.notifications,
    }));
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
    i18n.changeLanguage(defaultPreferences.language);
  };

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreferences, resetPreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = (): PreferencesContextType => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
