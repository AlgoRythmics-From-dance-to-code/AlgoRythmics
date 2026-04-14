import { getCourseCatalog, type CourseCollectionDoc } from '../../../lib/courses/courseCatalog';
import { getPayloadInstance } from '../../../lib/payload';
import { getServerLocale, getT } from '../../../lib/i18n-server';
import CoursesClient from '../../components/Course/CoursesClient';

export const revalidate = 600; // Cache for 10 minutes

export async function generateMetadata() {
  const t = await getT();
  return {
    title: t('nav.courses'),
  };
}

export default async function CoursesPage() {
  const locale = await getServerLocale();
  const t = await getT();

  let docs: CourseCollectionDoc[] = [];
  try {
    const payload = await getPayloadInstance();
    const result = await payload.find({
      collection: 'courses',
      depth: 0,
      limit: 50,
      sort: 'title',
      locale: locale as 'en' | 'hu' | 'ro',
    });
    docs = result.docs as unknown as CourseCollectionDoc[];
  } catch {
    docs = [];
  }

  const courses = await getCourseCatalog(docs);

  return (
    <main className="w-full bg-white px-4 py-10 dark:bg-[#0a0a0a] sm:px-6 md:py-20 lg:py-28">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#f0fbf9] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-[#269984] dark:bg-white/5">
            {t('courses.learning_paths')}
          </div>
          <h1 className="text-4xl font-black text-black dark:text-white sm:text-5xl lg:text-6xl tracking-tight">
            {t('courses.hero_title')}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-medium leading-relaxed text-gray-500 dark:text-gray-400">
            {t('courses.hero_description')}
          </p>
        </div>

        <CoursesClient courses={courses} />
      </div>
    </main>
  );
}
