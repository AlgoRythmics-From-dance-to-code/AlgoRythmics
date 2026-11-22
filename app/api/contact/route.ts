import { NextResponse } from 'next/server';
import { getPayloadInstance } from '../../../lib/payload';
import { getT } from '../../../lib/i18n-server';
import logger from '../../../lib/logger';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const MAX_TRACKED_IPS = 2000;

const rateLimitStore = new Map<string, number[]>();

function isRateLimited(ip: string, now: number): boolean {
  if (rateLimitStore.size > MAX_TRACKED_IPS) {
    for (const [key, timestamps] of rateLimitStore.entries()) {
      const fresh = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
      if (fresh.length === 0) {
        rateLimitStore.delete(key);
      } else {
        rateLimitStore.set(key, fresh);
      }
    }
    if (rateLimitStore.size > MAX_TRACKED_IPS) {
      const firstKey = rateLimitStore.keys().next().value;
      if (firstKey) rateLimitStore.delete(firstKey);
    }
  }

  const existing = (rateLimitStore.get(ip) || []).filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  if (existing.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateLimitStore.set(ip, existing);
    return true;
  }

  existing.push(now);
  rateLimitStore.set(ip, existing);
  return false;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim() || 'unknown';
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(req: Request) {
  const t = await getT();
  const ip = getClientIp(req);

  if (isRateLimited(ip, Date.now())) {
    return NextResponse.json({ error: t('contact.errors.rate_limited') }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: t('contact.errors.send_failed') }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : '';
  const email = typeof body.email === 'string' ? body.email.trim().slice(0, 254) : '';
  const rawSubject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const subject = rawSubject.replace(/[\r\n]+/g, ' ').slice(0, 200);
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 5000) : '';

  if (!name) {
    return NextResponse.json({ error: t('contact.errors.name_required') }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ error: t('contact.errors.email_required') }, { status: 400 });
  }
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: t('contact.errors.email_invalid') }, { status: 400 });
  }
  if (!subject) {
    return NextResponse.json({ error: t('contact.errors.subject_required') }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: t('contact.errors.message_required') }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    logger.error('Contact form failed: RESEND_API_KEY is not configured');
    return NextResponse.json({ error: t('contact.errors.send_failed') }, { status: 503 });
  }

  try {
    const payload = await getPayloadInstance();
    const to = process.env.CONTACT_EMAIL || 'contact@algo-rythmics.com';
    const escapedName = escapeHtml(name);
    const escapedEmail = escapeHtml(email);
    const escapedSubject = escapeHtml(subject);
    const escapedMessage = escapeHtml(message).replace(/\n/g, '<br />');

    const result = await payload.sendEmail({
      to,
      replyTo: email,
      subject: `[AlgoRythmics Contact] ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #111827;">
          <h2 style="margin-bottom: 12px;">New Contact Form Message</h2>
          <p><strong>Name:</strong> ${escapedName}</p>
          <p><strong>Email:</strong> ${escapedEmail}</p>
          <p><strong>Subject:</strong> ${escapedSubject}</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
          <p style="white-space: pre-wrap;">${escapedMessage}</p>
        </div>
      `,
    });

    if (
      result &&
      typeof result === 'object' &&
      'statusCode' in result &&
      typeof (result as { statusCode?: unknown }).statusCode === 'number' &&
      ((result as { statusCode: number }).statusCode ?? 0) >= 400
    ) {
      logger.error({ result }, 'Resend contact email delivery returned an error');
      return NextResponse.json({ error: t('contact.errors.send_failed') }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Contact form email send failed',
    );
    return NextResponse.json({ error: t('contact.errors.send_failed') }, { status: 500 });
  }
}
