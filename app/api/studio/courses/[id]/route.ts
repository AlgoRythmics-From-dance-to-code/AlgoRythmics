import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '../../../../../auth';
import { getPayloadInstance } from '../../../../../lib/payload';
import { ROLES } from '../../../../../lib/constants';

import { toLocalized, sanitizePhase, sanitizeMascot } from '../../../../../lib/courses/studioHelper';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const user = session?.user as { id?: string; email?: string; role?: string } | undefined;

    if (!user || (user.role !== ROLES.ADMIN && user.role !== ROLES.EDITOR)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await getPayloadInstance();
    const course = await payload.findByID({
      collection: 'courses',
      id,
      depth: 1,
      locale: 'all' as 'hu',
    });

    if (!course) {
      return NextResponse.json({ error: 'Kurzus nem található' }, { status: 404 });
    }

    const currentUserId = user.id ? String(user.id) : '';
    const instructorId = (course as any).instructor
      ? typeof (course as any).instructor === 'object'
        ? String((course as any).instructor.id)
        : String((course as any).instructor)
      : '';
    const isPrivate = (course as any).visibility === 'private';

    if (isPrivate && user.role !== ROLES.ADMIN && instructorId !== currentUserId) {
      return NextResponse.json({ error: 'Nincs jogosultságod megtekinteni ezt a privát kurzust!' }, { status: 403 });
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error('[Studio Courses Get ID Error]:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const user = session?.user as { id?: string; email?: string; role?: string } | undefined;

    if (!user || (user.role !== ROLES.ADMIN && user.role !== ROLES.EDITOR)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await getPayloadInstance();
    const existing = await payload.findByID({
      collection: 'courses',
      id,
      depth: 0,
      locale: 'all' as 'hu',
    });

    if (!existing) {
      return NextResponse.json({ error: 'Kurzus nem található' }, { status: 404 });
    }

    // Permission check: Admin can edit any, Editor can edit only their own
    const currentUserId = user.id ? String(user.id) : '';
    const instructorId = (existing as any).instructor
      ? typeof (existing as any).instructor === 'object'
        ? String((existing as any).instructor.id)
        : String((existing as any).instructor)
      : '';
    if (user.role !== ROLES.ADMIN && instructorId !== currentUserId) {
      return NextResponse.json({ error: 'Nincs jogosultságod ezt a kurzust módosítani!' }, { status: 403 });
    }

    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) updateData.title = toLocalized(body.title, 'Kurzus');
    if (body.summary !== undefined) updateData.summary = toLocalized(body.summary, '');
    if (body.heroTagline !== undefined) updateData.heroTagline = toLocalized(body.heroTagline, '');
    if (body.difficulty !== undefined) updateData.difficulty = body.difficulty;
    if (body.estimatedMinutes !== undefined) {
      updateData.estimatedMinutes = Math.max(1, Number(body.estimatedMinutes) || 20);
    }
    if (body.visibility !== undefined) updateData.visibility = body.visibility;
    if (body.phases !== undefined) {
      updateData.phases = (Array.isArray(body.phases) ? body.phases : []).map((p: any, idx: number) =>
        sanitizePhase(p, idx, existing.slug)
      );
    }
    if (body.mascot !== undefined) updateData.mascot = sanitizeMascot(body.mascot);
    if (body.accentColor !== undefined) updateData.accentColor = body.accentColor;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.illustrationAsset !== undefined) updateData.illustrationAsset = body.illustrationAsset;

    if (user.role === ROLES.ADMIN && body.isOfficial !== undefined) {
      updateData.isOfficial = Boolean(body.isOfficial);
    }

    console.log(`[Studio Courses Update] Updating course ${id}...`);

    const updated = await payload.update({
      collection: 'courses',
      id,
      data: updateData as any,
      locale: 'all' as 'hu',
    });

    try {
      revalidatePath('/courses');
      if (existing?.slug) {
        revalidatePath(`/courses/${existing.slug}`);
      }
    } catch (e) {
      console.warn('[Studio Courses] Cache revalidation warning:', e);
    }

    return NextResponse.json({ success: true, course: updated });
  } catch (error) {
    console.error('[Studio Courses Update Error]:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const user = session?.user as { id?: string; email?: string; role?: string } | undefined;

    if (!user || (user.role !== ROLES.ADMIN && user.role !== ROLES.EDITOR)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await getPayloadInstance();
    const existing = await payload.findByID({
      collection: 'courses',
      id,
      depth: 0,
    });

    if (!existing) {
      return NextResponse.json({ error: 'Kurzus nem található' }, { status: 404 });
    }

    const currentUserId = user.id ? String(user.id) : '';
    const instructorId = (existing as any).instructor
      ? typeof (existing as any).instructor === 'object'
        ? String((existing as any).instructor.id)
        : String((existing as any).instructor)
      : '';
    if (user.role !== ROLES.ADMIN && instructorId !== currentUserId) {
      return NextResponse.json({ error: 'Nincs jogosultságod ezt a kurzust törölni!' }, { status: 403 });
    }

    await payload.delete({
      collection: 'courses',
      id,
    });

    try {
      revalidatePath('/courses');
      if (existing?.slug) {
        revalidatePath(`/courses/${existing.slug}`);
      }
    } catch (e) {
      console.warn('[Studio Courses] Cache revalidation warning:', e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
