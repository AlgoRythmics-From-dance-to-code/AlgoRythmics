'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import en from '../../locales/en.json';
import hu from '../../locales/hu.json';
import ro from '../../locales/ro.json';

export type Locale = 'en' | 'hu' | 'ro';

const translations: Record<Locale, unknown> = {
  en: en,
  hu: hu,
  ro: ro,
};

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (path: string, vars?: Record<string, string | number>) => string;
  getRaw: (path: string) => unknown;
}>({
  locale: 'hu',
  setLocale: () => {},
  t: () => '',
  getRaw: () => undefined,
});

export function useLocale() {
  return useContext(LocaleContext);
}

export default function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('hu');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('locale') : null;
    if (saved === 'en' || saved === 'hu' || saved === 'ro') setLocaleState(saved);
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    try {
      localStorage.setItem('locale', l);
      document.cookie = `locale=${l};path=/;max-age=31536000;SameSite=Lax`;
    } catch {}
  }

  function t(path: string, vars?: Record<string, string | number>) {
    const current = getRaw(path);
    if (current === undefined) return path;
    let s = String(current);
    if (vars) {
      for (const k of Object.keys(vars)) {
        s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]));
      }
    }
    return s;
  }

  function getRaw(path: string): unknown {
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
    return current;
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, getRaw }}>
      {children}
    </LocaleContext.Provider>
  );
}
