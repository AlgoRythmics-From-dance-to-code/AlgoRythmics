import { getCourseCatalog, type CourseCollectionDoc } from '../../../lib/courses/courseCatalog';
import { getPayloadInstance } from '../../../lib/payload';
import { getServerLocale, getT } from '../../../lib/i18n-server';
import CoursesClient from '../../components/Course/CoursesClient';
import { auth } from '../../../auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getT();
  return {
    title: t('nav.courses'),
  };
}

async function getFreshCourses(locale: string): Promise<CourseCollectionDoc[]> {
  const payload = await getPayloadInstance();
  if (!payload) return [];

  const result = await payload.find({
    collection: 'courses',
    depth: 0,
    limit: 100,
    sort: 'title',
    locale: locale as 'en' | 'hu' | 'ro',
    overrideAccess: true, // Show all accessible courses
  });

  return JSON.parse(JSON.stringify(result.docs)) as CourseCollectionDoc[];
}

export default async function CoursesPage() {
  const session = await auth();
  if (!session) {
    redirect('/login?reason=login_required');
  }

  const locale = await getServerLocale();
  const t = await getT();

  const docs = await getFreshCourses(locale);
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
