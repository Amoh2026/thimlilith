// src/app/[locale]/live/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation'; // 👈 Added useParams
import { db, auth } from '@/lib/firebase/client';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useTranslations } from 'next-intl';

export default function LiveLobby() {
  const t = useTranslations('Live');
  const [roomId, setRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const params = useParams(); // 👈 Get current locale
  const locale = (params?.locale as string) || 'en';

  const handleGoLive = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const user = auth.currentUser;
    if (!user) {
      alert(t('mustBeLoggedIn'));
      setIsLoading(false);
      return;
    }

    // Generate a room ID if the user didn't type one
    const finalRoomId = roomId.trim() || `live-${Math.floor(Math.random() * 10000)}`;
    
    try {
      // 🚨 THE FIX: Save the room to Firestore so the Egress API knows you are the host!
      await setDoc(doc(db, 'rooms', finalRoomId), {
        name: finalRoomId,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        type: 'live',
        isLive: false,
        members: [user.uid]
      }, { merge: true });

      // 👈 FIXED: Use dynamic locale instead of hardcoded 'en'
      router.push(`/${locale}/live/${finalRoomId}?host=true`);
    } catch (error) {
      console.error("Error creating room:", error);
      alert(t('failedToStart'));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1e293b] p-8 rounded-2xl border border-white/10 shadow-2xl">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse"></div>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
        </div>
        
        <p className="text-gray-400 mb-8">{t('broadcastTo')}</p>

        <form onSubmit={handleGoLive} className="flex flex-col gap-4">
          <div>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder={t('streamTitlePlaceholder')}
              className="w-full bg-[#0f172a] text-white border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-400"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-colors mt-2"
          >
            {isLoading ? t('connecting') : t('startBroadcasting')}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10">
          {/* 👈 FIXED: Added translation and dynamic locale */}
          <button
            onClick={() => router.push(`/${locale}/rooms`)}
            className="text-teal-400 text-sm hover:underline"
          >
            {t('backToRooms')}
          </button>
        </div>
        
      </div>
    </div>
  );
}