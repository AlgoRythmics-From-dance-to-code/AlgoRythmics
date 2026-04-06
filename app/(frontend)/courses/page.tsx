import { cookies } from 'next/headers';
import Link from 'next/link';

import { getCourseCatalog, type CourseCollectionDoc } from '../../../lib/courses/courseCatalog';
import { getPayloadInstance } from '../../../lib/payload';
import { getT, getServerLocale } from '../../../lib/i18n-server';

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
      locale: locale as any,
    });
    docs = result.docs as unknown as CourseCollectionDoc[];
  } catch {
    docs = [];
  }

  const courses = await getCourseCatalog(docs);

  return (
    <main className="w-full bg-white px-4 py-10 dark:bg-[#0a0a0a] sm:px-6 md:py-14">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white sm:text-4xl">
            {t('courses.hero_title')}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#666] dark:text-gray-400">
            {t('courses.hero_description')}
          </p>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="grid grid-cols-[1.2fr_1fr_0.55fr_0.55fr_0.35fr] gap-4 border-b border-gray-100 px-5 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:border-white/10">
            <div>{t('courses.table.name')}</div>
            <div>{t('features.summary') || 'Summary'}</div>
            <div>{t('courses.table.duration')}</div>
            <div>{t('courses.table.level')}</div>
            <div>{t('features.open') || 'Open'}</div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-white/10">
            {courses.map((course) => (
              <Link
                key={course.slug}
                href={`/courses/${course.slug}`}
                className="grid grid-cols-1 gap-4 px-5 py-5 transition-colors hover:bg-[#fafafa] dark:hover:bg-white/5 md:grid-cols-[1.2fr_1fr_0.55fr_0.55fr_0.35fr] md:items-center"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-sm"
                    style={{
                      backgroundColor: `${course.accentColor}18`,
                      color: course.accentColor,
                    }}
                  >
                    {course.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-lg font-bold text-black dark:text-white">
                      {course.title}
                    </div>
                    <div className="mt-1 truncate text-xs font-bold uppercase tracking-[0.18em] text-[#269984]">
                      {course.mascot.name} · {course.phases.length} {t('courses.checkpoints')}
                    </div>
                  </div>
                </div>

                <div className="text-sm leading-7 text-[#666] dark:text-gray-300">
                  {course.summary}
                </div>

                <div className="text-sm font-bold text-black dark:text-white">
                  ~{course.estimatedMinutes} min
                </div>

                <div className="inline-flex w-fit rounded-full border border-[#269984]/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#269984]">
                  {course.difficulty}
                </div>

                <div className="flex items-center gap-2 text-sm font-bold text-[#269984] md:justify-end">
                  <span>{t('courses.open')}</span>
                  <span className="transition-transform hover:translate-x-1">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
