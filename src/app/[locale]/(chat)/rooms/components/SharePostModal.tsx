'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface SharePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: any;
  user: User;
  onShare: (roomId: string) => void;
}

export default function SharePostModal({ isOpen, onClose, post, user, onShare }: SharePostModalProps) {
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen || !user) return;
    // Get rooms the user is a member of
    const q = query(collection(db, "rooms"), where("members", "array-contains", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [isOpen, user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm mx-4 rounded-2xl bg-[#1e293b] border border-white/10 p-6 shadow-2xl relative flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
        
        <h2 className="text-xl font-bold text-white mb-2">Share Post</h2>
        <p className="text-xs text-gray-400 mb-4">Send this post to a chat room.</p>

        <div className="overflow-y-auto space-y-2 pr-2">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => onShare(room.id)}
              className="w-full flex items-center gap-3 bg-[#0f172a] hover:bg-slate-800 border border-slate-700 p-3 rounded-xl transition-colors text-left"
            >
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-lg">
                {room.type === "direct" ? '👤' : '👥'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {room.type === "direct" ? "Direct Message" : `Thajmaath n ${room.name}`}
                </p>
              </div>
            </button>
          ))}
          {rooms.length === 0 && <p className="text-center text-gray-500 text-sm">No rooms found.</p>}
        </div>
      </div>
    </div>
  );
}