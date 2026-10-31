'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function LiveLobby() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [roomName, setRoomName] = useState('');
  
  // TODO: Wire this to your actual AuthContext
  const isPremiumUser = true; 

  const handleStartLive = () => {
    const id = roomName || `live-${Date.now()}`;
    router.push(`/${locale}/live/${id}?host=true`);
  };

  const handleJoinLive = () => {
    if (!roomName) return alert('Enter a Room ID to join');
    router.push(`/${locale}/live/${roomName}?host=false`);
  };

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-200 pt-16 pb-24 px-4">
      <div className="max-w-lg mx-auto mt-8">
        
        {/* 👇 BACK BUTTON HEADER 👇 */}
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => router.back()} 
            className="text-slate-400 hover:text-white p-2 -ml-2 rounded-full hover:bg-slate-800 transition-colors flex items-center justify-center"
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <span className="text-red-500">🔴</span> Go Live
            </h1>
            <p className="text-slate-400 text-sm">Broadcast to your Thajmaath.</p>
          </div>
        </div>
        {/* 👆 END OF BACK BUTTON HEADER 👆 */}
        
        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="Stream Title or Room ID" 
            value={roomName} 
            onChange={(e) => setRoomName(e.target.value)} 
            className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400" 
          />
          
          {isPremiumUser ? (
            <button onClick={handleStartLive} className="w-full bg-teal-400 text-[#0f172a] font-semibold py-3 rounded-xl active:scale-95 transition-transform">
              Start Broadcasting
            </button>
          ) : (
            <div className="bg-[#1e293b] border border-red-500/30 p-4 rounded-xl text-center">
              <p className="text-sm text-slate-300 mb-2">Only Premium creators can broadcast.</p>
              <button className="text-teal-400 text-sm font-medium">Upgrade to Premium</button>
            </div>
          )}

          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-slate-500 text-xs">OR</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <button onClick={handleJoinLive} className="w-full bg-[#1e293b] border border-white/10 text-slate-200 font-medium py-3 rounded-xl active:scale-95 transition-transform">
            Join as Viewer
          </button>
          
          {/* 👇 CANCEL BUTTON 👇 */}
          <button 
            onClick={() => router.back()}
            className="w-full mt-4 bg-transparent text-slate-400 font-medium py-2 rounded-xl hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>

      </div>
    </main>
  );
}