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
  const [wsUrl, setWsUrl] = useState('');
  const [error, setError] = useState('');
  const [cameraId, setCameraId] = useState<string | null>(null);

  // 👇 1. FORCE BROWSER TO PROMPT FOR CAMERA AND GET DEVICE ID 👇
  useEffect(() => {
    if (!isHost) return;
    
    const setupCamera = async () => {
      try {
        // This forces the browser popup to allow the camera
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Stop the stream so LiveKit can take over the hardware
        stream.getTracks().forEach(t => t.stop());
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        
        // Look for USB/Webcam, otherwise grab the first available camera
        const usbCam = videoDevices.find(d => d.label.toLowerCase().includes('usb') || d.label.toLowerCase().includes('webcam'));
        if (usbCam) {
          setCameraId(usbCam.deviceId);
        } else if (videoDevices.length > 0) {
          setCameraId(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error("Camera permission failed:", err);
      }
    };
    setupCamera();
  }, [isHost]);

  // 2. Fetch LiveKit Token
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
        setWsUrl(data.url);
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
        // 👇 Tell LiveKit to use the exact camera ID we found 👇
        video={isHost ? (cameraId ? { deviceId: cameraId } : true) : false}
        audio={isHost} 
        token={token}
        serverUrl={wsUrl}
        onDisconnected={() => window.history.back()}
        onMediaDeviceFailure={(e, kind) => {
          console.error("Media Device Failure:", kind, e);
        }}
        className="h-screen"
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}