import React, { createContext, useContext } from 'react';
import { useSettingsStore, Language } from '../stores/settingsStore';

// Define translations for both languages
export const translations = {
  english: {
    // Common
    settings: 'Settings',
    language: 'Language',
    theme: 'Theme',
    save: 'Save',
    cancel: 'Cancel',
    
    // Languages
    english: 'English',
    hindi: 'Hindi',
    
    // Themes
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    
    // Settings page
    languageSettings: 'Language Settings',
    themeSettings: 'Theme Settings',
    selectLanguage: 'Select Language',
    selectTheme: 'Select Theme',
    settingsUpdated: 'Settings updated successfully',
    
    // Navigation
    dashboard: 'Dashboard',
    inventory: 'Inventory',
    billing: 'Billing',
    transactions: 'Transactions',
    analytics: 'Analytics',
    logout: 'Logout',
    
    // Notifications
    notifications: 'Notifications',
    markAllRead: 'Mark all read',
    clearAll: 'Clear all',
    noNotifications: 'No notifications',
    lowStockAlert: 'Low Stock Alert',
    outOfStockAlert: 'Out of Stock Alert',
    newProductAdded: 'New Product Added',
    productUpdated: 'Product Updated',
    newTransaction: 'New Transaction',
    stockUpdated: 'Stock Updated',
  },
  hindi: {
    // Common
    settings: 'समायोजन',
    language: 'भाषा',
    theme: 'थीम',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    
    // Languages
    english: 'अंग्रे़ी',
    hindi: 'हिंदी',
    
    // Themes
    light: 'उजला',
    dark: 'अंधेरा',
    system: 'सिस्टम',
    
    // Settings page
    languageSettings: 'भाषा समायोजन',
    themeSettings: 'थीम समायोजन',
    selectLanguage: 'भाषा चुनें',
    selectTheme: 'थीम चुनें',
    settingsUpdated: 'समायोजन सफलतापूर्वक अपडेट किया गया',
    
    // Navigation
    dashboard: 'डैशबोर्ड',
    inventory: 'इन्वेंटरी',
    billing: 'बिलिंग',
    transactions: 'लेन-देन',
    analytics: 'एनालिटिक्स',
    logout: 'लॉगआउट',
    
    // Notifications
    notifications: 'सूचनाएँ',
    markAllRead: 'सभी पढ़ा हुआ मार्क करें',
    clearAll: 'सभी हटाएं',
    noNotifications: 'कोई सूचना नहीं',
    lowStockAlert: 'कम स्टॉक अलर्ट',
    outOfStockAlert: 'स्टॉक ख़त्म अलर्ट',
    newProductAdded: 'नया उत्पाद जोड़ा गया',
    productUpdated: 'उत्पाद अपडेट किया गया',
    newTransaction: 'नया लेनदेन',
    stockUpdated: 'स्टॉक अपडेट किया गया',
  }
};

type TranslationKeys = keyof typeof translations.english;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKeys) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, setLanguage } = useSettingsStore();
  
  // Translation function
  const t = (key: TranslationKeys): string => {
    return translations[language][key] || key;
  };
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  
  return context;
}; 