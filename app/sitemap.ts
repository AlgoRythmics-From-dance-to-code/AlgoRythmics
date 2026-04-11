import { MetadataRoute } from 'next';
import { getPayloadInstance } from '../lib/payload';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://algorythmics.com';

  // Base routes
  const routes = ['', '/courses', '/algorithms', '/videos', '/about', '/contact'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic Algorithms
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

  const algorithmRoutes = algorithmIds.map((id) => ({
    url: `${baseUrl}/algorithms/${id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Dynamic Courses from Payload
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

    courseRoutes = result.docs.map((doc: { slug: string; updatedAt: string }) => ({
      url: `${baseUrl}/courses/${doc.slug}`,
      lastModified: new Date(doc.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    }));
  } catch (err) {
    console.error('Sitemap course fetch error:', err);
  }

  return [...routes, ...algorithmRoutes, ...courseRoutes];
}
