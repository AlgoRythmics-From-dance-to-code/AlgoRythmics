import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/profil',
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/verify',
        '/api',
        '/admin',
        '/admin-statistics',
        '/studio',
        '/certificate',
        '/oklevel',
      ],
    },
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.algo-rythmics.com'}/sitemap.xml`,
  };
}
