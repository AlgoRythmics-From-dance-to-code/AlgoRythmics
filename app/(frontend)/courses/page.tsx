import { getCourseCatalog, type CourseCollectionDoc } from '../../../lib/courses/courseCatalog';
import { getPayloadInstance } from '../../../lib/payload';
import { getServerLocale, getT } from '../../../lib/i18n-server';
import CoursesClient from '../../components/Course/CoursesClient';

import { unstable_cache } from 'next/cache';

export const revalidate = 3600; // Cache for 1 hour

export async function generateMetadata() {
  const t = await getT();
  return {
    title: t('nav.courses'),
  };
}

// Cached fetcher for courses
const getCachedCourses = unstable_cache(
  async (locale: string) => {
    const payload = await getPayloadInstance();
    if (!payload) return [];

    const result = await payload.find({
      collection: 'courses',
      depth: 0,
      limit: 100,
      sort: 'title',
      locale: locale as 'en' | 'hu' | 'ro',
      overrideAccess: true, // Bypass access control for background caching
    });

    // Crucial: unstable_cache works best with plain JSON-serializable objects
    return JSON.parse(JSON.stringify(result.docs)) as CourseCollectionDoc[];
  },
  ['courses-list-cache'],
  { revalidate: 3600, tags: ['courses'] },
);

export default async function CoursesPage() {
  const locale = await getServerLocale();
  const t = await getT();

  const docs = await getCachedCourses(locale);
  const courses = await getCourseCatalog(docs);

  return (
    <main className="w-full bg-[#fcfdfd] dark:bg-[#080808] py-8 sm:py-12 md:py-16">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <CoursesClient
          courses={courses}
          title={t('courses.hero_title')}
          description={t('courses.hero_description')}
        />
      </div>
    </main>
  );
}
