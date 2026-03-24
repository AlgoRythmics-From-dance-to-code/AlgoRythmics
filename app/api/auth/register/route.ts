import { getPayload } from 'payload';
import configPromise from '../../../../payload.config';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, password, role } = await req.json();
    const payload = await getPayload({ config: configPromise });

    const user = await payload.create({
      collection: 'users',
      data: {
        email,
        password,
        role: role || 'user',
      },
    });

    return NextResponse.json({ message: 'User created successfully', user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
