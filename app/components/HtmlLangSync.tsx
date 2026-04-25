'use client';

import { useEffect } from 'react';
import { useLocale } from '../i18n/LocaleProvider';

/**
 * Syncs the <html lang> attribute with the client-side locale.
 * This allows the layout to render statically with a default lang,
 * then update it on the client to match the user's preference.
 */
export default function HtmlLangSync() {
  const { locale } = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
