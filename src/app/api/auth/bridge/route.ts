// src/app/api/auth/bridge/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify the user is logged in by checking their ID token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    
    // Decode the token to get the user's UID
    const decodedToken = await adminAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // 2. Generate a secure, single-use custom token
    const customToken = await adminAuth().createCustomToken(uid);

    // 3. Figure out where to send them based on the ?target= query param
    const { searchParams } = new URL(req.url);
    const target = searchParams.get('target') || 'atk';

    // 🚨 NEW LOGIC: Check if we are in production or local dev
    const isProd = process.env.NODE_ENV === 'production';
    
    // By default, Thimlilith runs on 3000. ATK will usually run on 3001.
    // If your ATK server is on a different port, change '3001' below.
    const atkDevPort = process.env.ATK_DEV_PORT || '3001'; 
    
    let targetUrl = isProd 
      ? 'https://apprendrethamazightkabyle.com/sso' 
      : `http://localhost:${atkDevPort}/sso`;
    
    if (target === 'apc') {
      // Future-proofing for Phase 3! 
      targetUrl = isProd 
        ? 'https://apprendre-par-coeur.com/sso' 
        : 'http://localhost:3002/sso';
    }

    // 4. Return the full URL with the token attached
    return NextResponse.json({
      url: `${targetUrl}?token=${customToken}`
    });

  } catch (error: any) {
    console.error('[SSO Bridge] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate SSO token' },
      { status: 500 }
    );
  }
}