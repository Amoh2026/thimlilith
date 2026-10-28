import { NextRequest } from 'next/server';
import { verifyChatUser } from '@/lib/chat/auth-server';

export async function GET(req: NextRequest) {
  const user = await verifyChatUser(req);
  if (!user) return Response.json({ isAdmin: false }, { status: 401 });

  // Check against the secure server-side env variable
  const isAdmin = user.email === process.env.ADMIN_EMAIL;
  return Response.json({ isAdmin });
}