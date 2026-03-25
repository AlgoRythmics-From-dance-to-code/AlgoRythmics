import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { APP_CONFIG } from '../../../../lib/constants';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(APP_CONFIG.COOKIE_TOKEN_NAME);

  return NextResponse.json({ success: true });
}
