'use client';
import React from 'react';

export default function VaultFullModal({ isOpen, onClose, isPremium }: { isOpen: boolean, onClose: () => void, isPremium: boolean }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md mx-4 rounded-2xl bg-[#1e293b] border border-white/10 p-6 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
        
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">⭐</div>
          <h2 className="text-2xl font-bold text-white mb-2">Your Vault is Full!</h2>
          <p className="text-gray-300">You have reached your limit of {isPremium ? '10' : '6'} saved messages.</p>
        </div>

        <div className="space-y-3">
          <button onClick={() => { onClose(); window.location.href = '/en/rooms?tab=vault'; }} className="w-full py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold transition">
            Manage My Vault
          </button>
          
          {!isPremium && (
            <button onClick={() => { onClose(); window.location.href = '/pricing'; }} className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white font-bold transition shadow-lg shadow-amber-500/20">
              💎 Upgrade to Premium (10 Slots)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}