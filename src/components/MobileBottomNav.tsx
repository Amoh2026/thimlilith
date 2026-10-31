'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useParams } from 'next/navigation'; // 👈 added useParams
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import ActionHub from './ActionHub';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const currentTab = searchParams.get('tab');
  const [uid, setUid] = useState<string | null>(null);
  const [hubOpen, setHubOpen] = useState(false); // 👈 replaced isMenuOpen

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

  // Hide bottom nav on auth screens and full-screen immersive routes
  if (
    pathname.includes('/account/') ||
    pathname.includes('/sso') ||
    pathname.includes('/live/') ||   // hide on /live/[roomId] but not /live lobby
    pathname.includes('/call')       // hide on /room/[id]/call
  ) return null;

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[200] bg-[#0f172a]/95 backdrop-blur-md border-t border-slate-800 flex justify-between items-center px-2 pt-1 pb-[env(safe-area-inset-bottom)] h-[60px]">

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

        {/* ACTION HUB TRIGGER */}
        <button
          type="button"
          onClick={() => setHubOpen(true)}
          className={`flex flex-col items-center justify-center w-12 gap-0.5 ${hubOpen ? 'text-teal-400' : 'text-gray-400'}`}
          aria-label="Action Hub"
          aria-haspopup="dialog"
          aria-expanded={hubOpen}
        >
          <span className="text-[22px] font-bold leading-none">ⵎ</span>
          <span className="text-[10px] leading-tight">More</span>
        </button>
      </div>

      {/* ACTION HUB SHEET */}
      <ActionHub
        open={hubOpen}
        onClose={() => setHubOpen(false)}
        locale={locale}
      />
    </>
  );
}