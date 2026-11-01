'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LiveLobby() {
  const [roomId, setRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGoLive = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // If the user didn't type a room ID, generate a random one
    const finalRoomId = roomId.trim() || `live-${Math.floor(Math.random() * 10000)}`;
    
    // Redirect to the Live Room we just built, passing ?host=true
    router.push(`/en/live/${finalRoomId}?host=true`);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1e293b] p-8 rounded-2xl border border-white/10 shadow-2xl">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse"></div>
          <h1 className="text-2xl font-bold text-white">Go Live</h1>
        </div>
        
        <p className="text-gray-400 mb-8">Broadcast to your Thajmaath.</p>

        <form onSubmit={handleGoLive} className="flex flex-col gap-4">
          <div>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Stream Title or Room ID (Optional)"
              className="w-full bg-[#0f172a] text-white border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-400"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-colors mt-2"
          >
            {isLoading ? 'Connecting...' : 'Start Broadcasting'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10">
          <button
            onClick={() => router.push('/en/rooms')}
            className="text-teal-400 text-sm hover:underline"
          >
            ← Back to Rooms
          </button>
        </div>
        
      </div>
    </div>
  );
}