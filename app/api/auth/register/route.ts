import { getPayload } from 'payload';
import configPromise from '../../../../payload.config';
import { NextResponse } from 'next/server';
import { ROLES } from '../../../../lib/constants';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const payload = await getPayload({ config: configPromise });

    const user = await payload.create({
      collection: 'users',
      data: {
        email,
        password,
        role: ROLES.USER, // Force user role to prevent unauthorized admin creation
      },
    });

    return NextResponse.json({ message: 'User created successfully', user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    console.error('Registration Route Error:', { message, error });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
