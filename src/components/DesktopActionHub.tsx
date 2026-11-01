'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth } from '@/lib/firebase/client';
import { signOut } from 'firebase/auth';

export default function DesktopActionHub() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
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
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-800 transition-colors text-slate-300"
        title="Action Hub"
      >
        <span className="text-xl font-bold">ⵎ</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          
          <button onClick={() => navigate('/chats')} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3">
            <span className="text-lg">💬</span> Start a Chat
          </button>
          
          <button onClick={() => navigate('/rooms/create')} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3">
            <span className="text-lg">🚪</span> Create a Room
          </button>
          
          <button onClick={() => navigate('/live')} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3">
            <span className="text-lg">🔴</span> Go Live
          </button>
          
          <button onClick={() => navigate('/video')} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3">
            <span className="text-lg">ⴽ</span> Video Call
          </button>

          <div className="h-px bg-white/10 my-1"></div>

          <button onClick={() => navigate('/rooms?tab=vault')} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3">
            <span className="text-lg">ⵡ</span> My Vault
          </button>

          <button onClick={() => navigate('/profile')} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3">
            <span className="text-lg">ⵓ</span> My Profile
          </button>

          <div className="h-px bg-white/10 my-1"></div>
          
          <button onClick={() => navigate('/moderation')} className="w-full text-left px-4 py-3 text-sm text-slate-400 hover:bg-slate-700 flex items-center gap-3">
            <span className="text-lg">ⵎ</span> Safety & Mods
          </button>

          <div className="h-px bg-white/10 my-1"></div>

          <button onClick={() => { setIsOpen(false); signOut(auth); }} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3">
            <span className="text-lg">🚪</span> Log Out
          </button>
        </div>
      )}
    </div>
  );
}