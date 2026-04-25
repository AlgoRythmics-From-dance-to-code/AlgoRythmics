import { NextResponse } from 'next/server';
import { getPayloadInstance } from '../../../lib/payload';

export async function GET() {
  try {
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
      id: user.id,
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
