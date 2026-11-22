import crypto from 'crypto';

function getCertificateSecret(): string {
  const envSecret =
    process.env.CERTIFICATE_SECRET || process.env.PAYLOAD_SECRET || process.env.AUTH_SECRET;
  if (!envSecret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CRITICAL: Missing secret environment variable for certificate token signing in production!',
      );
    }
    return 'dev-fallback-secret-algorythmics-12345';
  }
  return envSecret;
}

/**
 * Generates an HMAC-SHA256 share token bound to a specific userId and courseSlug
 * so certificate links cannot be guessed or sequentially enumerated.
 */
export function signCertificateToken(userId: number | string, courseSlug: string): string {
  const uid = String(userId).trim();
  const slug = String(courseSlug).trim();
  if (!uid || !slug) {
    return '';
  }

  return crypto
    .createHmac('sha256', getCertificateSecret())
    .update(`cert-v1:${uid}:${slug}`)
    .digest('base64url');
}

/**
 * Verifies a certificate share token in constant time.
 */
export function verifyCertificateToken(
  userId: number | string,
  courseSlug: string,
  token: string | null | undefined,
): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const expected = signCertificateToken(userId, courseSlug);
  if (!expected) {
    return false;
  }

  const expectedBuf = Buffer.from(expected, 'utf8');
  const actualBuf = Buffer.from(token.trim(), 'utf8');
  if (expectedBuf.length !== actualBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
