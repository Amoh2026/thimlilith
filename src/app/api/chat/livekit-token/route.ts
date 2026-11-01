import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { adminDb, adminAuth } from '@/lib/firebase/admin'; // Golden Rule: adminDb is a function

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Missing LiveKit keys on Vercel' }, { status: 500 });
    }

    // 1. Verify Authentication (Golden Rule #2: Never trust the client)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    
    let uid: string;
    try {
      const decodedToken = await adminAuth().verifyIdToken(idToken);
      uid = decodedToken.uid;
    } catch (err) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // 2. Get the request body (we need the roomId now, no more hardcoded 'debug-room')
    const body = await req.json();
    const { roomId } = body;

    if (!roomId) {
      return NextResponse.json({ error: 'Missing roomId in request body' }, { status: 400 });
    }

    // 3. Fetch User Data from Firestore
    const userDoc = await adminDb().collection('users').doc(uid).get();
    const userData = userDoc.data();
    
    // Check if premium is active (checking expiry, not just the boolean)
    const isPremium = userData?.isPremium === true && (userData?.premiumExpiresAt || 0) > Date.now();

    // 4. Fetch Room Data from Firestore
    const roomDoc = await adminDb().collection('rooms').doc(roomId).get();
    const roomData = roomDoc.data();
    
    // Check if the user is the creator/host of this room
    const isHost = roomData?.createdBy === uid;

    // ==========================================
    // 🚨 THE HLS / EGRESS SWITCH (v17.0 Architecture)
    // ==========================================

    // FREE USER LOGIC: Not the host AND not premium -> Give them HLS CDN Playback URL
    if (!isHost && !isPremium) {
      // We use the CDN URL where LiveKit Egress outputs the stream
      const cdnBaseUrl = process.env.NEXT_PUBLIC_HLS_BASE_URL || 'https://your-cdn-domain.com';
      const hlsUrl = `${cdnBaseUrl}/live/${roomId}.m3u8`;
      
      return NextResponse.json({ 
        type: 'hls',
        url: hlsUrl,
        message: 'Connected via CDN (Free Tier - 3s delay)'
      });
    }

    // HOST OR PREMIUM USER LOGIC: Give them a WebRTC Token (Sub-second latency)
    const at = new AccessToken(apiKey, apiSecret, {
      identity: uid,
      name: userData?.name || 'Thimlilith User',
      ttl: '2h',
    });

    at.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: isHost, // Only the Host can broadcast audio/video. Premium viewers just watch.
      canSubscribe: true,
      canPublishData: true, // For real-time chat/gifts later if needed via Data API
    });

    const token = await at.toJwt();

    return NextResponse.json({
      type: 'webrtc',
      token,
      url: process.env.NEXT_PUBLIC_LIVEKIT_URL,
    });

  } catch (err: any) {
    console.error('LiveKit Token Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}