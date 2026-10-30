'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: { id: string; name: string } | null;
  isFriend: boolean;
  isSelf: boolean;
  onSendDM: () => void;
  onAddFriend: () => void;
  onBlock: () => void;
  onReport: () => void;
}

export default function UserActionModal({
  isOpen,
  onClose,
  targetUser,
  isFriend,
  isSelf,
  onSendDM,
  onAddFriend,
  onBlock,
  onReport
}: UserActionModalProps) {
  const router = useRouter();
  const [showSafety, setShowSafety] = useState(false);

  if (!isOpen || !targetUser) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-sm mx-4 rounded-2xl bg-[#1e293b] border border-white/10 p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
        
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center text-3xl mb-3 shadow-inner">
            👤
          </div>
          <h2 className="text-xl font-bold text-white">{targetUser.name}</h2>
          {isSelf && <p className="text-xs text-teal-400 mt-1">This is you</p>}
        </div>

        <div className="space-y-2">
          {!isSelf && (
            <>
              {/* View Profile */}
              <button 
                onClick={() => { 
                  onClose(); 
                  router.push(`/en/profile/${targetUser.id}`); 
                }} 
                className="w-full flex items-center gap-3 bg-[#0f172a] hover:bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl transition-colors font-medium mb-2"
              >
                <span>👤</span> View Profile
              </button>

              {/* Send Message */}
              <button onClick={onSendDM} className="w-full flex items-center gap-3 bg-teal-600 hover:bg-teal-500 text-white px-4 py-3 rounded-xl transition-colors font-medium">
                <span>💬</span> Send Message
              </button>
              
              {/* Add Friend */}
              {!isFriend ? (
                <button onClick={onAddFriend} className="w-full flex items-center gap-3 bg-[#0f172a] hover:bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl transition-colors font-medium">
                  <span>➕</span> Add to Friends
                </button>
              ) : (
                <button disabled className="w-full flex items-center gap-3 bg-[#0f172a] border border-slate-700 text-gray-400 px-4 py-3 rounded-xl cursor-not-allowed font-medium">
                  <span>✅</span> Already Friends
                </button>
              )}

              <div className="border-t border-slate-700 my-2 pt-2"></div>

              {/* SAFETY TOGGLE */}
              {!showSafety ? (
                <button 
                  onClick={() => setShowSafety(true)} 
                  className="w-full flex items-center gap-3 text-gray-400 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-xl transition-colors text-sm font-medium"
                >
                  <span className="text-base font-bold">ⵎ</span> Safety & Moderation
                </button>
              ) : (
                <div className="bg-[#0f172a] p-2 rounded-xl border border-slate-700 space-y-1">
                  <button onClick={onBlock} className="w-full flex items-center gap-3 text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors text-sm">
                    <span>🚫</span> Block User
                  </button>
                  <button onClick={onReport} className="w-full flex items-center gap-3 text-amber-400 hover:bg-amber-500/10 px-4 py-2 rounded-lg transition-colors text-sm">
                    <span>⚠️</span> Report User
                  </button>
                  <button onClick={() => setShowSafety(false)} className="w-full text-center text-xs text-gray-500 hover:text-gray-300 pt-1">
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}