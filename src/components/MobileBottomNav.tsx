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

  return (
    <div 
      className="md:hidden fixed bottom-0 left-0 right-0 z-[200] bg-[#0f172a]/95 backdrop-blur-md border-t border-slate-800 flex justify-around items-center h-16"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <Link href="/rooms" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/rooms') ? 'text-teal-400' : 'text-gray-400 hover:text-gray-200'}`}>
        <span className="text-xl">💬</span>
        <span className="text-[10px] font-medium">Chats</span>
      </Link>
      
      <Link href="/feed" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/feed') ? 'text-teal-400' : 'text-gray-400 hover:text-gray-200'}`}>
        <span className="text-xl">🏠</span>
        <span className="text-[10px] font-medium">Feed</span>
      </Link>

      <Link href="/discover" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/discover') ? 'text-teal-400' : 'text-gray-400 hover:text-gray-200'}`}>
        <span className="text-xl">🧭</span>
        <span className="text-[10px] font-medium">Discover</span>
      </Link>

      <Link href="/rooms?tab=vault" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/rooms', 'vault') ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-200'}`}>
        <span className="text-xl">⭐</span>
        <span className="text-[10px] font-medium">Vault</span>
      </Link>

      <Link href={uid ? `/profile/${uid}` : '/rooms'} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname.includes('/profile') ? 'text-teal-400' : 'text-gray-400 hover:text-gray-200'}`}>
        <span className="text-xl">👤</span>
        <span className="text-[10px] font-medium">Profile</span>
      </Link>
    </div>
  );
}