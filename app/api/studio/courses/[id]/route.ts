import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '../../../../../auth';
import { getPayloadInstance } from '../../../../../lib/payload';
import { ROLES } from '../../../../../lib/constants';

import {
  toLocalized,
  sanitizePhase,
  sanitizeMascot,
} from '../../../../../lib/courses/studioHelper';

function extractInstructorId(item: unknown): string {
  if (!item || typeof item !== 'object') return '';
  const obj = item as Record<string, unknown>;
  const inst = obj.instructor;
  if (!inst) return '';
  if (typeof inst === 'object' && inst !== null && 'id' in inst) {
    return String((inst as { id: string | number }).id);
  }
  return String(inst);
}

function isCoursePrivate(item: unknown): boolean {
  if (!item || typeof item !== 'object') return false;
  return (item as Record<string, unknown>).visibility === 'private';
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const instructorId = extractInstructorId(course);
    const isPrivate = isCoursePrivate(course);

    if (isPrivate && user.role !== ROLES.ADMIN && instructorId !== currentUserId) {
      return NextResponse.json(
        { error: 'Nincs jogosultságod megtekinteni ezt a privát kurzust!' },
        { status: 403 },
      );
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error('[Studio Courses Get ID Error]:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const instructorId = extractInstructorId(existing);
    if (user.role !== ROLES.ADMIN && instructorId !== currentUserId) {
      return NextResponse.json(
        { error: 'Nincs jogosultságod ezt a kurzust módosítani!' },
        { status: 403 },
      );
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
      updateData.phases = (Array.isArray(body.phases) ? body.phases : []).map(
        (p: unknown, idx: number) =>
          sanitizePhase(p as Record<string, unknown>, idx, existing.slug),
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
      data: updateData as never,
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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const instructorId = extractInstructorId(existing);
    if (user.role !== ROLES.ADMIN && instructorId !== currentUserId) {
      return NextResponse.json(
        { error: 'Nincs jogosultságod ezt a kurzust törölni!' },
        { status: 403 },
      );
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
