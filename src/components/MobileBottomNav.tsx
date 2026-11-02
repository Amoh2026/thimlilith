'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import ActionHub from './ActionHub';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const t = useTranslations('Nav');
  const locale = (params?.locale as string) || 'en';
  const currentTab = searchParams.get('tab');
  const [uid, setUid] = useState<string | null>(null);
  const [hubOpen, setHubOpen] = useState(false);

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
    pathname.includes('/live/') ||   
    pathname.includes('/call')       
  ) return null;

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[200] bg-[#0f172a]/95 backdrop-blur-md border-t border-slate-800 flex justify-between items-center px-2 pt-1 pb-[env(safe-area-inset-bottom)] h-[60px]">

        {/* CHATS */}
        <Link href="/rooms" className={`flex flex-col items-center justify-center w-12 gap-0.5 ${isActive('/rooms') || isActive('/en/rooms') || isActive('/fr/rooms') ? 'text-teal-400' : 'text-gray-400'}`}>
          <span className="text-[22px] font-bold leading-none">ⵣ</span>
          <span className="text-[10px] leading-tight">{t('chats')}</span>
        </Link>

        {/* FEED */}
        <Link href="/feed" className={`flex flex-col items-center justify-center w-12 gap-0.5 ${isActive('/feed') || pathname.includes('/feed') ? 'text-teal-400' : 'text-gray-400'}`}>
          <span className="text-[22px] font-bold leading-none">ⴼ</span>
          <span className="text-[10px] leading-tight">{t('feed')}</span>
        </Link>

        {/* FOLLOWING (Added from your request) */}
        <Link href="/feed?tab=following" className={`flex flex-col items-center justify-center w-12 gap-0.5 ${currentTab === 'following' ? 'text-teal-400' : 'text-gray-400'}`}>
          <span className="text-[22px] font-bold leading-none">ⵏ</span>
          <span className="text-[10px] leading-tight">{t('following')}</span>
        </Link>

        {/* COMMUNITIES (Added from your request) */}
        <Link href="/discover" className={`flex flex-col items-center justify-center w-12 gap-0.5 ${pathname.includes('/discover') ? 'text-teal-400' : 'text-gray-400'}`}>
          <span className="text-[22px] font-bold leading-none">ⴳ</span>
          <span className="text-[10px] leading-tight">{t('communities')}</span>
        </Link>

        {/* VIDEO CALL (LiveKit) */}
        <Link href="/call" className={`flex flex-col items-center justify-center w-12 gap-0.5 ${pathname.includes('/call') ? 'text-teal-400' : 'text-gray-400'}`}>
          <span className="text-[22px] font-bold leading-none">ⴽ</span>
          <span className="text-[10px] leading-tight">{t('video')}</span>
        </Link>

        {/* ACTION HUB TRIGGER (More) */}
        <button
          type="button"
          onClick={() => setHubOpen(true)}
          className={`flex flex-col items-center justify-center w-12 gap-0.5 ${hubOpen ? 'text-teal-400' : 'text-gray-400'}`}
          aria-label="Action Hub"
          aria-haspopup="dialog"
          aria-expanded={hubOpen}
        >
          <span className="text-[22px] font-bold leading-none">ⵎ</span>
          <span className="text-[10px] leading-tight">{t('more')}</span>
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