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
  
  // Pre-join state
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);

  // 1. Fetch LiveKit Token
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return setError("You must be logged in.");

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

  // 2. Start Camera Preview (Force enumeration)
  const handleStartPreview = async () => {
    try {
      // Try to get a stream. This forces Chrome to ask for permission.
      let stream;
      try {
        // First, just try the default
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      } catch (err) {
        console.log("Default failed, enumerating devices...");
        throw err;
      }
      
      setPreviewStream(stream);
      
      // Now that we have permission, we can get the labels
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoDevices);
      
      if (videoDevices.length > 0) {
        setSelectedDevice(videoDevices[0].deviceId);
      }

      setPermissionsGranted(true);
    } catch (err: any) {
      console.error(err);
      if (err.name === 'NotAllowedError') {
        setError("Chrome is blocking the camera. Please click the Lock icon 🔒 in the URL bar, set Camera to 'Allow', and refresh the page.");
      } else if (err.name === 'NotFoundError') {
        setError("No camera found. Please plug in your USB camera.");
      } else {
        setError("Could not access camera: " + err.message);
      }
    }
  };

  // 3. Handle switching camera in the preview
  const handleDeviceChange = async (deviceId: string) => {
    setSelectedDevice(deviceId);
    try {
      // Stop old stream
      if (previewStream) {
        previewStream.getTracks().forEach(t => t.stop());
      }
      // Get new stream
      const newStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId }, audio: false });
      setPreviewStream(newStream);
    } catch (err: any) {
      alert("Could not switch to that camera.");
    }
  };

  const handleJoinCall = () => {
    // Stop preview stream to free hardware before LiveKit takes over
    if (previewStream) {
      previewStream.getTracks().forEach(t => t.stop());
    }
    setPermissionsGranted(true);
    // Use a small delay to ensure Chrome fully releases the camera hardware
    setTimeout(() => {
      setPermissionsGranted(true);
    }, 500);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-red-400 p-4 text-center">
        <p className="mb-4 text-sm bg-red-500/10 p-4 rounded-xl border border-red-500/20 max-w-md">{error}</p>
        <button onClick={() => window.history.back()} className="text-teal-400 underline">Go Back</button>
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

  // PRE-JOIN SCREEN
  if (isHost && !permissionsGranted) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4">
        <div className="bg-[#1e293b] p-8 rounded-2xl shadow-xl border border-white/10 max-w-lg w-full text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Camera Setup</h1>
          <p className="text-slate-400 mb-6 text-sm">Allow access and select your USB camera.</p>
          
          <button 
            onClick={handleStartPreview}
            className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 text-lg"
          >
            Allow Camera Access
          </button>
        </div>
      </div>
    );
  }

  // PREVIEW SCREEN (Once permission granted)
  if (isHost && permissionsGranted && previewStream) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4">
        <div className="bg-[#1e293b] p-6 rounded-2xl shadow-xl border border-white/10 max-w-lg w-full">
          <h1 className="text-xl font-bold text-white mb-4 text-center">Select USB Camera</h1>
          
          <div className="bg-black rounded-xl overflow-hidden aspect-video mb-4">
            <video 
              autoPlay 
              playsInline 
              muted 
              ref={el => { if (el) el.srcObject = previewStream; }}
              className="w-full h-full object-cover"
            />
          </div>

          <select 
            value={selectedDevice} 
            onChange={(e) => handleDeviceChange(e.target.value)}
            className="w-full bg-[#0f172a] text-white text-sm rounded-lg px-3 py-3 mb-4 focus:outline-none border border-slate-600"
          >
            {devices.map((d, idx) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${idx + 1}`}
              </option>
            ))}
          </select>

          <button 
            onClick={handleJoinCall}
            className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95 text-lg"
          >
            Enter Live Stage
          </button>
        </div>
      </div>
    );
  }

  // LIVEKIT ROOM (Once joined)
  return (
    <div className="min-h-screen bg-[#0f172a]" data-lk-theme="default">
      <LiveKitRoom
        video={isHost ? { deviceId: selectedDevice } : false} // Force the exact USB camera
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