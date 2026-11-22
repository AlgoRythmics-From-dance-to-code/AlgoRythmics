import en from '../locales/en.json';
import hu from '../locales/hu.json';
import ro from '../locales/ro.json';
import { cookies, headers } from 'next/headers';

export type Locale = 'en' | 'hu' | 'ro';

type TranslationDict = { [key: string]: string | TranslationDict };
const translations: Record<Locale, TranslationDict> = {
  en: en as unknown as TranslationDict,
  hu: hu as unknown as TranslationDict,
  ro: ro as unknown as TranslationDict,
};

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createTranslator(dict: TranslationDict) {
  return (path: string, vars?: Record<string, string | number>) => {
    const parts = path.split('.');
    let current: unknown = dict;

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
        s = s.replace(new RegExp(`\\{${escapeRegExp(k)}\\}`, 'g'), () => String(vars[k]));
      }
    }
    return s;
  };
}

export async function getServerLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const locale = cookieStore.get('locale')?.value;
    if (locale === 'en' || locale === 'hu' || locale === 'ro') {
      return locale as Locale;
    }

    const head = await headers();
    const acceptLanguage = head.get('accept-language');
    if (acceptLanguage) {
      const parsed = acceptLanguage
        .split(',')
        .map((part) => {
          const [tagPart, ...params] = part.trim().toLowerCase().split(';');
          const base = tagPart.split('-')[0];
          const qParam = params.find((p) => p.trim().startsWith('q='));
          const q = qParam ? parseFloat(qParam.trim().slice(2)) : 1;
          return { base, q: Number.isFinite(q) ? q : 0 };
        })
        .filter((entry) => entry.base === 'en' || entry.base === 'hu' || entry.base === 'ro')
        .sort((a, b) => b.q - a.q);

      if (parsed.length > 0) {
        return parsed[0].base as Locale;
      }
    }
  } catch {
    // next/headers might throw if called outside of request scope
  }

  return 'hu';
}

export async function getT() {
  const locale = await getServerLocale();
  return createTranslator(translations[locale]);
}

/**
 * Universal translator for logs or places where async is not possible
 * Defaults to English or a specified locale
 */
export function getStaticT(locale: Locale = 'en') {
  return createTranslator(translations[locale]);
}
