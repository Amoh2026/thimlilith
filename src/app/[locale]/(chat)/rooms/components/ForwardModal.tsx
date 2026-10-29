'use client';

import React from 'react';

interface ForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: any[];
  getDMName: (room: any) => string;
  onForward: (roomId: string) => void;
}

export default function ForwardModal({ isOpen, onClose, rooms, getDMName, onForward }: ForwardModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-sm mx-4 rounded-2xl bg-[#1e293b] border border-white/10 p-6 shadow-2xl relative flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
        
        <h2 className="text-xl font-bold text-white mb-4">↪️ Forward Message</h2>
        <p className="text-xs text-gray-400 mb-4">Select a room to forward this message to.</p>

        <div className="overflow-y-auto space-y-2 pr-2">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => onForward(room.id)}
              className="w-full flex items-center gap-3 bg-[#0f172a] hover:bg-slate-800 border border-slate-700 p-3 rounded-xl transition-colors text-left"
            >
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-lg">
                {room.type === "direct" ? '👤' : '👥'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {room.type === "direct" ? getDMName(room) : `Thajmaath n ${room.name}`}
                </p>
                <p className="text-xs text-gray-500">{room.type === "direct" ? "Direct Message" : "Community"}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
