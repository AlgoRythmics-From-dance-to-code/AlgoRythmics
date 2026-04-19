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
