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
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  // 1. Fetch LiveKit Token via Firebase Auth
  useEffect(() => {
    if (!roomId) return;

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

  // 2. Handle Pre-Join Permissions
  const handleRequestPermissions = async () => {
    try {
      // Force the browser to grab the camera and mic
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      // Immediately stop the stream to completely release the hardware lock
      stream.getTracks().forEach(track => track.stop());
      
      // Once safely released, allow LiveKit to mount
      setPermissionsGranted(true);
    } catch (err: any) {
      alert("Could not access camera/mic. Please check your browser permissions.");
    }
  };

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

  // 👇 THE FIX: Show a pre-join screen for the Host to clear old hardware locks 👇
  if (isHost && !permissionsGranted) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4">
        <div className="bg-[#1e293b] p-8 rounded-2xl shadow-xl border border-white/10 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Ready to go live?</h1>
          <p className="text-slate-400 mb-6 text-sm">Click below to allow your browser to use your camera and microphone.</p>
          <button 
            onClick={handleRequestPermissions}
            className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 text-lg"
          >
            Turn On Camera & Mic
          </button>
          <button 
            onClick={() => window.history.back()} 
            className="mt-4 text-sm text-slate-500 hover:text-white underline"
          >
            Cancel and go back
          </button>
        </div>
      </div>
    );
  }

  // 3. Mount LiveKit only after permission is granted
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