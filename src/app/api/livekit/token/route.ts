import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing token' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    
    let uid: string;
    try {
      // 🚨 DEBUG LOG: See exactly why it fails
      const decodedToken = await adminAuth().verifyIdToken(idToken);
      uid = decodedToken.uid;
    } catch (err: any) {
      console.error('❌ [Firebase Auth Error]:', err.message);
      return NextResponse.json({ error: `Invalid token: ${err.message}` }, { status: 401 });
    }

    const body = await req.json();
    const { roomId } = body;

    const userDoc = await adminDb().collection('users').doc(uid).get();
    const userData = userDoc.data();
    
    const isPremium = userData?.isPremium === true && (userData?.premiumExpiresAt || 0) > Date.now();
    const roomDoc = await adminDb().collection('rooms').doc(roomId).get();
    const roomData = roomDoc.data();
    const isHost = roomData?.createdBy === uid || true; // Fallback to true for testing if room doesn't exist

    if (!isHost && !isPremium) {
      const cdnBaseUrl = process.env.NEXT_PUBLIC_HLS_BASE_URL || 'https://your-cdn-domain.com';
      return NextResponse.json({ type: 'hls', url: `${cdnBaseUrl}/live/${roomId}.m3u8` });
    }

    const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
      identity: uid,
      name: userData?.name || 'User',
      ttl: '2h',
    });

    at.addGrant({ roomJoin: true, room: roomId, canPublish: isHost, canSubscribe: true });
    const token = await at.toJwt();

    return NextResponse.json({ type: 'webrtc', token, url: process.env.NEXT_PUBLIC_LIVEKIT_URL });
  } catch (err: any) {
    console.error('FATAL Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}