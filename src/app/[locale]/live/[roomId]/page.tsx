'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';

export default function LiveRoom() {
  const searchParams = useSearchParams();
  const params = useParams();
  const roomId = params?.roomId as string;
  const isHost = searchParams?.get('host') === 'true';
  
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!roomId) return;

    // 👇 WAIT FOR FIREBASE AUTH TO FINISH LOADING
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError("You must be logged in to join a live stream.");
        return;
      }

      try {
        const idToken = await user.getIdToken();

        const res = await fetch('/api/chat/livekit-token', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ roomId, isHost }),
        });

        const text = await res.text();
        if (!text) {
          throw new Error(`Server returned empty response (Status: ${res.status})`);
        }

        const data = JSON.parse(text);
        
        if (!res.ok) {
          throw new Error(data.error || `Server error: ${res.status}`);
        }

        setToken(data.token);
      } catch (err: any) {
        setError(err.message);
      }
    });

    return () => unsubscribe();
  }, [roomId, isHost]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-red-400 p-4 text-center">
        <p className="mb-4 text-sm font-mono bg-red-500/10 p-4 rounded-xl border border-red-500/20">⚠️ {error}</p>
        <button onClick={() => window.history.back()} className="text-teal-400 underline mt-2">Go Back</button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-teal-400">
        <div className="animate-pulse">Connecting to Live Stage...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a]" data-lk-theme="default">
      <LiveKitRoom
        video={isHost} 
        audio={isHost} 
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        onDisconnected={() => window.history.back()}
        className="h-screen"
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}