'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';

export default function LiveRoom() {
  const searchParams = useSearchParams();
  const params = useParams();
  const roomId = params?.roomId as string;
  const isHost = searchParams?.get('host') === 'true';
  
  const [token, setToken] = useState('');
  // TODO: Replace with actual user ID from AuthContext
  const username = 'User_' + Math.floor(Math.random() * 1000);

  useEffect(() => {
    if (!roomId) return;
    
    const fetchToken = async () => {
      try {
        const res = await fetch(`/api/chat/livekit-token?room=${roomId}&username=${username}&isHost=${isHost}`);
        const data = await res.json();
        if (data.token) setToken(data.token);
      } catch (err) {
        console.error("Failed to fetch token", err);
      }
    };
    
    fetchToken();
  }, [roomId, isHost]);

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
        video={isHost} // Only host turns on camera
        audio={isHost} // Only host turns on mic
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        onDisconnected={() => window.history.back()} // Return to origin if dropped
        className="h-screen"
      >
        <VideoConference 
          chatMessageFormatter={undefined} 
          settings={isHost} // Viewers can't change settings
        />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}