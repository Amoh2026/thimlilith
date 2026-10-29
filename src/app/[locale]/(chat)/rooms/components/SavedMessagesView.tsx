'use client';

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '@/lib/firebase/client';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';

export function SavedMessagesView({ user }: { user: User }) {
  const [savedMessages, setSavedMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "savedMessages"),
      orderBy("savedAt", "desc")
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setSavedMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this message from your Vault?")) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "savedMessages", id));
    } catch (err) {
      alert("Failed to delete message.");
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard! 📋");
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading your Vault...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-[#0f172a] w-full overflow-y-auto">
      <div className="p-4 border-b border-slate-800 sticky top-0 bg-[#0f172a] z-10">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          ⭐ My Vault
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          {savedMessages.length} saved message{savedMessages.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="p-3 flex flex-col gap-3">
        {savedMessages.length === 0 && (
          <div className="text-center text-gray-500 mt-10 p-4">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-sm">Your Vault is empty.</p>
            <p className="text-xs mt-2 opacity-70">Hover over any message in a chat and click the ⭐ to save it here.</p>
          </div>
        )}

        {savedMessages.map((msg) => (
          <div key={msg.id} className="bg-[#1e293b] border border-slate-700 rounded-xl p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-xs text-teal-400 font-bold">{msg.senderName}</p>
                <p className="text-[10px] text-gray-500">from {msg.roomName || "Direct Message"}</p>
              </div>
              <span className="text-[10px] text-gray-500">
                {msg.savedAt ? new Date(msg.savedAt.toMillis()).toLocaleDateString() : ''}
              </span>
            </div>
            
            {msg.type === 'text' ? (
              <p className="text-sm text-gray-200 break-words bg-[#0f172a] p-3 rounded-lg border border-slate-700/50">
                {msg.text}
              </p>
            ) : (
              <div className="text-sm text-gray-400 italic bg-[#0f172a] p-3 rounded-lg border border-slate-700/50">
                [📎 {msg.type.toUpperCase()} Media]
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <button 
                onClick={() => handleCopy(msg.text || "")}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs py-1.5 rounded transition"
                disabled={!msg.text}
              >
                📋 Copy
              </button>
              <button 
                onClick={() => handleDelete(msg.id)}
                className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs py-1.5 rounded transition border border-red-900/50"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}