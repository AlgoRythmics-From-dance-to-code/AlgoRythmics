import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPayloadInstance } from '@/lib/payload';
import { ROLES } from '@/lib/constants';
import { getOpenRouterConfig } from '@/lib/ai/aiSettingsHelper';
import type { AiSetting } from '@/payload-types';

export async function GET() {
  try {
    const session = await auth();
    const user = session?.user as { id?: string; email?: string; role?: string } | undefined;

    if (!user || (user.role !== ROLES.ADMIN && user.role !== ROLES.EDITOR)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await getOpenRouterConfig();

    return NextResponse.json({
      model: config.model,
      isConfigured: config.isConfigured,
      isAdmin: user.role === ROLES.ADMIN,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    const user = session?.user as { id?: string; email?: string; role?: string } | undefined;

    if (!user || user.role !== ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized: Only administrators can update AI settings.' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { model, apiKey } = body;

    const payload = await getPayloadInstance();

    const updateData: Partial<AiSetting> = {};
    if (typeof model === 'string' && model.trim()) {
      updateData.model = model.trim();
    }
    if (typeof apiKey === 'string') {
      updateData.apiKey = apiKey.trim();
    }

    const updated = await payload.updateGlobal({
      slug: 'ai-settings',
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      model: updated.model,
      isConfigured: Boolean(updated.apiKey),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
