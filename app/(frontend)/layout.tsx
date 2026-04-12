import { Montserrat } from 'next/font/google';
import '../globals.css';
import { Toaster } from 'sonner';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import { auth } from '../../auth';
import ThemeProviderClient from '../components/ThemeProviderClient';
import NextAuthProvider from '../components/NextAuthProvider';
import React from 'react';

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
});

export default async function FrontendRootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html suppressHydrationWarning>
      <body
        className={`${montserrat.variable} antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <NextAuthProvider session={session}>
          <ThemeProviderClient>
            {children}
            <Toaster position="bottom-left" richColors />
          </ThemeProviderClient>
        </NextAuthProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
