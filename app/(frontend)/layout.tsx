import { cookies } from 'next/headers';
import ThemeProviderClient from '../components/ThemeProviderClient';
import LocaleProvider from '../i18n/LocaleProvider';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import { Montserrat } from 'next/font/google';
import '../globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import axios from 'axios';

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
  const token = (await cookies()).get('payload-token')?.value;
  
  // Use image from session if available, otherwise fallback to Payload ME API
  let userImage: string | null = (session?.user as any)?.imageUrl || (session?.user as any)?.image || null;

  if (!userImage && token) {
    try {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/api/users/me`,
        {
          headers: {
            Authorization: `JWT ${token}`,
          },
        },
      );
      if (data?.user) {
        userImage = data.user.imageUrl || null;
      }
    } catch (e) {
      logger.error({ error: e instanceof Error ? e.message : e }, 'Layout auth check failed');
    }
  }

  const isAuthenticated = !!token || !!session;

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
