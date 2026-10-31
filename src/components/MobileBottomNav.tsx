'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');
  const [uid, setUid] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid);
    });
    return () => unsub();
  }, []);

  const isActive = (path: string, tab?: string) => {
    if (tab) return pathname === path && currentTab === tab;
    return pathname === path && !currentTab;
  };

  // Hide bottom nav on auth screens
  if (pathname.includes('/account/') || pathname.includes('/sso')) return null;

  return (
    <>
      {/* Invisible overlay to close menu when clicking outside */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[190]" onClick={() => setIsMenuOpen(false)} />
      )}

      {/* Main Container: Reduced top padding and adjusted safe-area bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[200] bg-[#0f172a]/95 backdrop-blur-md border-t border-slate-800 flex justify-between items-center px-2 pt-1 pb-[env(safe-area-inset-bottom)] h-[60px]">
        
        {/* FLOATING MORE MENU */}
        {isMenuOpen && (
          <div className="absolute bottom-full mb-1 right-2 bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl py-2 w-48 flex flex-col z-[210]">
            <Link href="/dashboard" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-slate-700 hover:text-white">
              <span className="text-xl text-teal-400">ⵜ</span> Creator Dashboard
            </Link>
            <Link href="/rooms" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-slate-700 hover:text-white">
              <span className="text-xl text-teal-400">➕</span> New Room
            </Link>
            <a href="https://apprendrethamazightkabyle.com" target="_blank" rel="noreferrer" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-slate-700 hover:text-white">
              <span className="text-xl text-purple-400">ⵣ</span> Go to ATK
            </a>
          </div>
        )}

        {/* MAIN NAV ITEMS */}
        <Link href="/rooms" className={`flex flex-col items-center justify-center w-12 gap-0.5 ${isActive('/rooms') || isActive('/en/rooms') || isActive('/fr/rooms') ? 'text-teal-400' : 'text-gray-400'}`}>
          <span className="text-[22px] font-bold leading-none">ⵣ</span>
          <span className="text-[10px] leading-tight">Chats</span>
        </Link>
        
        <Link href="/feed" className={`flex flex-col items-center justify-center w-12 gap-0.5 ${isActive('/feed') || pathname.includes('/feed') ? 'text-teal-400' : 'text-gray-400'}`}>
          <span className="text-[22px] font-bold leading-none">ⴼ</span>
          <span className="text-[10px] leading-tight">Feed</span>
        </Link>
        
        <Link href="/discover" className={`flex flex-col items-center justify-center w-12 gap-0.5 ${isActive('/discover') || pathname.includes('/discover') ? 'text-teal-400' : 'text-gray-400'}`}>
          <span className="text-[22px] font-bold leading-none">ⴷ</span>
          <span className="text-[10px] leading-tight">Discover</span>
        </Link>
        
        <Link href="/rooms?tab=vault" className={`flex flex-col items-center justify-center w-12 gap-0.5 ${currentTab === 'vault' ? 'text-teal-400' : 'text-gray-400'}`}>
          <span className="text-[22px] font-bold leading-none">ⵡ</span>
          <span className="text-[10px] leading-tight">Vault</span>
        </Link>
        
        <Link href={uid ? `/profile/${uid}` : '/profile'} className={`flex flex-col items-center justify-center w-12 gap-0.5 ${pathname.includes('/profile') ? 'text-teal-400' : 'text-gray-400'}`}>
          <span className="text-[22px] font-bold leading-none">ⵓ</span>
          <span className="text-[10px] leading-tight">Profile</span>
        </Link>

        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)} 
          className={`flex flex-col items-center justify-center w-12 gap-0.5 ${isMenuOpen ? 'text-teal-400' : 'text-gray-400'}`}
        >
          <span className="text-[22px] font-bold leading-none">ⵎ</span>
          <span className="text-[10px] leading-tight">More</span>
        </button>
      </div>
    </>
  );
}