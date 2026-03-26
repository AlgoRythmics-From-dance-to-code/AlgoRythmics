import en from '../locales/en.json';
import hu from '../locales/hu.json';
import ro from '../locales/ro.json';
import { cookies, headers } from 'next/headers';

export type Locale = 'en' | 'hu' | 'ro';

const translations: Record<Locale, any> = { en, hu, ro };

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
      if (acceptLanguage.includes('hu')) return 'hu';
      if (acceptLanguage.includes('ro')) return 'ro';
    }
  } catch (e) {
    // next/headers might throw if called outside of request scope
  }

  return 'en';
}

export async function getT() {
  const locale = await getServerLocale();
  const dict = translations[locale];

  return (path: string, vars?: Record<string, string | number>) => {
    const parts = path.split('.');
    let current = dict;
    
    for (const p of parts) {
      if (current && typeof current === 'object' && p in current) {
        current = current[p];
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
  };
}

/**
 * Universal translator for logs or places where async is not possible
 * Defaults to English or a specified locale
 */
export function getStaticT(locale: Locale = 'en') {
  const dict = translations[locale];
  return (path: string, vars?: Record<string, string | number>) => {
    const parts = path.split('.');
    let current = dict;
    for (const p of parts) {
      if (current && typeof current === 'object' && p in current) {
        current = current[p];
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
  };
}
