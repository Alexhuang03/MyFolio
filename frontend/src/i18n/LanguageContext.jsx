import React, { createContext, useContext, useState, useCallback } from 'react';
import translations from './translations';

const LanguageContext = createContext();

const STORAGE_KEY = 'myfolio-lang';

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved && translations[saved] ? saved : 'fr';
    } catch {
      return 'fr';
    }
  });

  const switchLanguage = useCallback((newLang) => {
    if (translations[newLang]) {
      setLang(newLang);
      try {
        localStorage.setItem(STORAGE_KEY, newLang);
      } catch {}
    }
  }, []);

  const t = useCallback(
    (key, params = {}) => {
      let str = translations[lang]?.[key] || translations['fr']?.[key] || key;
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      });
      return str;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, switchLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
