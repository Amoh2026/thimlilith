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
  
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');

  // 1. Wake up the camera and get the list safely
  useEffect(() => {
    const initCamera = async () => {
      try {
        // This forces the browser permission prompt
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Stop the stream immediately so it frees the hardware
        stream.getTracks().forEach(track => track.stop());

        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
        setDevices(videoDevices);

        // Auto-select the USB camera if we find one
        const usbCam = videoDevices.find(d => d.label.toLowerCase().includes('usb') || d.label.toLowerCase().includes('external'));
        if (usbCam) {
          setSelectedCamera(usbCam.deviceId);
        } else if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.warn("Initial camera check failed:", err);
      }
    };
    initCamera();
  }, []);

  // 2. Fetch LiveKit Token
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
        <p className="mb-4 text-sm bg-red-500/10 p-4 rounded-xl">{error}</p>
        <button onClick={() => window.history.back()} className="text-teal-400 underline">Go Back</button>
      </div>
    );
  }

  // Wait for both token and camera list
  if (!token || (isHost && devices.length > 0 && !selectedCamera)) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-teal-400">
        <div className="animate-pulse">Connecting to Live Stage...</div>
        {isHost && <p className="text-xs text-slate-500 mt-2">Scanning for cameras...</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col" data-lk-theme="default">
      
      {/* Camera Dropdown */}
      {isHost && (
        <div className="bg-[#1e293b] p-3 flex flex-col sm:flex-row items-center justify-center gap-3 border-b border-white/10 z-50">
          <span className="text-sm text-slate-300 font-medium">Select Camera:</span>
          <select 
            value={selectedCamera} 
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="bg-[#0f172a] text-white text-sm rounded-lg px-3 py-2 focus:outline-none border border-slate-600 w-full max-w-xs"
          >
            <option value="">System Default</option>
            {devices.map((device, idx) => (
              device.deviceId !== 'default' && (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `External Camera ${idx + 1}`}
                </option>
              )
            ))}
          </select>
        </div>
      )}

      <div className="flex-1">
        <LiveKitRoom
          key={selectedCamera || 'default'} // This forces a full refresh when you change cameras
          video={isHost ? (selectedCamera ? { deviceId: selectedCamera } : true) : false}
          audio={isHost} 
          token={token}
          serverUrl={wsUrl}
          onDisconnected={() => window.history.back()}
          className="h-full"
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  );
}