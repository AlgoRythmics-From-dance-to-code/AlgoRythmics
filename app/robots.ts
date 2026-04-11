import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/profil', '/login', '/register', '/api', '/admin'],
    },
    sitemap: 'https://algorythmics.com/sitemap.xml',
  };
}
