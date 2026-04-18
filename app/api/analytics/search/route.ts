import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { getPayloadInstance } from '../../../../lib/payload';

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayloadInstance();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = Number(session.user.id);

    const body = await req.json();
    const MAX_QUERY_LENGTH = 256;
    const MAX_CATEGORY_LENGTH = 128;
    const MAX_RESULTS_COUNT = 10000;

    const rawQuery = typeof body?.query === 'string' ? body.query : '';
    const query = rawQuery.trim().slice(0, MAX_QUERY_LENGTH);
    const resultsCount = Number(body?.resultsCount);
    const language = typeof body?.language === 'string' ? body.language : '';
    const rawCategory = typeof body?.category === 'string' ? body.category : undefined;
    const category = rawCategory?.trim().slice(0, MAX_CATEGORY_LENGTH) || undefined;

    if (!query) {
      return NextResponse.json({ error: 'Missing or empty query' }, { status: 400 });
    }

    if (!Number.isFinite(resultsCount) || resultsCount < 0 || resultsCount > MAX_RESULTS_COUNT) {
      return NextResponse.json({ error: 'Invalid resultsCount' }, { status: 400 });
    }

    const SUPPORTED_LANGUAGES = ['en', 'hu', 'ro'] as const;
    if (!SUPPORTED_LANGUAGES.includes(language as (typeof SUPPORTED_LANGUAGES)[number])) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }

    await payload.create({
      collection: 'search-analytics',
      data: {
        query,
        user: userId,
        resultsCount,
        language: language as 'en' | 'hu' | 'ro',
        category,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[SearchAnalytics] Error recording search:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
