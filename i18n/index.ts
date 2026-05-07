import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import bn from './locales/bn.json';

const resources = {
  en: { translation: en },
  bn: { translation: bn },
};

const initI18n = async () => {
  let savedLanguage = await AsyncStorage.getItem('user-language');
  
  if (!savedLanguage) {
    const locales = Localization.getLocales();
    const systemLanguage = locales[0]?.languageCode;
    savedLanguage = systemLanguage === 'bn' ? 'bn' : 'en';
  }

  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: savedLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
};

initI18n();

export default i18n;
