import { NextRequest, NextResponse } from 'next/server';
import { getPayloadInstance } from '../../../../../lib/payload';
import {
  courseBlueprints,
  findCourseBySlug,
  normalizeCourse,
} from '../../../../../lib/courses/courseCatalog';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; courseSlug: string }> },
) {
  try {
    const { userId: userIdStr, courseSlug } = await params;
    const userId = parseInt(userIdStr, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Érvénytelen felhasználói azonosító' }, { status: 400 });
    }

    const payload = await getPayloadInstance();

    // 1. Fetch User (public display name only — do not expose email)
    let userName = `Tanuló #${userId}`;
    let userCompletedCourses: Array<number | string | { id?: number | string; slug?: string }> = [];
    let courseDocId: number | string | null = null;

    try {
      const user = await payload.findByID({
        collection: 'users',
        id: userId,
        depth: 0,
        overrideAccess: true,
      });

      if (!user) {
        return NextResponse.json({ error: 'A felhasználó nem található' }, { status: 404 });
      }

      userCompletedCourses = (user.completedCourses || []) as Array<
        number | string | { id?: number | string; slug?: string }
      >;

      if (user.firstName || user.lastName) {
        userName = `${user.lastName || ''} ${user.firstName || ''}`.trim();
      } else if (user.email) {
        userName = user.email.split('@')[0];
      }
    } catch {
      return NextResponse.json({ error: 'A felhasználó nem található' }, { status: 404 });
    }

    // 2. Fetch Course Details
    let courseTitle = courseSlug.replace(/[-_]+/g, ' ').toUpperCase();
    let courseSummary = '';
    let accentColor = '#269984';
    let courseExists = false;

    try {
      const courseDocs = await payload.find({
        collection: 'courses',
        where: { slug: { equals: courseSlug } },
        depth: 0,
        limit: 1,
        overrideAccess: true,
      });

      if (courseDocs.docs.length > 0) {
        courseExists = true;
        courseDocId = courseDocs.docs[0].id;
        const normalized = normalizeCourse(
          courseDocs.docs[0] as unknown as Record<string, unknown>,
        );
        courseTitle = normalized.title;
        courseSummary = normalized.summary;
        accentColor = normalized.accentColor || '#269984';
      } else {
        const blueprint = findCourseBySlug(courseSlug, courseBlueprints);
        if (blueprint) {
          courseExists = true;
          courseTitle = blueprint.title;
          courseSummary = blueprint.summary;
          accentColor = blueprint.accentColor || '#269984';
        }
      }
    } catch {
      // Fall back to check
    }

    if (!courseExists) {
      return NextResponse.json({ error: 'A kurzus nem található' }, { status: 404 });
    }

    // 3. Fetch Course Progress & Verify Completion
    let isCompleted = false;
    let completedAt: string | null = null;
    let points = 0;

    try {
      const progressDocs = await payload.find({
        collection: 'course-progress',
        where: {
          and: [{ user: { equals: userId } }, { courseId: { equals: courseSlug } }],
        },
        depth: 0,
        limit: 1,
        overrideAccess: true,
      });

      if (progressDocs.docs.length > 0) {
        const prog = progressDocs.docs[0] as unknown as {
          isCompleted?: boolean;
          updatedAt?: string;
          lastActivityAt?: string;
          points?: number;
        };
        isCompleted = prog.isCompleted === true;
        completedAt = prog.updatedAt || prog.lastActivityAt || null;
        points = prog.points || 0;
      }
    } catch {
      // No progress record found
    }

    // Fallback check in user.completedCourses if courseDocId is present
    if (!isCompleted && courseDocId !== null && Array.isArray(userCompletedCourses)) {
      isCompleted = userCompletedCourses.some((item) => {
        if (typeof item === 'object' && item !== null) {
          return String(item.id) === String(courseDocId) || item.slug === courseSlug;
        }
        return String(item) === String(courseDocId);
      });
    }

    if (!isCompleted) {
      return NextResponse.json(
        { error: 'A keresett tanúsítvány nem található, mert a kurzus még nincs teljesítve' },
        { status: 404 },
      );
    }

    // Generate unique verification ID
    const certificateId = `ALG-CERT-${userId}-${courseSlug.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;

    return NextResponse.json({
      success: true,
      userId,
      userName,
      courseSlug,
      courseTitle,
      courseSummary,
      isCompleted: true,
      completedAt: completedAt || new Date().toISOString(),
      points,
      certificateId,
      accentColor,
    });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    return NextResponse.json({ error: 'Hiba történt a tanúsítvány lekérésekor' }, { status: 500 });
  }
}
