import { MetadataRoute } from 'next';
import { getPayloadInstance } from '../lib/payload';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://algorythmics.com';

  const locales = ['en', 'hu', 'ro'];

  // Base routes - localized
  const baseRoutes = ['', '/courses', '/algorithms', '/videos', '/about', '/contact'];
  const routes = locales.flatMap((locale) =>
    baseRoutes.map((route) => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: new Date('2024-04-11'),
      changeFrequency: 'weekly' as const,
      priority: route === '' ? 1 : 0.8,
    })),
  );

  // Dynamic Algorithms - localized
  const algorithmIds = [
    'bubble-sort',
    'insertion-sort',
    'selection-sort',
    'merge-sort',
    'quick-sort',
    'linear-search',
    'binary-search',
    'shell-sort',
    'heap-sort',
    'bogosort',
    'n-queens',
  ];

  const algorithmRoutes = locales.flatMap((locale) =>
    algorithmIds.map((id) => ({
      url: `${baseUrl}/${locale}/algorithms/${id}`,
      lastModified: new Date('2024-04-11'),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  );

  // Dynamic Courses from Payload - localized
  let courseRoutes: MetadataRoute.Sitemap = [];
  try {
    const payload = await getPayloadInstance();
    const result = await payload.find({
      collection: 'courses',
      limit: 100,
      depth: 0,
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    courseRoutes = locales.flatMap((locale) =>
      result.docs.map((doc: { slug: string; updatedAt: string }) => ({
        url: `${baseUrl}/${locale}/courses/${doc.slug}`,
        lastModified: new Date(doc.updatedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.9,
      })),
    );
  } catch (err) {
    console.error('Sitemap course fetch error:', err);
  }

  return [...routes, ...algorithmRoutes, ...courseRoutes];
}
