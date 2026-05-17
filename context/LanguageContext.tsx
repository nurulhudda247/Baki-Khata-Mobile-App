import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';
import { useAppContext } from './AppContext';

type Language = 'en' | 'bn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(i18n.language as Language || 'en');

  useEffect(() => {
    const loadLanguage = async () => {
      const savedLang = await AsyncStorage.getItem('user-language');
      if (savedLang === 'en' || savedLang === 'bn') {
        setLanguageState(savedLang);
        i18n.changeLanguage(savedLang);
      }
    };
    loadLanguage();
  }, []);

  const { updateSettings } = useAppContext();

  const setLanguage = async (lang: Language) => {
    try {
      await i18n.changeLanguage(lang);
      setLanguageState(lang);
      await AsyncStorage.setItem('user-language', lang);
      await updateSettings({ language: lang });
    } catch (e) {
      console.error('Failed to change language', e);
    }
  };

  const isRTL = false; // Neither English nor Bengali are RTL

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
