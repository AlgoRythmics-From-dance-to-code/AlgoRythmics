import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/profil', '/login', '/register', '/api', '/admin'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.algo-rythmics.com'}/sitemap.xml`,
  };
}
