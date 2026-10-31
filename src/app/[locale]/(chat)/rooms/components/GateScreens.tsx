// src/app/[locale]/(chat)/rooms/components/GateScreens.tsx
"use client";

import React from 'react';

// ─── Banned Screen ───────────────────────────────────────────────────────
export function BannedScreen({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#0f172a] text-white">
      <h1 className="text-3xl font-bold text-red-500 mb-4">Account Banned</h1>
      <p className="text-gray-400 mb-8 text-center max-w-md">You have been banned for violating the Community Charter.</p>
      <button onClick={onLogout} className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded-lg">Logout</button>
    </div>
  );
}

// ─── Muted Screen ────────────────────────────────────────────────────────
export function MutedScreen({ mutedUntil, onLogout }: { mutedUntil: string | null; onLogout: () => void }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#0f172a] text-white">
      <h1 className="text-3xl font-bold text-yellow-500 mb-4">🔇 You are muted</h1>
      <p className="text-gray-400 mb-2 text-center max-w-md">You cannot send messages until your mute expires.</p>
      <p className="text-sm text-gray-500 mb-8">Mute ends: {mutedUntil ? new Date(mutedUntil).toLocaleString() : 'Unknown'}</p>
      <button onClick={onLogout} className="bg-gray-600 hover:bg-gray-500 px-6 py-2 rounded-lg">Logout</button>
    </div>
  );
}

// ─── Charter Screen ──────────────────────────────────────────────────────
export function CharterScreen({ onAccept, onLogout }: { onAccept: () => void; onLogout: () => void }) {
  return (
    <div className="flex h-screen items-center justify-center bg-[#0f172a] p-4">
      <div className="w-full max-w-2xl bg-[#1e293b] p-8 rounded-2xl shadow-2xl border border-teal-500/50">
        <div className="flex justify-center mb-4"><span className="text-5xl">ⵣ</span></div>
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Welcome to Thimlilith</h1>
        <p className="text-center text-teal-400 mb-8 font-medium">The Laws of the Gathering (Aɣtas n Thimlilith)</p>
        <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-700 mb-6 text-gray-300 space-y-4 text-sm leading-relaxed">
          <p><strong className="text-white">1. Respect ⵣ</strong> — No insults, hate speech, or discrimination.</p>
          <p><strong className="text-white">2. Kabyle First</strong> — This is a learning space. Be patient with beginners.</p>
          <p><strong className="text-white">3. No Spam</strong> — No advertising, political propaganda, or repeated messages.</p>
          <p><strong className="text-white">4. Privacy</strong> — Do not record video calls or share others' personal information without consent.</p>
          <p><strong className="text-white">5. Consequences</strong> — Violations result in warnings, mutes, or permanent bans.</p>
        </div>
        <div className="flex flex-col gap-3">
          <button onClick={onAccept} className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-lg">I Accept the Community Rules</button>
          <button onClick={onLogout} className="w-full text-gray-400 hover:text-white text-sm py-2">I do not accept (Logout)</button>
        </div>
      </div>
    </div>
  );
}