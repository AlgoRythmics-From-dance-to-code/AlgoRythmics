import Link from 'next/link';
import { notFound } from 'next/navigation';

import CoursePlayer from '../../../components/Course/CoursePlayer';
import { getPayloadInstance } from '../../../../lib/payload';
import {
  findCourseBySlug,
  getCourseCatalog,
  type CourseCollectionDoc,
} from '../../../../lib/courses/courseCatalog';

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let docs: CourseCollectionDoc[] = [];
  try {
    const payload = await getPayloadInstance();
    const result = await payload.find({
      collection: 'courses',
      depth: 0,
      limit: 50,
      sort: 'title',
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

  return (
    <main className="w-full bg-white dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 rounded-full border border-[#269984]/20 bg-white/80 px-4 py-2 text-sm font-bold text-[#269984] shadow-sm backdrop-blur transition-colors hover:bg-[#f0fbf9] dark:bg-black/20 dark:text-white dark:hover:bg-white/5"
        >
          ← Back to courses
        </Link>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 pb-14 sm:px-6 md:pb-16">
        <CoursePlayer course={course} />
      </div>
    </main>
  );
}
