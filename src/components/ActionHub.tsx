'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { auth } from '@/lib/firebase/client';
import { signOut } from 'firebase/auth';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

type Props = { open: boolean; onClose: () => void; locale: string };

const ACTIONS = [
  { key: 'chat',    icon: '💬', tKey: 'startChat',    tSub: 'startChatSub' },
  { key: 'room',    icon: '🚪', tKey: 'createRoom',   tSub: 'createRoomSub' },
  { key: 'live',    icon: '🔴', tKey: 'goLive',       tSub: 'goLiveSub' },
  { key: 'video',   icon: 'ⴵ',  tKey: 'videoCall',    tSub: 'videoCallSub' },
  { key: 'safety',  icon: 'ⵎ',  tKey: 'safety',       tSub: 'safetySub' },
  { key: 'vault',   icon: 'ⵡ',  tKey: 'myVault',      tSub: 'myVaultSub' },
  { key: 'profile', icon: 'ⵓ',  tKey: 'myProfile',    tSub: 'myProfileSub' },
  { key: 'logout',  icon: '🚪', tKey: 'logout',       tSub: 'logoutSub' },
] as const;

export default function ActionHub({ open, onClose, locale }: Props) {
  const router = useRouter();
  const t = useTranslations('Hub');
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
    const timer = setTimeout(() => sheetRef.current?.querySelector<HTMLElement>('button')?.focus(), 50);
    return () => clearTimeout(timer);
  }, [open]);

  const handle = (key: (typeof ACTIONS)[number]['key']) => {
    onClose();
    switch (key) {
      case 'chat': router.push(`/${locale}/chats?compose=true`); break;
      case 'room': router.push(`/${locale}/rooms/create`); break;
      case 'live': router.push(`/${locale}/live`); break;
      case 'video': router.push(`/${locale}/video`); break;
      case 'safety': router.push(`/${locale}/moderation`); break;
      case 'vault': router.push(`/${locale}/rooms?tab=vault`); break;
      case 'profile': router.push(`/${locale}/profile`); break;
      case 'logout': signOut(auth); break;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t('title')}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div ref={sheetRef} className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-[#1e293b]/95 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)] animate-slide-up">
        <div className="w-10 h-1 rounded-full bg-slate-600 mx-auto mt-3 mb-4" />
        <div className="px-4 pb-4">
          <h2 className="text-slate-300 text-sm font-medium mb-3 px-1">{t('title')}</h2>
          <div className="grid grid-cols-2 gap-3">
            {ACTIONS.map((a) => (
              <button key={a.key} type="button" onClick={() => handle(a.key)} className={`flex flex-col items-start justify-between gap-2 min-h-24 p-4 rounded-2xl bg-[#0f172a]/80 border text-left active:scale-95 transition-transform hover:border-teal-400/40 ${a.key === 'logout' ? 'border-red-500/30' : 'border-white/10'}`}>
                <span className="text-2xl" aria-hidden>{a.icon}</span>
                <span>
                  <span className={`block font-medium text-sm ${a.key === 'logout' ? 'text-red-400' : 'text-slate-100'}`}>{t(a.tKey)}</span>
                  <span className="block text-slate-400 text-[11px] mt-0.5">{t(a.tSub)}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-white/10">
            <h3 className="text-slate-400 text-[11px] font-medium mb-2 px-1 uppercase tracking-wider">Language</h3>
            <LanguageSwitcher onSwitch={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
}