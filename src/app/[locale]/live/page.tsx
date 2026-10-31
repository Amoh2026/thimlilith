'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function LiveLobby() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [roomName, setRoomName] = useState('');

  const handleStartLive = () => {
    const id = roomName || `live-${Date.now()}`;
    router.push(`/${locale}/live/${id}?host=true`);
  };

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-200 pt-16 pb-24 px-4">
      <div className="max-w-lg mx-auto mt-8">
        <h1 className="text-2xl font-semibold mb-2 flex items-center gap-2"><span className="text-red-500">🔴</span> Go Live</h1>
        <p className="text-slate-400 text-sm mb-8">Broadcast to your Thajmaath.</p>
        <div className="space-y-4">
          <input type="text" placeholder="Stream Title or Room ID" value={roomName} onChange={(e) => setRoomName(e.target.value)} className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400" />
          <button onClick={handleStartLive} className="w-full bg-teal-400 text-[#0f172a] font-semibold py-3 rounded-xl active:scale-95 transition-transform">Start Broadcasting</button>
        </div>
      </div>
    </main>
  );
}