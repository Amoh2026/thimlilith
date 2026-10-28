// src/lib/chat/auth-server.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function verifyChatUser(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  const token = authHeader.split('Bearer ')[1];
  try {
    // 👇 FIX: Added () after adminAuth
    const decodedToken = await adminAuth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    return null;
  }
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

// Added a default message here so API routes calling `serverError()` without arguments stop complaining.
export function serverError(message: string = 'Internal Server Error') {
  return NextResponse.json({ error: message }, { status: 500 });
}