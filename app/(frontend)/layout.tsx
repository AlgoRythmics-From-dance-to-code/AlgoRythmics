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
import PWAInstallPrompt from '../components/PWAInstallPrompt';

import { cookies } from 'next/headers';

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
});

export async function generateMetadata() {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get('locale')?.value || 'hu';
  const locale = ['en', 'hu', 'ro'].includes(rawLocale) ? rawLocale : 'hu';

  const locales = {
    en: (await import('../../locales/en.json')).default,
    hu: (await import('../../locales/hu.json')).default,
    ro: (await import('../../locales/ro.json')).default,
  };
  const t = locales[locale as keyof typeof locales].seo;

  return {
    title: {
      default: t.title,
      template: `%s | ${t.title}`,
    },
    description: t.description,
    keywords: t.keywords,
    metadataBase: new URL('https://algorythmics.com'), // Replace with actual URL if known,
    openGraph: {
      title: t.title,
      description: t.description,
      siteName: 'AlgoRythmics',
      locale: locale,
      type: 'website',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: t.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t.title,
      description: t.description,
      images: ['/og-image.png'],
    },
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'AlgoRythmics',
    },
    formatDetection: {
      telephone: false,
    },
  };
}

export const viewport = {
  themeColor: '#269984',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

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
              <Toaster position="bottom-left" richColors />
              <PWAInstallPrompt />
            </LocaleProvider>
          </ThemeProviderClient>
        </NextAuthProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
