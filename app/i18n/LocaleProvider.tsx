'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import en from '../../locales/en.json';
import hu from '../../locales/hu.json';
import ro from '../../locales/ro.json';

export type Locale = 'en' | 'hu' | 'ro';

type Translations = {
  [key: string]: string | Translations;
};

const translations: Record<Locale, Translations> = {
  en: en as Translations,
  hu: hu as Translations,
  ro: ro as Translations,
};

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (path: string, vars?: Record<string, string | number>) => string;
}>({
  locale: 'en',
  setLocale: () => {},
  t: () => '',
});

export function useLocale() {
  return useContext(LocaleContext);
}

export default function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('locale') : null;
    if (saved === 'en' || saved === 'hu' || saved === 'ro') setLocaleState(saved);
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    try {
      localStorage.setItem('locale', l);
    } catch {}
  }

  function t(path: string, vars?: Record<string, string | number>) {
    const parts = path.split('.');
    let current: unknown = translations[locale] as unknown;
    for (const p of parts) {
      if (current && typeof current === 'object' && p in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[p];
      } else {
        current = undefined;
        break;
      }
    }
    if (current === undefined) return path;
    let s = String(current);
    if (vars) {
      for (const k of Object.keys(vars)) {
        s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]));
      }
    }
    return s;
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
  );
}
