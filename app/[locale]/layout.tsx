import LocaleProvider from '../i18n/LocaleProvider';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { auth } from '../../auth';
import UserProgressSync from '../components/Learning/UserProgressSync';

import { Locale } from '../i18n/LocaleProvider';

export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'hu' }, { locale: 'ro' }];
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (['en', 'hu', 'ro'].includes(rawLocale) ? rawLocale : 'hu') as Locale;

  const locales = {
    en: (await import('../../locales/en.json')).default,
    hu: (await import('../../locales/hu.json')).default,
    ro: (await import('../../locales/ro.json')).default,
  };
  const t = locales[locale].seo;

  return {
    title: {
      default: t.title,
      template: `%s | ${t.title}`,
    },
    description: t.description,
    keywords: t.keywords,
    metadataBase: new URL('https://algorythmics.com'),
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
  };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default async function FrontendLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = (['en', 'hu', 'ro'].includes(rawLocale) ? rawLocale : 'hu') as Locale;
  const session = await auth();

  // Use image from session if available
  const user = session?.user as { imageUrl?: string; image?: string | null } | undefined;
  const userImage = user?.imageUrl || user?.image || null;

  const isAuthenticated = !!session;

  return (
    <LocaleProvider initialLocale={locale}>
      <UserProgressSync />
      <Header isAuthenticated={isAuthenticated} userImage={userImage} />
      <main className="flex-1 pt-[var(--header-height)]">{children}</main>
      <Footer />
    </LocaleProvider>
  );
}
