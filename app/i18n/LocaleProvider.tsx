'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import hu from '../../locales/hu.json';

export type Locale = 'en' | 'hu' | 'ro';

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const loadedDictionaries: Partial<Record<Locale, Record<string, unknown>>> = {
  hu: hu as Record<string, unknown>,
};

async function loadLocaleDictionary(locale: Locale): Promise<Record<string, unknown>> {
  if (loadedDictionaries[locale]) {
    return loadedDictionaries[locale]!;
  }
  if (locale === 'en') {
    const mod = await import('../../locales/en.json');
    loadedDictionaries.en = (mod.default || mod) as Record<string, unknown>;
    return loadedDictionaries.en;
  }
  if (locale === 'ro') {
    const mod = await import('../../locales/ro.json');
    loadedDictionaries.ro = (mod.default || mod) as Record<string, unknown>;
    return loadedDictionaries.ro;
  }
  return hu as Record<string, unknown>;
}

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

export default function LocaleProvider({
  children,
  initialLocale,
  initialDictionary,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
  initialDictionary?: Record<string, unknown>;
}) {
  const startLocale: Locale = initialLocale || 'hu';
  const requestedLocaleRef = useRef<Locale>(startLocale);

  const [locale, setLocaleState] = useState<Locale>(startLocale);
  const [dictionary, setDictionary] = useState<Record<string, unknown>>(
    () => initialDictionary || loadedDictionaries[startLocale] || (hu as Record<string, unknown>),
  );

  useEffect(() => {
    if (initialDictionary && !loadedDictionaries[startLocale]) {
      loadedDictionaries[startLocale] = initialDictionary;
    }
  }, [initialDictionary, startLocale]);

  useEffect(() => {
    if (!initialLocale) {
      try {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('locale') : null;
        if (saved === 'en' || saved === 'hu' || saved === 'ro') {
          requestedLocaleRef.current = saved;
          setLocaleState(saved);
        }
      } catch {}
    }
  }, [initialLocale]);

  useEffect(() => {
    let active = true;
    requestedLocaleRef.current = locale;
    if (loadedDictionaries[locale]) {
      setDictionary(loadedDictionaries[locale]!);
    } else {
      loadLocaleDictionary(locale).then((dict) => {
        if (active && requestedLocaleRef.current === locale) {
          setDictionary(dict);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    requestedLocaleRef.current = l;
    try {
      localStorage.setItem('locale', l);
      document.cookie = `locale=${l};path=/;max-age=31536000;SameSite=Lax`;
    } catch {}
    if (loadedDictionaries[l]) {
      setDictionary(loadedDictionaries[l]!);
      setLocaleState(l);
    } else {
      loadLocaleDictionary(l).then((dict) => {
        if (requestedLocaleRef.current === l) {
          setDictionary(dict);
          setLocaleState(l);
        }
      });
    }
  }, []);

  const getRaw = useCallback(
    (path: string): unknown => {
      const parts = path.split('.');
      let current: unknown = dictionary;
      for (const p of parts) {
        if (current && typeof current === 'object' && p in (current as Record<string, unknown>)) {
          current = (current as Record<string, unknown>)[p];
        } else {
          current = undefined;
          break;
        }
      }
      return current;
    },
    [dictionary],
  );

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) => {
      const current = getRaw(path);
      if (current === undefined) return path;
      let s = String(current);
      if (vars) {
        for (const k of Object.keys(vars)) {
          s = s.replace(new RegExp(`\\{${escapeRegExp(k)}\\}`, 'g'), () => String(vars[k]));
        }
      }
      return s;
    },
    [getRaw],
  );

  const value = useMemo(() => ({ locale, setLocale, t, getRaw }), [locale, setLocale, t, getRaw]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
