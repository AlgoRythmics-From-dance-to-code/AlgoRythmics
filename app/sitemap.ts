import { MetadataRoute } from 'next';
import { getPayloadInstance } from '../lib/payload';
import { ALGORITHMS, VIDEOS } from '../lib/constants';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.algo-rythmics.com';

  // Publicly accessible base routes (excluding routes that redirect unauthenticated crawlers)
  const routes = ['', '/algorithms', '/videos', '/big-o', '/about', '/contact'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic Algorithms from single source of truth
  const algorithmRoutes = ALGORITHMS.map((algo) => ({
    url: `${baseUrl}/algorithms/${algo.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Dynamic Videos
  const videoRoutes = VIDEOS.map((video) => ({
    url: `${baseUrl}/videos/${video.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Dynamic Public Courses from Payload
  let courseRoutes: MetadataRoute.Sitemap = [];
  try {
    const payload = await getPayloadInstance();
    const result = await payload.find({
      collection: 'courses',
      where: {
        visibility: { not_equals: 'private' },
      },
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

  return [...routes, ...algorithmRoutes, ...videoRoutes, ...courseRoutes];
}
