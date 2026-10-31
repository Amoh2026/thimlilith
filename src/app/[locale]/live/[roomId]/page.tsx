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
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
          body: JSON.stringify({ roomId, isHost }),
        });

        const text = await res.text();
        if (!text) throw new Error(`Server error (Status: ${res.status})`);

        const data = JSON.parse(text);
        if (!res.ok) throw new Error(data.error || `Server error: ${res.status}`);

        setToken(data.token);
      } catch (err: any) {
        setError(err.message);
      }
    });

    return () => unsubscribe();
  }, [roomId, isHost]);

  const handleRequestPermissions = async () => {
    try {
      let stream;
      try {
        // Try the default camera first
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (defaultErr: any) {
        // If the default fails (lid closed), scan for ANY camera and use the first one
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        if (videoDevices.length > 0) {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { deviceId: videoDevices[0].deviceId }, 
            audio: true 
          });
        } else {
          throw defaultErr;
        }
      }
      
      // Stop hardware lock, then allow LiveKit to mount
      stream.getTracks().forEach(track => track.stop());
      setPermissionsGranted(true);
    } catch (err: any) {
      // Tell the user EXACTLY why it failed
      console.error(err);
      if (err.name === 'NotAllowedError') {
        alert("Permission Denied!\n\nPlease click the Lock icon 🔒 in the URL bar and set Camera to 'Allow'.");
      } else if (err.name === 'NotReadableError') {
        alert("Camera is busy!\n\nAnother app (Zoom, Teams, PowerPoint) is using your camera. Close it and try again.");
      } else if (err.name === 'NotFoundError') {
        alert("No Camera Found!\n\nPlease plug in your USB camera.");
      } else {
        alert(`Error: ${err.message}`);
      }
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
          <button onClick={() => window.history.back()} className="mt-4 text-sm text-slate-500 hover:text-white underline">
            Cancel and go back
          </button>
        </div>
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