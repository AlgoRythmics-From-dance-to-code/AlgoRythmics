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

    // 1. Fetch User (public display name)
    let userName = `Tanuló #${userId}`;
    let userEmail = '';

    try {
      const user = await payload.findByID({
        collection: 'users',
        id: userId,
        depth: 0,
        overrideAccess: true,
      });

      if (user) {
        userEmail = user.email || '';
        if (user.firstName || user.lastName) {
          userName = `${user.lastName || ''} ${user.firstName || ''}`.trim();
        } else if (user.email) {
          userName = user.email.split('@')[0];
        }
      }
    } catch {
      // User not found in DB
      return NextResponse.json({ error: 'A felhasználó nem található' }, { status: 404 });
    }

    // 2. Fetch Course Details
    let courseTitle = courseSlug.replace(/[-_]+/g, ' ').toUpperCase();
    let courseSummary = '';
    let accentColor = '#269984';

    try {
      const courseDocs = await payload.find({
        collection: 'courses',
        where: { slug: { equals: courseSlug } },
        depth: 0,
        limit: 1,
        overrideAccess: true,
      });

      if (courseDocs.docs.length > 0) {
        const normalized = normalizeCourse(
          courseDocs.docs[0] as unknown as Record<string, unknown>,
        );
        courseTitle = normalized.title;
        courseSummary = normalized.summary;
        accentColor = normalized.accentColor || '#269984';
      } else {
        const blueprint = findCourseBySlug(courseSlug, courseBlueprints);
        if (blueprint) {
          courseTitle = blueprint.title;
          courseSummary = blueprint.summary;
          accentColor = blueprint.accentColor || '#269984';
        }
      }
    } catch {
      // Fall back to humanized slug
    }

    // 3. Fetch Course Progress
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
        isCompleted = prog.isCompleted ?? false;
        completedAt = prog.updatedAt || prog.lastActivityAt || new Date().toISOString();
        points = prog.points || 0;
      }
    } catch {
      // No progress record found
    }

    // Generate unique verification ID
    const certificateId = `ALG-CERT-${userId}-${courseSlug.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;

    return NextResponse.json({
      success: true,
      userId,
      userName,
      userEmail,
      courseSlug,
      courseTitle,
      courseSummary,
      isCompleted,
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
