import { NextRequest, NextResponse } from 'next/server';
import { EgressClient } from 'livekit-server-sdk';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json({ error: 'Missing LiveKit config on server' }, { status: 500 });
    }

    // 1. Verify Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // 2. Get Request Body
    const body = await req.json();
    const { roomId, action } = body; // action: 'start' | 'stop'

    if (!roomId || !action) {
      return NextResponse.json({ error: 'Missing roomId or action' }, { status: 400 });
    }

    // 3. Security Check: Only the Room Host can start/stop the stream
    const roomDoc = await adminDb().collection('rooms').doc(roomId).get();
    const roomData = roomDoc.data();

    if (roomData?.createdBy !== uid) {
      return NextResponse.json({ error: 'Forbidden: Only the host can control the live stream' }, { status: 403 });
    }

    // 4. Initialize LiveKit Egress Client
    // Note: The SDK requires the WebSocket URL (wss://...) not the HTTP one
    const wsUrl = livekitUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    const egressClient = new EgressClient(wsUrl, apiKey, apiSecret);

    if (action === 'start') {
      // NOTE: In production, this URL comes from your CDN provider (e.g., Cloudflare, Mux)
      // They will give you an RTMP ingest URL, and they will output the .m3u8 HLS URL.
      const rtmpTarget = process.env.LIVEKIT_EGRESS_RTMP_URL || `rtmp://a.rtmp.youtube.com/live2/${roomId}`; 

      // Start the Egress (Convert Room to HLS/RTMP)
      const info = await egressClient.startRoomCompositeEgress(roomId, {
        stream: {
          urls: [rtmpTarget],
        }
      }, {
        layout: 'speaker', // Or 'grid' if you want all camera feeds side-by-side
        audioOnly: false,
      });

      // (Optional) Save the egressId to Firestore so we can stop it later if needed
      await adminDb().collection('rooms').doc(roomId).update({
        activeEgressId: info.egressId,
        isLive: true
      });

      return NextResponse.json({ 
        success: true, 
        message: 'HLS Broadcast started successfully',
        egressId: info.egressId 
      });

    } else if (action === 'stop') {
      // Fetch active egresses for this room and stop them
      const egresses = await egressClient.listEgress({ roomName: roomId, active: true });
      
      if (egresses.length > 0) {
        await egressClient.stopEgress(egresses[0].egressId);
      }

      await adminDb().collection('rooms').doc(roomId).update({
        activeEgressId: null,
        isLive: false
      });

      return NextResponse.json({ success: true, message: 'Broadcast stopped' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (err: any) {
    console.error('Egress API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}