"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language } from '@/lib/i18n/translations';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tName: (obj: { name?: string; nameMr?: string | null } | null | undefined) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // Load saved language from localStorage on mount
    const savedLang = localStorage.getItem('posLanguage') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'mr')) {
      setLanguage(savedLang);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('posLanguage', lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  const tName = (obj: { name?: string; nameMr?: string | null } | null | undefined): string => {
    if (!obj) return '';
    if (language === 'mr' && obj.nameMr && obj.nameMr.trim() !== '') {
      return obj.nameMr;
    }
    return obj.name || '';
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t, tName }}>
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
