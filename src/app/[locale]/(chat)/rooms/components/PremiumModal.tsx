'use client';

import React from 'react';

export type LimitType = 'translate' | 'transcribe';

interface PremiumModalProps {
  open: boolean;
  type: LimitType;
  onClose: () => void;
}

const COPY: Record<LimitType, { title: string; body: string }> = {
  translate: {
    title: 'Daily translation limit reached',
    body: "You've used all 5 free AI translations for today. Upgrade to Premium for unlimited translations.",
  },
  transcribe: {
    title: 'Daily voice-note limit reached',
    body: "You've used all 5 free voice transcriptions for today. Upgrade to Premium for unlimited voice notes.",
  },
};

export default function PremiumModal({ open, type, onClose }: PremiumModalProps) {
  if (!open) return null;
  const { title, body } = COPY[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 rounded-2xl bg-[#1e293b] border border-white/10 p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div className="text-3xl">💎</div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-sm text-gray-300 mb-6">{body}</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => { window.location.href = '/pricing'; }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:opacity-90 transition"
          >
            Go Premium →
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl text-gray-400 hover:text-white text-sm"
          >
            Maybe later
          </button>
        </div>
        <p className="text-[10px] text-center text-gray-500 mt-4">
          The app is free until 31 December 2026.
        </p>
      </div>
    </div>
  );
}
