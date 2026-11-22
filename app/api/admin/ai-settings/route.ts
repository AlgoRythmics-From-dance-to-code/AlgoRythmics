import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { getPayloadInstance } from '@/lib/payload';
import { ROLES } from '@/lib/constants';
import { getOpenRouterConfig, invalidateAiSettingsCache } from '@/lib/ai/aiSettingsHelper';
import type { AiSetting } from '@/payload-types';

async function getDbUserRole(userId?: string | number): Promise<string | undefined> {
  if (!userId) return undefined;
  const payload = await getPayloadInstance();
  const dbUser = await payload.findByID({
    collection: 'users',
    id: userId,
    depth: 0,
  });
  return (dbUser as unknown as { role?: string })?.role;
}

export async function GET() {
  try {
    const session = await auth();
    const user = session?.user as { id?: string; email?: string; role?: string } | undefined;

    const config = await getOpenRouterConfig();

    // Unauthenticated or regular student users only receive public mascot status & limits
    if (!user?.id) {
      return NextResponse.json({
        mascotEnabled: config.mascotEnabled,
        mascotMaxMessagesPerDay: config.mascotMaxMessagesPerDay,
        mascotMaxMessagesPerPhase: config.mascotMaxMessagesPerPhase,
        mascotCooldownSeconds: config.mascotCooldownSeconds,
      });
    }

    const dbRole = await getDbUserRole(user.id);
    const isStaff = dbRole === ROLES.ADMIN || dbRole === ROLES.EDITOR;

    if (!isStaff) {
      return NextResponse.json({
        mascotEnabled: config.mascotEnabled,
        mascotMaxMessagesPerDay: config.mascotMaxMessagesPerDay,
        mascotMaxMessagesPerPhase: config.mascotMaxMessagesPerPhase,
        mascotCooldownSeconds: config.mascotCooldownSeconds,
      });
    }

    return NextResponse.json({
      model: config.model,
      isConfigured: config.isConfigured,
      isAdmin: dbRole === ROLES.ADMIN,
      mascotEnabled: config.mascotEnabled,
      mascotMaxMessagesPerDay: config.mascotMaxMessagesPerDay,
      mascotMaxMessagesPerPhase: config.mascotMaxMessagesPerPhase,
      mascotCooldownSeconds: config.mascotCooldownSeconds,
    });
  } catch (error) {
    console.error('[AI Settings GET Error]:', error);
    return NextResponse.json({ error: 'Failed to load AI settings' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    const user = session?.user as { id?: string; email?: string; role?: string } | undefined;

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbRole = await getDbUserRole(user.id);
    if (dbRole !== ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized: Only administrators can update AI settings.' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const {
      model,
      apiKey,
      mascotEnabled,
      mascotMaxMessagesPerDay,
      mascotMaxMessagesPerPhase,
      mascotCooldownSeconds,
    } = body;

    // Ensure columns exist before updateGlobal
    await getOpenRouterConfig();
    const payload = await getPayloadInstance();

    const updateData: Partial<AiSetting> = {};
    if (typeof model === 'string' && model.trim()) {
      updateData.model = model.trim();
    }
    if (typeof apiKey === 'string' && apiKey.trim()) {
      updateData.apiKey = apiKey.trim();
    }
    if (typeof mascotEnabled === 'boolean') {
      updateData.mascotEnabled = mascotEnabled;
    }
    if (mascotMaxMessagesPerDay !== undefined) {
      updateData.mascotMaxMessagesPerDay = Math.max(
        1,
        Math.min(500, Number(mascotMaxMessagesPerDay) || 30),
      );
    }
    if (mascotMaxMessagesPerPhase !== undefined) {
      updateData.mascotMaxMessagesPerPhase = Math.max(
        1,
        Math.min(50, Number(mascotMaxMessagesPerPhase) || 5),
      );
    }
    if (mascotCooldownSeconds !== undefined) {
      updateData.mascotCooldownSeconds = Math.max(
        0,
        Math.min(120, Number(mascotCooldownSeconds ?? 8)),
      );
    }

    const updated = await payload.updateGlobal({
      slug: 'ai-settings',
      data: updateData,
    });

    invalidateAiSettingsCache();

    try {
      revalidatePath('/courses', 'layout');
    } catch {
      // Ignore revalidation errors in dev
    }

    return NextResponse.json({
      success: true,
      model: updated.model,
      isConfigured: Boolean(updated.apiKey || process.env.OPENROUTER_API_KEY),
      mascotEnabled: updated.mascotEnabled !== false,
      mascotMaxMessagesPerDay: Number(updated.mascotMaxMessagesPerDay) || 30,
      mascotMaxMessagesPerPhase: Number(updated.mascotMaxMessagesPerPhase) || 5,
      mascotCooldownSeconds: Number(updated.mascotCooldownSeconds ?? 8),
    });
  } catch (error) {
    console.error('[AI Settings PUT Error]:', error);
    return NextResponse.json({ error: 'Failed to update AI settings' }, { status: 500 });
  }
}
