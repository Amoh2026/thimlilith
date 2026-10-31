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
  const [selectedCamera, setSelectedCamera] = useState<string>('default'); // 👈 Default to PC camera

  // 1. Get the list of cameras safely (does not block the UI if permission is denied)
  useEffect(() => {
    const getCameras = async () => {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
        setDevices(videoDevices);
      } catch (err) {
        console.warn("Could not list cameras yet. Waiting for permissions.", err);
      }
    };
    getCameras();
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

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-teal-400">
        <div className="animate-pulse">Connecting to Live Stage...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col" data-lk-theme="default">
      
      {/* 👇 Camera Dropdown (Shows for Hosts with any connected cameras) 👇 */}
      {isHost && (
        <div className="bg-[#1e293b] p-3 flex flex-col sm:flex-row items-center justify-center gap-3 border-b border-white/10 z-50">
          <span className="text-sm text-slate-300 font-medium">Camera:</span>
          <select 
            value={selectedCamera} 
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="bg-[#0f172a] text-white text-sm rounded-lg px-3 py-2 focus:outline-none border border-slate-600 w-full max-w-xs"
          >
            <option value="default">Default PC Camera</option>
            {devices.map((device, idx) => (
              // Only show devices that have a label (meaning permission was granted)
              device.deviceId !== 'default' && device.label && (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `External Camera ${idx + 1}`}
                </option>
              )
            ))}
          </select>
          <span className="text-xs text-slate-500 hidden sm:block">
            (If the list is empty, allow camera access in your browser)
          </span>
        </div>
      )}

      <div className="flex-1">
        <LiveKitRoom
          key={selectedCamera} // 👈 Reconnects instantly when you change the dropdown
          video={isHost ? (selectedCamera === 'default' ? true : { deviceId: selectedCamera }) : false}
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