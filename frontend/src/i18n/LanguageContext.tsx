import { useState, useCallback, type ReactNode } from 'react';
import { translations, type Language, type TranslationKey } from './translations';
import { LanguageContext } from './language-context';

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Try to get saved language from localStorage, default to 'en'
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('agriplan-language') as Language;
      if (saved && (saved === 'en' || saved === 'hi')) {
        return saved;
      }
    }
    return 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('agriplan-language', lang);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    const newLang = language === 'en' ? 'hi' : 'en';
    setLanguage(newLang);
  }, [language, setLanguage]);

  const t = useCallback(
    (key: TranslationKey): string => {
      const translation = translations[language][key];
      if (!translation) {
        console.warn(`Translation missing for key: ${key} in language: ${language}`);
        // Fallback to English
        return translations.en[key] || key;
      }
      return translation;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
