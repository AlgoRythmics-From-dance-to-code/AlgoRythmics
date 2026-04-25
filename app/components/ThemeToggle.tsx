'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useLocale } from '../i18n/LocaleProvider';
import { useGlobalAnalytics } from '../hooks/useGlobalAnalytics';

export default function ThemeToggle() {
  const { t } = useLocale();
  const { theme, setTheme } = useTheme();
  const { trackGlobalEvent } = useGlobalAnalytics();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Avoid hydration mismatch
  }

  return (
    <button
      onClick={() => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        trackGlobalEvent('theme_switched', { to: nextTheme });
      }}
      className="p-2 rounded-md hover:bg-white/10 transition-colors"
      aria-label={t('visualizer.controls.toggle_dark_mode')}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-white" />
      )}
    </button>
  );
}
