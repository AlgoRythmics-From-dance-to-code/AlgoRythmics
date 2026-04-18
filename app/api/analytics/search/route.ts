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

    const { query, resultsCount, language, category } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    await payload.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      collection: 'search-analytics' as any,
      data: {
        query,
        user: userId,
        resultsCount,
        language,
        category,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[SearchAnalytics] Error recording search:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
