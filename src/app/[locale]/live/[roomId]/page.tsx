'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  PreJoin,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import HlsPlayer from '@/components/HlsPlayer';
import LiveRoomOverlay from '@/components/LiveRoomOverlay'; 

export default function LiveRoom() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string;
  const isHostUrl = searchParams?.get('host') === 'true';
  
  const [playbackType, setPlaybackType] = useState<'loading' | 'webrtc' | 'hls' | 'error'>('loading');
  const [token, setToken] = useState('');
  const [hlsUrl, setHlsUrl] = useState('');
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState('');

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError("You must be logged in.");
        setPlaybackType('error');
        return;
      }

      try {
        const idToken = await user.getIdToken();
        const res = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
          body: JSON.stringify({ roomId }),
        });

        const text = await res.text();
        if (!text) throw new Error(`Server error (Status: ${res.status})`);

        const data = JSON.parse(text);
        if (!res.ok) throw new Error(data.error || `Server error: ${res.status}`);

        if (data.type === 'hls') {
          setHlsUrl(data.url);
          setPlaybackType('hls');
        } else if (data.type === 'webrtc') {
          setToken(data.token);
          setPlaybackType('webrtc');
        } else {
          throw new Error("Unknown playback type returned from server");
        }

      } catch (err: any) {
        setError(err.message);
        setPlaybackType('error');
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  const toggleEgress = async () => {
    try {
      setStreamError('');
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      
      const idToken = await user.getIdToken();
      const action = isStreaming ? 'stop' : 'start';
      
      const res = await fetch('/api/livekit/egress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ roomId, action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle stream');

      setIsStreaming(!isStreaming);
    } catch (err: any) {
      setStreamError(err.message);
    }
  };

  // 🚨 Custom Leave Logic
  const handleLeave = async () => {
    if (isStreaming) {
      await toggleEgress(); // Stop the stream before leaving
    }
    router.push('/en/rooms'); // Send them back to the chat rooms
  };

  if (playbackType === 'error') {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-red-400 p-4 text-center">
        <p className="mb-4 text-sm bg-red-500/10 p-4 rounded-xl border border-red-500/20">{error}</p>
        <button onClick={() => router.push('/en/rooms')} className="text-teal-400 underline">Go Back</button>
      </div>
    );
  }

  if (playbackType === 'loading') {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-teal-400">
        <div className="animate-pulse">Connecting to Live Stage...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0f172a] flex flex-col md:flex-row">
      
      {/* MAIN VIDEO AREA */}
      <div className="flex-1 h-[60vh] md:h-screen relative">
        
        {/* HOST CONTROLS (Broadcast & Leave) - Only shows AFTER joining */}
        {isHostUrl && joined && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-3 bg-black/50 p-2 rounded-full backdrop-blur-md">
            {streamError && <p className="text-red-400 text-xs">{streamError}</p>}
            
            <button
              onClick={toggleEgress}
              className={`px-4 py-2 rounded-full font-bold text-sm shadow-lg transition-colors ${
                isStreaming 
                  ? 'bg-teal-500 hover:bg-teal-600 text-white' 
                  : 'bg-teal-500 hover:bg-teal-600 text-white'
              }`}
            >
              {isStreaming ? '🛑 Stop HLS' : '🔴 Start HLS'}
            </button>

            <button
              onClick={handleLeave}
              className="px-4 py-2 rounded-full font-bold text-sm bg-red-600 hover:bg-red-700 text-white shadow-lg transition-colors"
            >
              🚪 End & Leave
            </button>
          </div>
        )}

        {playbackType === 'hls' ? (
          <HlsPlayer src={hlsUrl} />
        ) : (
          <LiveKitRoom
            video={isHostUrl} 
            audio={isHostUrl} 
            token={token}
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
            onDisconnected={() => router.push('/en/rooms')}
            className="h-full"
            data-lk-theme="default"
          >
            {!joined && isHostUrl ? (
              <div className="h-full flex items-center justify-center bg-[#0f172a] p-4">
                <div className="bg-[#1e293b] p-6 rounded-2xl border border-white/10 shadow-2xl">
                  <PreJoin
                    onSubmit={() => setJoined(true)}
                    defaults={{ videoEnabled: true, audioEnabled: true }}
                    persistUserChoices={false}
                  />
                </div>
              </div>
            ) : (
              <VideoConference />
            )}
            <RoomAudioRenderer />
          </LiveKitRoom>
        )}
      </div>

      {/* SIDEBAR OVERLAY (Chat & Gifts) */}
      <div className="w-full md:w-80 h-[40vh] md:h-screen bg-[#1e293b] border-l border-white/10 flex-shrink-0 z-10 relative">
        <LiveRoomOverlay roomId={roomId} /> 
      </div>

    </div>
  );
}