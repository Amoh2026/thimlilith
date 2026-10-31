import { NextRequest } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { adminDb } from '@/lib/firebase/admin';
import {
  verifyChatUser,
  unauthorized,
  badRequest,
} from '@/lib/chat/auth-server';

export async function POST(req: NextRequest) {
  try {
    // 👈 MOVED INSIDE TRY/CATCH
    const user = await verifyChatUser(req);
    if (!user) return unauthorized();

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return new Response(
        JSON.stringify({
          error: 'Video not configured yet. Add LIVEKIT_API_KEY, LIVEKIT_API_SECRET and NEXT_PUBLIC_LIVEKIT_URL.',
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const roomId = String(body?.roomId ?? '').trim();
    const isHost = Boolean(body?.isHost);

    if (!roomId) return badRequest('roomId required');

    const isInstantLive = roomId.startsWith('live-');
    
    const snap = await adminDb().collection('rooms').doc(roomId).get();
    
    if (!snap.exists && !isInstantLive) {
      return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    if (snap.exists) {
      const data = snap.data()!;
      const members: string[] = data.members ?? [];
      if (!members.includes(user.uid)) {
        return new Response(JSON.stringify({ error: 'Not a member' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
      }
    }

    const displayName = user.name || user.email?.split('@')[0] || 'Member';
    const roomName = isInstantLive ? `live-stage-${roomId}` : `safmalmo-chat-${roomId}`;

    const at = new AccessToken(apiKey, apiSecret, {
      identity: user.uid,
      name: displayName,
      ttl: '2h',
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: isHost, 
      canSubscribe: true, 
      canPublishData: true,
    });

    const token = await at.toJwt();

    return Response.json({
      token,
      url: wsUrl,
      roomName,
      identity: user.uid,
    });
    
  } catch (err: any) {
    console.error('POST /api/chat/livekit-token error:', err);
    
    // 🛡️ THIS WILL NOW CATCH FIREBASE AUTH ERRORS
    return new Response(
      JSON.stringify({ error: err?.message || 'Internal Server Error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}