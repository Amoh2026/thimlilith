// src/components/DesktopActionHub.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { auth } from '@/lib/firebase/client';
import { signOut } from 'firebase/auth';

export default function DesktopActionHub() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('Hub');
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const navigate = (path: string) => {
    setIsOpen(false);
    router.push(`/${locale}${path}`);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Active state: White text with teal bg. Inactive: Teal text */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors font-bold text-xl ${isOpen ? 'bg-teal-500/20 text-white' : 'hover:bg-slate-800 text-teal-500 hover:text-white'}`}
        title={t('title')}
      >
        <span>ⵎ</span>
      </button>

      {isOpen && (
        <>
          {/* Caret Arrow */}
          <div className="absolute -top-1.5 right-3.5 w-3 h-3 bg-[#1e293b] border-t border-l border-white/10 rotate-45 transform origin-center z-10"></div>

          <div className="absolute right-0 mt-2 w-56 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            
            <button onClick={() => navigate('/chats')} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3">
              <span className="text-lg">💬</span> {t('startChat')}
            </button>
            
            <button onClick={() => navigate('/rooms/create')} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3">
              <span className="text-lg">🚪</span> {t('createRoom')}
            </button>
            
            <button onClick={() => navigate('/live')} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3">
              <span className="text-lg">🔴</span> {t('goLive')}
            </button>
            
            <button onClick={() => navigate('/video')} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3">
              <span className="text-lg text-teal-500 font-bold">ⴵ</span> {t('videoCall')}
            </button>

            <div className="h-px bg-white/10 my-1"></div>

            <button onClick={() => navigate('/rooms?tab=vault')} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3">
              <span className="text-lg text-teal-500 font-bold">ⵡ</span> {t('myVault')}
            </button>

            <button onClick={() => navigate('/profile')} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3">
              <span className="text-lg text-teal-500 font-bold">ⵓ</span> {t('myProfile')}
            </button>

            <div className="h-px bg-white/10 my-1"></div>
            
            <button onClick={() => navigate('/moderation')} className="w-full text-left px-4 py-3 text-sm text-slate-400 hover:bg-slate-700 flex items-center gap-3">
              <span className="text-lg text-teal-500 font-bold">ⵎ</span> {t('safety')}
            </button>

            <div className="h-px bg-white/10 my-1"></div>

            <button onClick={() => { setIsOpen(false); signOut(auth); }} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3">
              <span className="text-lg">🚪</span> {t('logout')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}