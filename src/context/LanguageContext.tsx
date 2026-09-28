import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import type { Language, TranslationSchema } from '../translations/types';
import { translations } from '../translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationSchema;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
}

const STORAGE_KEY = 'onion_iq_language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'bn' || saved === 'hi') {
      return saved;
    }
    return 'en';
  });

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore storage error
    }
  };

  const t = useMemo(() => {
    return translations[language] || translations.en;
  }, [language]);

  // Synchronize document attributes when language changes
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = `${t.common.appName} - ${t.common.tagline}`;
  }, [language, t]);

  // Text-To-Speech helper for low-literacy users
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      alert(t.voice.audioNotSupported);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose appropriate locale
    if (language === 'bn') {
      utterance.lang = 'bn-IN';
    } else if (language === 'hi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    utterance.rate = 0.9; // Slightly slower for clear rural comprehension
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        speakText,
        stopSpeaking,
        isSpeaking,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
