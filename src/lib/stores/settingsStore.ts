import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'english' | 'hindi';
export type Theme = 'light' | 'dark' | 'system';

interface SettingsState {
  language: Language;
  theme: Theme;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'english',
      theme: 'light',
      setLanguage: (language: Language) => set({ language }),
      setTheme: (theme: Theme) => set({ theme }),
    }),
    {
      name: 'invenhub-settings-storage',
    }
  )
); 