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
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
        return NextResponse.json({ ok: true }); // Anti-enumeration
      }
      console.error('[forgot-password] link error:', err);
      return NextResponse.json({ ok: true });
    }

    if (resetLink) {
      try {
        await sendPasswordResetEmail({ to: email, resetLink, displayName });
      } catch (emailErr: any) {
        // THIS WILL NOW PRINT THE EXACT RESEND ERROR TO YOUR TERMINAL
        console.error('[forgot-password] Resend error:', emailErr.message);
        // We still return ok to the client to prevent email enumeration
        return NextResponse.json({ ok: true });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[forgot-password] Unhandled:', err);
    return NextResponse.json({ error: 'Unable to process request.' }, { status: 500 });
  }
}