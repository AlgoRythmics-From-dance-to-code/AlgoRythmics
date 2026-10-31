import { headers as getHeaders } from 'next/headers';
import { auth } from '@/auth';
import { getPayloadInstance } from '@/lib/payload';
import { ROLES } from '@/lib/constants';

export interface AuthorizedUser {
  id: string | number;
  email: string;
  role: string;
}

export async function authorizeTeacherOrAdmin(): Promise<AuthorizedUser | null> {
  const payload = await getPayloadInstance();

  // 1. Check Payload token
  try {
    const headers = await getHeaders();
    const { user: payloadUser } = await payload.auth({ headers });
    if (
      payloadUser &&
      (payloadUser.role === ROLES.ADMIN || payloadUser.role === ROLES.EDITOR)
    ) {
      return {
        id: payloadUser.id,
        email: payloadUser.email || '',
        role: payloadUser.role,
      };
    }
  } catch {
    // Continue
  }

  // 2. Check NextAuth session
  try {
    const session = await auth();
    const nextAuthUser = session?.user as
      | { id?: string | number; email?: string; role?: string }
      | undefined;
    if (
      nextAuthUser &&
      (nextAuthUser.role === ROLES.ADMIN || nextAuthUser.role === ROLES.EDITOR)
    ) {
      return {
        id: nextAuthUser.id || '',
        email: nextAuthUser.email || '',
        role: nextAuthUser.role,
      };
    }
  } catch {
    // Fallback
  }

  return null;
}

export async function authorizeAuthenticatedUser(): Promise<AuthorizedUser | null> {
  const payload = await getPayloadInstance();

  // 1. Check Payload token
  try {
    const headers = await getHeaders();
    const { user: payloadUser } = await payload.auth({ headers });
    if (payloadUser) {
      return {
        id: payloadUser.id,
        email: payloadUser.email || '',
        role: payloadUser.role || ROLES.USER,
      };
    }
  } catch {
    // Continue
  }

  // 2. Check NextAuth session
  try {
    const session = await auth();
    const nextAuthUser = session?.user as
      | { id?: string | number; email?: string; role?: string }
      | undefined;
    if (nextAuthUser && nextAuthUser.id) {
      return {
        id: nextAuthUser.id,
        email: nextAuthUser.email || '',
        role: nextAuthUser.role || ROLES.USER,
      };
    }
  } catch {
    // Fallback
  }

  return null;
}
