import type { Language, TranslationSchema } from './types';
import { en } from './en';
import { bn } from './bn';
import { hi } from './hi';

export * from './types';
export { en, bn, hi };

export const translations: Record<Language, TranslationSchema> = {
  en,
  bn,
  hi,
};

export const languageMeta: Record<Language, { name: string; nativeName: string; flag: string }> = {
  en: {
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
  },
  bn: {
    name: 'Bengali',
    nativeName: 'বাংলা',
    flag: '🇮🇳',
  },
  hi: {
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
  },
};
