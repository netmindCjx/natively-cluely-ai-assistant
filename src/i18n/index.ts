import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import zh from './locales/zh.json';

export const SUPPORTED_LANGUAGES = ['en', 'zh'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const LANGUAGE_STORAGE_KEY = 'natively_language';

const detectInitialLanguage = (): SupportedLanguage => {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored && (SUPPORTED_LANGUAGES as readonly string[]).includes(stored)) {
    return stored as SupportedLanguage;
  }
  const navLang = (typeof navigator !== 'undefined' && navigator.language) || 'en';
  return navLang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
  },
  lng: detectInitialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export const setAppLanguage = (lng: SupportedLanguage) => {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
  i18n.changeLanguage(lng);
  document.documentElement.setAttribute('lang', lng);
};

document.documentElement.setAttribute('lang', i18n.language);

export default i18n;
