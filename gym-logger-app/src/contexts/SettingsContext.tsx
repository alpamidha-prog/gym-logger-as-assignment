'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getUserSettings, updateUserSettings } from '@/lib/firestore';
import { useTheme } from './ThemeContext';
import type { UserSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (data: Partial<UserSettings>) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSettings: async () => {},
  loading: true,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const s = await getUserSettings(user.uid);
        setSettings(s);
        if (s.theme) setTheme(s.theme);
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
      setLoading(false);
    })();
  }, [user]);

  const update = async (data: Partial<UserSettings>) => {
    if (!user) return;
    const newSettings = { ...settings, ...data };
    setSettings(newSettings);
    if (data.theme) setTheme(data.theme);
    await updateUserSettings(user.uid, data);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings: update, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
