import { auth } from '../../../../auth';
import { getPayloadInstance } from '../../../../lib/payload';
import { NextResponse } from 'next/server';

/**
 * GET /api/analytics/course-progress?courseId=bubble-sort-course
 * Returns the CourseProgress record for the authenticated user.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');

  if (!courseId) {
    return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
  }

  try {
    const payload = await getPayloadInstance();
    const userId = Number(session.user.id);

    const { docs } = await payload.find({
      collection: 'course-progress',
      where: {
        and: [{ user: { equals: userId } }, { courseId: { equals: courseId } }],
      },
      limit: 1,
      depth: 0,
    });

    if (docs.length === 0) {
      return NextResponse.json({ progress: null });
    }

    return NextResponse.json({ progress: docs[0] });
  } catch (error) {
    console.error('[Analytics] Failed to get course progress:', error);
    return NextResponse.json({ error: 'Failed to get course progress' }, { status: 500 });
  }
}

/**
 * POST /api/analytics/course-progress
 * Upsert course progress.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { courseId, updates } = await req.json();

    if (!courseId || !updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'courseId and updates object are required' },
        { status: 400 },
      );
    }

    // Ignore identity fields
    delete updates.user;
    delete updates.courseId;

    const payload = await getPayloadInstance();
    const userId = Number(session.user.id);

    // Find existing
    const { docs } = await payload.find({
      collection: 'course-progress',
      where: {
        and: [{ user: { equals: userId } }, { courseId: { equals: courseId } }],
      },
      limit: 1,
      depth: 0,
    });

    const now = new Date().toISOString();

    if (docs.length > 0) {
      await payload.update({
        collection: 'course-progress',
        id: docs[0].id,
        data: {
          ...updates,
          updatedAt: now,
        },
      });
    } else {
      await payload.create({
        collection: 'course-progress',
        data: {
          user: userId,
          courseId,
          ...updates,
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Analytics] Failed to update course progress:', error);
    return NextResponse.json({ error: 'Failed to update course progress' }, { status: 500 });
  }
}
