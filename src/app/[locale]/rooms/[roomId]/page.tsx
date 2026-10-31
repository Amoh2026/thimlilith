'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { resolveVideoCall, openVideoCall } from '@/lib/video';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string;
  const locale = (params?.locale as string) || 'en';

  const [room, setRoom] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!roomId) return;
    const fetchRoom = async () => {
      try {
        const snap = await getDoc(doc(db, 'rooms', roomId));
        if (snap.exists()) {
          setRoom({ id: snap.id, ...snap.data() });
        } else {
          setRoom(null);
        }
      } catch (err) {
        console.error("Error fetching room", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [roomId]);

  const handleCheckout = async () => {
    if (!user || !room) return;
    setCheckingOut(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          type: 'room_join', // 👈 Matches your backend logic!
          roomId: room.id, 
          amount: room.price 
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start checkout');
      }
    } catch (err: any) {
      alert("Failed to connect to Stripe: " + err.message);
    } finally {
      setCheckingOut(false);
    }
  };

  const handleVideoCall = () => {
    if (!room) return;
    const isPremiumUser = false; // TODO: Wire to real auth premium check
    const res = resolveVideoCall({
      roomId: room.id,
      isPaidRoom: room.isPaid,
      isPremiumUser,
      locale
    });
    openVideoCall(res, router);
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-teal-400">Loading Room...</div>;
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-slate-200">
        <h1 className="text-xl font-semibold mb-2">Room not found</h1>
        <button onClick={() => router.push(`/${locale}/discover`)} className="text-teal-400 underline">Go to Discover</button>
      </div>
    );
  }

  const isMember = user && room.members?.includes(user.uid);
  const needsToPay = room.isPaid && !isMember;

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-200 pt-16 pb-24 px-4">
      <div className="max-w-lg mx-auto mt-8">
        
        {/* Header */}
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-white/10 mb-6">
          <h1 className="text-2xl font-bold mb-2">{room.name}</h1>
          <p className="text-slate-400 text-sm mb-4">{room.description || 'No description provided.'}</p>
          
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full">
              {room.members?.length || 0} Members
            </span>
            {room.isPaid && (
              <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full">
                €{room.price}/mo
              </span>
            )}
          </div>
        </div>

        {/* Action Area */}
        <div className="space-y-4">
          {needsToPay ? (
            <div className="bg-[#1e293b] border border-yellow-500/30 p-6 rounded-2xl text-center">
              <p className="text-slate-300 mb-4 text-sm">This is a premium Thajmaath. Join to unlock the community and video calls.</p>
              <button 
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full bg-yellow-500 text-[#0f172a] font-bold py-3 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
              >
                {checkingOut ? 'Redirecting to Stripe...' : `Subscribe for €${room.price}/mo`}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleVideoCall}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-teal-400 text-[#0f172a] font-semibold active:scale-95 transition-transform"
              >
                <span className="text-2xl mb-1">ⴽ</span>
                Video Call
              </button>
              <button 
                onClick={() => router.push(`/${locale}/live/live-${room.id}?host=true`)}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#1e293b] border border-white/10 text-slate-200 font-semibold active:scale-95 transition-transform"
              >
                <span className="text-2xl mb-1">🔴</span>
                Go Live
              </button>
            </div>
          )}

          {/* Placeholder for Chat/Feed inside the room */}
          <div className="bg-[#1e293b] border border-white/10 p-6 rounded-2xl text-center text-slate-500 text-sm mt-8">
            Room Chat & Feed coming soon.
          </div>
        </div>

      </div>
    </main>
  );
}