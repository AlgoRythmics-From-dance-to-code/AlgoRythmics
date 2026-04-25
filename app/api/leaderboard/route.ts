import { NextResponse } from 'next/server';
import { getPayloadInstance } from '../../../lib/payload';
import { auth } from '../../../auth';

export const revalidate = 0;

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await getPayloadInstance();

    const users = await payload.find({
      collection: 'users',
      sort: '-learningStats.totalPoints',
      limit: 100,
      depth: 0,
      where: {
        'learningStats.totalPoints': {
          greater_than: 0,
        },
      },
    });

    const publicUsers = users.docs.map((user) => ({
      id: String(user.id),
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      imageUrl: user.imageUrl || null,
      stats: user.learningStats || {},
    }));

    return NextResponse.json({ users: publicUsers });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
