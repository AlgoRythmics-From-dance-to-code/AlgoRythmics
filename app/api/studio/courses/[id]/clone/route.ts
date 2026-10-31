import { NextResponse } from 'next/server';
import { auth } from '../../../../../../auth';
import { getPayloadInstance } from '../../../../../../lib/payload';
import { ROLES } from '../../../../../../lib/constants';

interface OriginalCourse {
  title?: string | { hu?: string; en?: string; ro?: string };
  slug?: string;
  summary?: string | { hu?: string; en?: string; ro?: string };
  difficulty?: string;
  estimatedMinutes?: number;
  phases?: unknown[];
  mascot?: unknown;
  accentColor?: string;
  icon?: string;
  illustrationAsset?: string;
}

import { buildPayloadCourseData } from '../../../../../../lib/courses/studioHelper';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const user = session?.user as { id?: string; email?: string; role?: string } | undefined;

    if (!user || (user.role !== ROLES.ADMIN && user.role !== ROLES.EDITOR)) {
      return NextResponse.json({ error: 'Unauthorized: Teacher or Admin access required' }, { status: 401 });
    }

    const payload = await getPayloadInstance();
    const original = (await payload.findByID({
      collection: 'courses',
      id,
      depth: 1,
      locale: 'all' as 'hu',
    })) as OriginalCourse;

    if (!original) {
      return NextResponse.json({ error: 'Az eredeti kurzus nem található' }, { status: 404 });
    }

    const currentUserId = user.id ? String(user.id) : '';
    const originalInstructorId = (original as any).instructor
      ? typeof (original as any).instructor === 'object'
        ? String((original as any).instructor.id)
        : String((original as any).instructor)
      : '';
    const isPrivate = (original as any).visibility === 'private';

    if (isPrivate && user.role !== ROLES.ADMIN && originalInstructorId !== currentUserId) {
      return NextResponse.json({ error: 'Nincs jogosultságod más tanár privát kurzusát másolni!' }, { status: 403 });
    }

    // Prepare localized cloned title
    let newTitle: { hu: string; en: string; ro: string };
    if (typeof original.title === 'object' && original.title !== null) {
      newTitle = {
        hu: `(Másolat) ${original.title.hu || 'Kurzus'}`,
        en: `(Copy) ${original.title.en || 'Course'}`,
        ro: `(Copie) ${original.title.ro || 'Curs'}`,
      };
    } else {
      const t = String(original.title || 'Kurzus');
      newTitle = {
        hu: `(Másolat) ${t}`,
        en: `(Copy) ${t}`,
        ro: `(Copie) ${t}`,
      };
    }

    const uniqueSlug = `${original.slug || 'course'}-copy-${Date.now().toString(36)}`;
    const instructorId = user.id ? (isNaN(Number(user.id)) ? user.id : Number(user.id)) : undefined;

    const clonedPayload = buildPayloadCourseData({
      title: newTitle,
      slug: uniqueSlug,
      summary: original.summary || '',
      difficulty: original.difficulty || 'Beginner',
      estimatedMinutes: original.estimatedMinutes || 25,
      visibility: 'private', // Cloned courses default to private workspace
      isOfficial: false,
      instructor: instructorId,
      phases: original.phases || [],
      mascot: original.mascot,
      accentColor: original.accentColor || '#269984',
      icon: original.icon || '📘',
      illustrationAsset: original.illustrationAsset || 'algo_group_109.svg',
    });

    console.log(`[Studio Courses Clone] Cloning course ${id} into new slug "${uniqueSlug}" for teacher ${instructorId}...`);

    const clonedCourse = await payload.create({
      collection: 'courses',
      data: clonedPayload as any,
      locale: 'all' as 'hu',
    });

    console.log(`[Studio Courses Clone] Cloned course created with ID: ${clonedCourse.id}`);
    return NextResponse.json({ success: true, course: clonedCourse }, { status: 201 });
  } catch (error) {
    console.error('[Studio Courses Clone Error]:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

