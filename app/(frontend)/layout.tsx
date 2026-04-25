import ThemeProviderClient from '../components/ThemeProviderClient';
import LocaleProvider from '../i18n/LocaleProvider';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import { Montserrat } from 'next/font/google';
import '../globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

import NextAuthProvider from '../components/NextAuthProvider';
import { Toaster } from 'sonner';
import UserProgressSync from '../components/Learning/UserProgressSync';
import PWAInstallPrompt from '../components/PWAInstallPrompt';
import HtmlLangSync from '../components/HtmlLangSync';
import { auth } from '../../auth';
import { cookies } from 'next/headers';
import { Locale } from '../i18n/LocaleProvider';

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'AlgoRythmics - From Dance to Code',
    template: '%s | AlgoRythmics',
  },
  description:
    'Learn algorithms through dance and interactive visualizations. AlgoRythmics makes computer science accessible and fun.',
  keywords: 'algorithms, sorting, computer science, dance, education, coding, visualizer',
  metadataBase: new URL('https://algorythmics.com'),
  openGraph: {
    title: 'AlgoRythmics - From Dance to Code',
    description:
      'Learn algorithms through dance and interactive visualizations. AlgoRythmics makes computer science accessible and fun.',
    siteName: 'AlgoRythmics',
    locale: 'hu',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AlgoRythmics - From Dance to Code',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AlgoRythmics - From Dance to Code',
    description:
      'Learn algorithms through dance and interactive visualizations. AlgoRythmics makes computer science accessible and fun.',
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

export const viewport = {
  themeColor: '#269984',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const locale = (cookieStore.get('locale')?.value as Locale) || 'hu';

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${montserrat.variable} antialiased min-h-screen flex flex-col`}>
        <NextAuthProvider session={session}>
          <ThemeProviderClient>
            <LocaleProvider initialLocale={locale}>
              <HtmlLangSync />
              <UserProgressSync />
              <Header />
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
