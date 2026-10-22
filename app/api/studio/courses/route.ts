import { NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { getPayloadInstance } from '../../../../lib/payload';
import { ROLES } from '../../../../lib/constants';

interface CourseDoc {
  id: string | number;
  title: string | { hu?: string; en?: string; ro?: string };
  slug: string;
  summary?: string | { hu?: string; en?: string; ro?: string };
  difficulty?: string;
  estimatedMinutes?: number;
  visibility?: 'public' | 'private';
  isOfficial?: boolean;
  instructor?: number | string | { id: number | string; email?: string; firstName?: string; lastName?: string } | null;
  phases?: Array<unknown>;
  updatedAt?: string;
  createdAt?: string;
}

export async function GET() {
  try {
    const session = await auth();
    const user = session?.user as { id?: string; email?: string; role?: string } | undefined;

    if (!user || (user.role !== ROLES.ADMIN && user.role !== ROLES.EDITOR)) {
      return NextResponse.json({ error: 'Unauthorized: Teacher or Admin access required' }, { status: 401 });
    }

    const payload = await getPayloadInstance();
    const currentUserId = user.id ? String(user.id) : '';

    // Fetch all courses
    const { docs: rawCourses } = await payload.find({
      collection: 'courses',
      limit: 200,
      depth: 1, // Populate instructor
      sort: '-updatedAt',
    });

    const courses = rawCourses as unknown as CourseDoc[];

    // Fetch enrolled counts per course from course-progress
    const { docs: courseProgress } = await payload.find({
      collection: 'course-progress',
      limit: 1000,
      depth: 0,
    });

    const progressList = courseProgress as Array<{ courseId?: string; isCompleted?: boolean }>;
    const statsByCourseId: Record<string, { enrolled: number; completed: number }> = {};

    progressList.forEach((p) => {
      const cid = p.courseId ? String(p.courseId) : '';
      if (!cid) return;
      if (!statsByCourseId[cid]) {
        statsByCourseId[cid] = { enrolled: 0, completed: 0 };
      }
      statsByCourseId[cid].enrolled += 1;
      if (p.isCompleted) {
        statsByCourseId[cid].completed += 1;
      }
    });

    const formatCourse = (c: CourseDoc) => {
      const instructorObj = typeof c.instructor === 'object' && c.instructor ? c.instructor : null;
      const instructorId = instructorObj ? String(instructorObj.id) : (c.instructor ? String(c.instructor) : null);
      const instructorName = instructorObj?.firstName
        ? `${instructorObj.firstName} ${instructorObj.lastName || ''}`.trim()
        : (instructorObj?.email || 'AlgoRythmics Tanár');

      const cId = String(c.id);
      const stats = statsByCourseId[c.slug] || statsByCourseId[cId] || { enrolled: 0, completed: 0 };

      // Localized or string title
      const title = typeof c.title === 'object' && c.title !== null
        ? (c.title.hu || c.title.en || c.title.ro || 'Névtelen kurzus')
        : String(c.title || 'Névtelen kurzus');

      const summary = typeof c.summary === 'object' && c.summary !== null
        ? (c.summary.hu || c.summary.en || c.summary.ro || '')
        : String(c.summary || '');

      return {
        id: c.id,
        slug: c.slug,
        title,
        summary,
        difficulty: c.difficulty || 'Beginner',
        estimatedMinutes: c.estimatedMinutes || 20,
        phasesCount: Array.isArray(c.phases) ? c.phases.length : 0,
        visibility: c.visibility || 'public',
        isOfficial: Boolean(c.isOfficial),
        instructorId,
        instructorName,
        enrolledCount: stats.enrolled,
        completedCount: stats.completed,
        updatedAt: c.updatedAt,
      };
    };

    const formatted = courses.map(formatCourse);

    // Filter into My Courses and Community Courses
    const myCourses = formatted.filter((c) => {
      if (user.role === ROLES.ADMIN) {
        // For admin, myCourses are either created by admin or official templates
        return c.instructorId === currentUserId || c.isOfficial;
      }
      return c.instructorId === currentUserId;
    });

    const communityCourses = formatted.filter((c) => {
      // Public courses from other instructors or official
      return c.visibility === 'public' && c.instructorId !== currentUserId;
    });

    return NextResponse.json({
      myCourses,
      communityCourses,
      allCourses: user.role === ROLES.ADMIN ? formatted : undefined,
      currentUser: {
        id: currentUserId,
        role: user.role,
        email: user.email,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { buildPayloadCourseData } from '../../../../lib/courses/studioHelper';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const user = session?.user as { id?: string; email?: string; role?: string } | undefined;

    if (!user || (user.role !== ROLES.ADMIN && user.role !== ROLES.EDITOR)) {
      return NextResponse.json({ error: 'Unauthorized: Teacher or Admin access required' }, { status: 401 });
    }

    const payload = await getPayloadInstance();
    const body = await req.json();

    const {
      title,
      slug,
      summary,
      heroTagline,
      difficulty = 'Beginner',
      estimatedMinutes = 20,
      visibility = 'public',
      isOfficial = false,
      phases = [],
      mascot,
      accentColor = '#269984',
      icon = '📘',
      illustrationAsset,
    } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: 'A cím és az azonosító (slug) megadása kötelező!' }, { status: 400 });
    }

    // Generate unique slug if collision
    const existing = await payload.find({
      collection: 'courses',
      where: { slug: { equals: slug } },
      limit: 1,
    });

    let finalSlug = String(slug).trim();
    if (existing.docs.length > 0) {
      finalSlug = `${finalSlug}-${Date.now().toString(36)}`;
    }

    const instructorId = user.id ? (isNaN(Number(user.id)) ? user.id : Number(user.id)) : undefined;

    const courseData = buildPayloadCourseData({
      title,
      slug: finalSlug,
      summary,
      heroTagline,
      difficulty,
      estimatedMinutes,
      visibility,
      isOfficial: user.role === ROLES.ADMIN ? Boolean(isOfficial) : false,
      instructor: instructorId,
      phases,
      mascot,
      accentColor,
      icon,
      illustrationAsset,
    });

    console.log(`[Studio Courses] Creating new course "${finalSlug}" for instructor ${instructorId}...`);

    const newCourse = await payload.create({
      collection: 'courses',
      data: courseData as any,
      locale: 'all' as 'hu',
    });

    console.log(`[Studio Courses] Course created successfully with ID: ${newCourse.id}`);
    return NextResponse.json({ success: true, course: newCourse }, { status: 201 });
  } catch (error) {
    console.error('[Studio Courses Create Error]:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

