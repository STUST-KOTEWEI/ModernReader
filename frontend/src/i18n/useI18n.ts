import { create } from 'zustand';
import { translations, Language, TranslationKey } from './translations';

const LANG_STORAGE_KEY = 'mr_lang';

interface I18nStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

export const useI18n = create<I18nStore>((set, get) => ({
  language: ((): Language => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY) as Language | null;
      if (saved && (['en','zh','ja'] as string[]).includes(saved)) return saved as Language;
      // Auto-detect device/browser language when no saved preference
      const nav = (navigator?.language || navigator?.languages?.[0] || 'en').toLowerCase();
      if (nav.startsWith('zh')) return 'zh';
      if (nav.startsWith('ja')) return 'ja';
    } catch {}
    return 'en';
  })(),
  setLanguage: (lang: Language) => {
    try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch {}
    set({ language: lang });
  },
  t: (key: TranslationKey) => {
    const { language } = get();
    return translations[language][key] || translations.en[key] || key;
  }
}));
