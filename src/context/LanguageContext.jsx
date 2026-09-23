import React, { createContext, useContext, useState, useEffect } from 'react';
import ar from '../i18n/ar';
import en from '../i18n/en';

const dictionaries = { ar, en };

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('ma7fath_lang') || 'ar';
  });

  const setLang = (newLang) => {
    setLangState(newLang);
    localStorage.setItem('ma7fath_lang', newLang);
  };

  // Update document direction and lang whenever language changes
  useEffect(() => {
    const isRTL = lang === 'ar';
    document.documentElement.dir  = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.documentElement.style.fontFamily = isRTL
      ? "'Cairo', 'Segoe UI', sans-serif"
      : "'Inter', 'Segoe UI', sans-serif";
  }, [lang]);

  /** Translation helper — returns the string for the current language */
  const t = (key, fallback = key) => {
    return dictionaries[lang]?.[key] ?? fallback;
  };

  const isRTL = lang === 'ar';

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
};
