import type { Language } from '../translations/types';

const DATE_LOCALES: Record<Language, string> = {
  en: 'en-IN',
  bn: 'bn-IN',
  hi: 'hi-IN',
};

export function formatAssessmentDate(timestamp: string, language: Language): string {
  return new Intl.DateTimeFormat(DATE_LOCALES[language], {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}