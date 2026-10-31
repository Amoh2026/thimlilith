// src/app/api/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { sendPasswordResetEmail } from '@/lib/email';

export const runtime = 'nodejs';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://thimlilith.com';
const DEFAULT_LOCALE = 'en';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = (body?.email || '').toString().trim().toLowerCase();
    const locale = (body?.locale || DEFAULT_LOCALE).toString();

    if (!email || !email.includes('@') || email.length > 320) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    // SECURITY: always return { ok: true } — never reveal whether the email exists.
    let resetLink: string | null = null;
    let displayName: string | undefined;

    try {
      const user = await adminAuth().getUserByEmail(email);
      displayName = user.displayName || undefined;

      resetLink = await adminAuth().generatePasswordResetLink(email, {
        url: `${SITE_URL}/${locale}/account/reset-password`,
        handleCodeInApp: false,
      });
    } catch (err: any) {
      const code = err?.code || err?.errorInfo?.code || '';
      // Silently succeed for "user not found" (anti-enumeration)
      // Also silently succeed for Google-only accounts (no password to reset)
      if (
        code === 'auth/user-not-found' ||
        code === 'auth/internal-error' ||
        code === 'auth/invalid-email'
      ) {
        return NextResponse.json({ ok: true });
      }
      console.error('[forgot-password] generatePasswordResetLink error:', err);
      // Still return ok to avoid leaking state
      return NextResponse.json({ ok: true });
    }

    if (resetLink) {
      try {
        await sendPasswordResetEmail({ to: email, resetLink, displayName });
      } catch (emailErr) {
        // Log the send failure but don't leak to client
        console.error('[forgot-password] Resend send failed:', emailErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[forgot-password] Unhandled error:', err);
    return NextResponse.json(
      { error: 'Unable to process request. Please try again.' },
      { status: 500 }
    );
  }
}