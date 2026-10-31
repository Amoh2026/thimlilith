import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { sendVerificationEmail } from '@/lib/email';

export const runtime = 'nodejs';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://thimlilith.com';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = (body?.email || '').toString().trim().toLowerCase();
    const locale = (body?.locale || 'en').toString();
    const displayName = body?.displayName;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    try {
      const verifyLink = await adminAuth().generateEmailVerificationLink(email, {
        url: `${SITE_URL}/${locale}/account/login?verified=true`,
      });

      await sendVerificationEmail({ to: email, verifyLink, displayName });
      return NextResponse.json({ ok: true });
    } catch (err: any) {
      const code = err?.code || '';
      
      // If the user doesn't exist or is already verified, don't crash. Just return ok.
      if (code === 'auth/user-not-found' || code === 'auth/email-already-verified') {
        return NextResponse.json({ ok: true });
      }
      
      throw err; 
    }
  } catch (err: any) {
    console.error('[send-verification] error:', err);
    return NextResponse.json(
      { error: 'Failed to send verification email. Please try again.' },
      { status: 500 }
    );
  }
}