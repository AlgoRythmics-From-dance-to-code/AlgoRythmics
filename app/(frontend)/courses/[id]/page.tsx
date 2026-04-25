import { notFound } from 'next/navigation';

import CoursePlayer from '../../../components/Course/CoursePlayer';
import { getPayloadInstance } from '../../../../lib/payload';
import {
  findCourseBySlug,
  getCourseCatalog,
  type CourseCollectionDoc,
} from '../../../../lib/courses/courseCatalog';
import { getServerLocale } from '../../../../lib/i18n-server';

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getServerLocale();

  let docs: CourseCollectionDoc[] = [];
  try {
    const payload = await getPayloadInstance();
    const result = await payload.find({
      collection: 'courses',
      depth: 0,
      limit: 50,
      sort: 'title',
      locale: locale as 'all' | 'en' | 'hu' | 'ro',
    });
    docs = result.docs as unknown as CourseCollectionDoc[];
  } catch {
    docs = [];
  }

  const catalog = await getCourseCatalog(docs);
  const matchedCourse = catalog.find((course) => course.slug === id);

  if (!matchedCourse) {
    notFound();
  }

  const course = findCourseBySlug(id, docs);

  if (!course) {
    notFound();
  }

  return (
    <main className="relative min-h-screen w-full bg-[#fdfdfd] dark:bg-[#080808] overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[30%] rounded-full bg-[#269984]/5 blur-[120px]" />
        <div className="absolute bottom-[20%] left-[-10%] w-[30%] h-[40%] rounded-full bg-[#269984]/3 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-[1500px] px-0 py-0 sm:px-4 lg:pt-6 lg:pb-12">
        <CoursePlayer course={course} />
      </div>
    </main>
  );
}
