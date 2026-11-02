// src/components/MobileBottomNav.tsx
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
    const fullPath = `/${locale}${path}`;
    if (tab) return pathname === fullPath && currentTab === tab;
    return pathname === fullPath && !currentTab;
  };

  if (
    pathname.includes('/account/') ||
    pathname.includes('/sso') ||
    pathname.includes('/live/') ||   
    pathname.includes('/call')       
  ) return null;

  // 👇 NEW COLOR LOGIC: Inactive = Teal, Active = White 👇
  const baseClass = "flex flex-col items-center justify-center w-12 gap-0.5 transition-colors";
  const activeClass = "text-white font-bold";
  const inactiveClass = "text-teal-500 hover:text-teal-400";

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[999] bg-[#0f172a]/95 backdrop-blur-md border-t border-slate-800 flex justify-between items-center px-1 pt-1 pb-[env(safe-area-inset-bottom)] h-[60px]">

        <Link href={`/${locale}/rooms`} className={`${baseClass} ${isActive('/rooms') ? activeClass : inactiveClass}`}>
          <span className="text-[22px] font-bold leading-none">ⵣ</span>
          <span className="text-[10px] leading-tight">{t('chats')}</span>
        </Link>

        <Link href={`/${locale}/feed`} className={`${baseClass} ${pathname.includes('/feed') && !currentTab ? activeClass : inactiveClass}`}>
          <span className="text-[22px] font-bold leading-none">ⴼ</span>
          <span className="text-[10px] leading-tight">{t('feed')}</span>
        </Link>

        {/* 👇 Following is kept separate as you requested, styled correctly */}
        <Link href={`/${locale}/feed?tab=following`} className={`${baseClass} ${currentTab === 'following' ? activeClass : inactiveClass}`}>
          <span className="text-[22px] font-bold leading-none">ⵏ</span>
          <span className="text-[10px] leading-tight">{t('following')}</span>
        </Link>

        <Link href={`/${locale}/discover`} className={`${baseClass} ${pathname.includes('/discover') ? activeClass : inactiveClass}`}>
          <span className="text-[22px] font-bold leading-none">ⴳ</span>
          <span className="text-[10px] leading-tight">{t('communities')}</span>
        </Link>

        <Link href={`/${locale}/call`} className={`${baseClass} ${pathname.includes('/call') ? activeClass : inactiveClass}`}>
          <span className="text-[22px] font-bold leading-none">ⴽ</span>
          <span className="text-[10px] leading-tight">{t('video')}</span>
        </Link>

        <button
          type="button"
          onClick={() => setHubOpen(true)}
          className={`${baseClass} ${hubOpen ? activeClass : inactiveClass}`}
          aria-label="Action Hub"
        >
          <span className="text-[22px] font-bold leading-none">ⵎ</span>
          <span className="text-[10px] leading-tight">{t('more')}</span>
        </button>
      </div>

      <ActionHub open={hubOpen} onClose={() => setHubOpen(false)} locale={locale} />
    </>
  );
}