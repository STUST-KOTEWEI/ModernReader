import { create } from 'zustand';
import { translations, Language, TranslationKey } from './translations';

interface I18nStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

export const useI18n = create<I18nStore>((set, get) => ({
  language: 'en',
  setLanguage: (lang: Language) => set({ language: lang }),
  t: (key: TranslationKey) => {
    const { language } = get();
    return translations[language][key] || translations.en[key] || key;
  }
}));
