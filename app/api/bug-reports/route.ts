import { getPayloadInstance } from '../../../lib/payload';
import { NextResponse } from 'next/server';
import { auth } from '../../../auth';
import logger from '../../../lib/logger';
import { getT } from '../../../lib/i18n-server';

export async function GET() {
  const t = await getT();
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: t('errors.unauthorized') }, { status: 401 });
    }

    const userId = Number(session.user.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: t('errors.unauthorized') }, { status: 401 });
    }

    const payload = await getPayloadInstance();
    const reports = await payload.find({
      collection: 'bug-reports',
      where: {
        user: {
          equals: userId,
        },
      },
      sort: '-createdAt',
      depth: 1,
      overrideAccess: true,
    });

    return NextResponse.json({ reports: reports.docs });
  } catch (error) {
    const message = error instanceof Error ? error.message : t('toasts.unexpected_error');
    logger.error({ error: message }, 'Failed to fetch bug reports');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const t = await getT();
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: t('errors.unauthorized') }, { status: 401 });
    }

    const userId = Number(session.user.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: t('errors.unauthorized') }, { status: 401 });
    }

    const formData = await req.formData();
    const description = ((formData.get('description') as string) || '').trim();
    const severity = (formData.get('severity') as string) || 'medium';
    const pageUrl = (formData.get('pageUrl') as string) || '';
    const screenshotFile = formData.get('screenshot') as File | null;

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const payload = await getPayloadInstance();
    const userAgent = req.headers.get('user-agent') || undefined;

    let fileObj: { data: Buffer; name: string; mimetype: string; size: number } | undefined;
    if (screenshotFile && screenshotFile.size > 0) {
      const bytes = await screenshotFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      fileObj = {
        data: buffer,
        name: screenshotFile.name || 'screenshot.png',
        mimetype: screenshotFile.type || 'image/png',
        size: screenshotFile.size,
      };
    }

    const bugReport = await payload.create({
      collection: 'bug-reports',
      data: {
        description,
        severity: (severity as 'low' | 'medium' | 'high' | 'critical') || 'medium',
        status: 'new',
        user: userId,
        pageUrl: pageUrl || undefined,
        userAgent,
      },
      file: fileObj,
      overrideAccess: true,
    });

    logger.info(
      { userId, reportId: bugReport.id },
      'Bug report created successfully',
    );

    return NextResponse.json({
      message: t('toasts.bug_report_submitted') || 'Bug report submitted successfully',
      bugReport,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : t('toasts.unexpected_error');
    logger.error({ error: message }, 'Failed to create bug report');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
