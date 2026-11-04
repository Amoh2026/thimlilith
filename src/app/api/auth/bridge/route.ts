import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(req: Request) {
  try {
    const { idToken, next } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: 'Missing ID token' }, { status: 401 });
    }

    // adminAuth() is a FUNCTION in Thimlilith — must be called
    const decodedToken = await adminAuth().verifyIdToken(idToken);
    const customToken = await adminAuth().createCustomToken(decodedToken.uid);

    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://www.thimlilith.com' 
      : 'http://localhost:3001';
      
    const nextPath = next ? `&next=${encodeURIComponent(next)}` : '';
    const redirectUrl = `${baseUrl}/sso?token=${customToken}${nextPath}`;

    return NextResponse.json({ customToken, redirectUrl });
    
  } catch (error) {
    console.error('SSO Bridge Error:', error);
    return NextResponse.json({ error: 'Failed to create custom token' }, { status: 500 });
  }
}