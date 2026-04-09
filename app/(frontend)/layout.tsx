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
import { Toaster } from 'sonner';
import UserProgressSync from '../components/Learning/UserProgressSync';

import { cookies } from 'next/headers';

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
});

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value || 'hu';

  // Use image from session if available
  const user = session?.user as { imageUrl?: string; image?: string | null } | undefined;
  const userImage = user?.imageUrl || user?.image || null;

  const isAuthenticated = !!session;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${montserrat.variable} antialiased min-h-screen flex flex-col`}>
        <NextAuthProvider session={session}>
          <ThemeProviderClient>
            <LocaleProvider>
              <UserProgressSync />
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
