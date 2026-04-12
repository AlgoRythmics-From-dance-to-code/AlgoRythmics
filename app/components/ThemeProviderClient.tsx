'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import React from 'react';

/**
 * Client-side theme provider wrapper.
 * Handles the theme switching logic and prevents Flash of Unstyled Content (FOUC).
 */
export default function ThemeProviderClient({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={true}
      disableTransitionOnChange
      // For compatibility with React 19 / Next.js 15+
      enableColorScheme={false}
    >
      {children}
    </NextThemesProvider>
  );
}
