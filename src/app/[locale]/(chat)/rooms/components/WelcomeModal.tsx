'use client';

import React from 'react';

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ open, onClose }: WelcomeModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 rounded-2xl bg-[#1e293b] border border-white/10 p-8 shadow-2xl overflow-hidden relative">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>

        <div className="relative z-10">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">ⵜⵉⵎⵍⵉⵍⵉⵜ</h1>
            <p className="text-teal-400 font-medium">Welcome to Thimlilith</p>
          </div>

          <p className="text-gray-300 text-center mb-8">
            The gathering place for the Kabyle community. Connect, learn, and preserve our language together.
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💬</span>
              <div>
                <h3 className="text-white font-semibold">Chat in Kabyle</h3>
                <p className="text-sm text-gray-400">Join rooms, send voice notes, and talk with native speakers.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <h3 className="text-white font-semibold">AI Translation</h3>
                <p className="text-sm text-gray-400">Translate messages instantly. Free users get 5 translations/day.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📚</span>
              <div>
                <h3 className="text-white font-semibold">Grow the Dictionary</h3>
                <p className="text-sm text-gray-400">Save words you learn to your personal vocabulary and to the ATK dictionary.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🌞</span>
              <div>
                <h3 className="text-white font-semibold">Word of the Day</h3>
                <p className="text-sm text-gray-400">Learn a new Kabyle word every morning from our bot.</p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-500 transition shadow-lg shadow-teal-500/20"
          >
            Start Chatting →
          </button>
        </div>
      </div>
    </div>
  );
}
