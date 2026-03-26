import { cookies } from 'next/headers';
import ThemeProviderClient from '../components/ThemeProviderClient';
import LocaleProvider from '../i18n/LocaleProvider';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import { Montserrat } from 'next/font/google';
import '../globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

import { auth } from '../../auth';
import NextAuthProvider from '../components/NextAuthProvider';
import logger from '../../lib/logger';
import { Toaster } from 'sonner';

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
});

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Use image from session if available
  const userImage: string | null =
    (session?.user as any)?.imageUrl || (session?.user as any)?.image || null;

  const isAuthenticated = !!session;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${montserrat.variable} antialiased min-h-screen flex flex-col`}>
        <NextAuthProvider>
          <ThemeProviderClient>
            <LocaleProvider>
              <Header isAuthenticated={isAuthenticated} userImage={userImage} />
              <main className="flex-1 pt-[var(--header-height)]">{children}</main>
              <Footer />
            </LocaleProvider>
          </ThemeProviderClient>
        </NextAuthProvider>
        <SpeedInsights />
        <Analytics />
        <Toaster position="bottom-left" richColors />
      </body>
    </html>
  );
}
