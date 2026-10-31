'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

type Props = { open: boolean; onClose: () => void; locale: string };

const ACTIONS = [
  { key: 'chat',  icon: '💬', label: 'Start a Chat',  sub: 'Message someone new' },
  { key: 'room',  icon: '🚪', label: 'Create a Room', sub: 'Host a Thajmaath' },
  { key: 'live',  icon: '🔴', label: 'Go Live',       sub: 'Broadcast to your audience' },
  { key: 'video', icon: 'ⴽ', label: 'Video Call',    sub: 'Hybrid: free or premium' },
  { key: 'safety', icon: 'ⵎ', label: 'Safety & Mods', sub: 'Report, block, & appeals' },
] as const;

export default function ActionHub({ open, onClose, locale }: Props) {
  const router = useRouter();
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => sheetRef.current?.querySelector<HTMLElement>('button')?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  const handle = (key: (typeof ACTIONS)[number]['key']) => {
    onClose();
    switch (key) {
      case 'chat': router.push(`/${locale}/chats?compose=true`); break;
      case 'room': router.push(`/${locale}/rooms/create`); break;
      case 'live': router.push(`/${locale}/live`); break;
      case 'video': router.push(`/${locale}/video`); break;
      case 'safety': router.push(`/${locale}/moderation`); break;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Action Hub">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div ref={sheetRef} className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-[#1e293b]/95 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)] animate-slide-up">
        <div className="w-10 h-1 rounded-full bg-slate-600 mx-auto mt-3 mb-4" />
        <div className="px-4 pb-4">
          <h2 className="text-slate-300 text-sm font-medium mb-3 px-1">Action Hub</h2>
          <div className="grid grid-cols-2 gap-3">
            {ACTIONS.map((a) => (
              <button key={a.key} type="button" onClick={() => handle(a.key)} className="flex flex-col items-start justify-between gap-2 min-h-24 p-4 rounded-2xl bg-[#0f172a]/80 border border-white/10 text-left active:scale-95 transition-transform hover:border-teal-400/40">
                <span className="text-2xl" aria-hidden>{a.icon}</span>
                <span>
                  <span className="block text-slate-100 font-medium text-sm">{a.label}</span>
                  <span className="block text-slate-400 text-[11px] mt-0.5">{a.sub}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}