// src/app/[locale]/discover/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { db, auth } from '@/lib/firebase/client';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function DiscoverPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale || 'en';

  const [user, setUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) router.push(`/${locale}/rooms`);
    });
    return () => unsubscribe();
  }, [router, locale]);

  useEffect(() => {
    if (!user) return;
    // Fetch all group rooms
    const q = query(collection(db, "rooms"), where("type", "==", "group"));
    const unsub = onSnapshot(q, (snap) => {
      setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleJoin = async (room: any) => {
    if (!user) return;
    setJoiningId(room.id);

    if (room.isPaid) {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ type: 'room_join', roomId: room.id, amount: room.price })
        });
        const data = await res.json();
        if (data.url) window.location.href = data.url;
        else alert(data.error || 'Failed to start checkout');
      } catch (err: any) {
        alert("Error: " + err.message);
      }
    } else {
      try {
        const roomRef = doc(db, "rooms", room.id);
        await updateDoc(roomRef, {
          members: arrayUnion(user.uid),
          [`memberNames.${user.uid}`]: user.displayName || user.email?.split('@')[0] || "User"
        });
        router.push(`/${locale}/rooms`);
      } catch (err: any) {
        alert("Failed to join room: " + err.message);
      }
    }
    setJoiningId(null);
  };

  if (loading) return <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">Discovering Communities...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-300">
      
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <Link href={`/${locale}/rooms`} className="text-teal-400 hover:text-teal-300 font-medium text-sm flex items-center gap-2">
          ← Back to Chat
        </Link>
        <h1 className="text-white font-bold text-lg">🧭 Discover</h1>
        <div className="w-20"></div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <p className="text-gray-400 text-sm mb-4">Find new Kabyle communities to join.</p>
        
        {rooms.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            <p className="text-4xl mb-2">🏜️</p>
            <p>No public communities found yet.</p>
          </div>
        )}

        {rooms.map(room => {
          const isMember = room.members?.includes(user.uid);
          
          return (
            <div key={room.id} className="bg-[#1e293b] border border-slate-700 rounded-2xl p-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center text-2xl">
                  👥
                </div>
                <div>
                  <h3 className="text-white font-bold capitalize">Thajmaath n {room.name}</h3>
                  <p className="text-xs text-gray-400">{room.members?.length || 0} Members</p>
                </div>
              </div>

              {isMember ? (
                <button 
                  onClick={() => router.push(`/${locale}/rooms`)}
                  className="bg-slate-700 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Joined
                </button>
              ) : (
                <button 
                  onClick={() => handleJoin(room)}
                  disabled={joiningId === room.id}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition disabled:opacity-50 ${room.isPaid ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-teal-600 hover:bg-teal-500 text-white'}`}
                >
                  {joiningId === room.id ? 'Processing...' : room.isPaid ? `🔒 €${room.price}/mo` : 'Join'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}