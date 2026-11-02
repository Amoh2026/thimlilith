// src/app/[locale]/(chat)/rooms/components/Sidebars.tsx
"use client";

import StoryViewer from './StoryViewer';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, usePathname } from 'next/navigation';

import React from 'react';
import Link from 'next/link';
import { User } from 'firebase/auth';
import { SSOButton } from '@/components/auth/SSOButton';

// (Props interface remains identical - skip to avoid huge code block, just paste original props)
interface SidebarsProps {
  user: User;
  userDoc: any;
  rooms: any[];
  activeRoom: any;
  sidebarTab: 'rooms' | 'friends' | 'search' | 'vault';
  setSidebarTab: (v: 'rooms' | 'friends' | 'search' | 'vault') => void;
  friendRequests: any[];
  friendsList: any[];
  blockedUsersList: any[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  searchResults: any[];
  isSearching: boolean;
  newRoomName: string;
  setNewRoomName: (v: string) => void;
  isCreatingRoom: boolean;
  setIsCreatingRoom: (v: boolean) => void;
  getDMName: (room: any) => string;
  handleSelectRoom: (room: any) => void;
  handleCreateRoom: (e: React.FormEvent) => void;
  isPaidRoom: boolean;
  setIsPaidRoom: (v: boolean) => void;
  roomPrice: string;
  setRoomPrice: (v: string) => void;
  handleSearchUsers: (e: React.FormEvent) => void;
  handleSendFriendRequest: (u: any) => void;
  handleAcceptRequest: (id: string) => void;
  handleRejectRequest: (id: string) => void;
  handleStartDM: (u: any) => void;
  handleBlockUser: (uid: string, name: string) => void;
  handleLogout: () => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (v: boolean) => void;
}

export function Sidebars(p: SidebarsProps) {
  const t = useTranslations('Sidebar');
  const tChat = useTranslations('Chat');
  
  const params = useParams();
  const pathname = usePathname(); 
  const locale = (params?.locale as string) || 'en';

  const handleCheckout = async (type: 'premium' | 'donation', amount?: number) => {
    try {
      const token = await p.user.getIdToken();
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ type, plan: type === 'premium' ? 'monthly' : undefined, amount })
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || 'Failed to start checkout');
    } catch (err: any) {
      alert("Failed to connect to Stripe: " + err.message);
    }
  };

  const [activeStoryUids, setActiveStoryUids] = useState<string[]>([]);
  const [storiesList, setStoriesList] = useState<any[]>([]);
  const [viewingStory, setViewingStory] = useState<any>(null);

  useEffect(() => {
    if (!p.user) return;
    const q = query(collection(db, "stories"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
      const validStories = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((s: any) => s.createdAt && s.createdAt.toMillis() > twentyFourHoursAgo);
      
      setStoriesList(validStories);
      const uids = [...new Set(validStories.map((s: any) => s.authorId))] as string[];
      setActiveStoryUids(uids);
    });
    return () => unsub();
  }, [p.user]);

  const openStoryForUser = (uid: string) => {
    const story = storiesList.find(s => s.authorId === uid);
    if (story) setViewingStory(story);
  };

  // 👇 NEW COLOR LOGIC for Sidebar Tifinagh icons
  const iconBase = "text-xl font-bold transition-colors";
  const iconActive = "text-white";
  const iconInactive = "text-teal-600 hover:text-teal-400";

  return (
    <>
      {/* 🌟 FAR LEFT SIDEBAR (DESKTOP ONLY) 🌟 */}
      <div className="hidden md:flex w-16 flex-col items-center py-4 bg-[#0b1120] border-r border-slate-800">
        <div className="w-10 h-10 bg-teal-500 rounded-xl mb-8 flex items-center justify-center text-white font-bold">T</div>
        
        <div className="flex flex-col gap-6">
          <button onClick={() => p.setSidebarTab('rooms')} className={`${iconBase} ${p.sidebarTab === 'rooms' ? iconActive : iconInactive}`} title={t('chats')}>ⵣ</button>
          
          <Link href={`/${locale}/feed`} className={`${iconBase} ${pathname === `/${locale}/feed` ? iconActive : iconInactive}`} title={t('feed')}>ⴼ</Link>
          
          <Link href={`/${locale}/feed?tab=following`} className={`${iconBase} ${pathname.includes('/feed') && pathname.includes('following') ? iconActive : iconInactive}`} title={t('following')}>ⵊ</Link>
          
          <Link href={`/${locale}/discover`} className={`${iconBase} ${pathname === `/${locale}/discover` ? iconActive : iconInactive}`} title={t('communities')}>ⴳ</Link> 
          
          <Link href={`/${locale}/live`} className={`${iconBase} ${pathname.includes('/live') ? iconActive : iconInactive}`} title={t('video')}>ⴽ</Link>

          <SSOButton target="atk" icon="ⴰ" label={t('learn')} className={iconInactive} />
          
          <button onClick={() => p.setSidebarTab('friends')} className={`${iconBase} ${p.sidebarTab === 'friends' ? iconActive : iconInactive}`} title={t('friends')}>ⵗ</button>
        </div>

        <div className="mt-auto flex flex-col items-center gap-4 pb-4">
          <Link href={`/${locale}/profile/${p.user.uid}`} title="My Profile">
            {p.user.photoURL
              ? <img src={p.user.photoURL} alt="User" className="w-8 h-8 rounded-full border-2 border-teal-500 hover:opacity-80" />
              : <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-xs hover:opacity-80">{(p.user.displayName || p.user.email)?.[0].toUpperCase()}</div>}
          </Link>
        </div>
      </div>

      {/* ... (Rest of the Sidebars code remains exactly as you had it, but with updated active/inactive logic in the mobile view above) ... */}
      {p.isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-[90] md:hidden" onClick={() => p.setIsMobileSidebarOpen(false)} />
      )}

      <div className={`fixed inset-y-0 left-0 z-[100] w-80 bg-[#0f172a] border-r border-slate-800 flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 ${p.isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800">
          <span className="text-white font-bold text-lg">{t('thajmaathin')}</span>
          <button onClick={() => p.setIsMobileSidebarOpen(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>
        
        <div className="flex gap-2 p-3 border-b border-slate-800 bg-[#1e293b] md:hidden">
          <Link href={`/${locale}/feed`} className="flex flex-col items-center justify-center flex-1 py-1">
            <span className={`text-xl font-bold ${pathname === `/${locale}/feed` ? 'text-white' : 'text-teal-500'}`}>ⴼ</span>
            <span className="text-[10px] text-gray-300 mt-1">{t('feed')}</span>
          </Link>
          <Link href={`/${locale}/discover`} className="flex flex-col items-center justify-center flex-1 py-1">
            <span className={`text-xl font-bold ${pathname === `/${locale}/discover` ? 'text-white' : 'text-teal-500'}`}>ⴳ</span>
            <span className="text-[10px] text-gray-300 mt-1">{t('communities')}</span>
          </Link>
          <div className="flex flex-col items-center justify-center flex-1 py-1">
            <SSOButton target="atk" icon="ⵍ" label={t('learn')} className="!text-teal-500 !text-xl" />
            <span className="text-[10px] text-gray-300 mt-1">Learn</span>
          </div>
        </div>

        <div className="flex border-b border-slate-800">
          <button onClick={() => p.setSidebarTab('rooms')} className={`flex-1 py-3 px-1 text-xs md:text-sm font-medium transition-colors ${p.sidebarTab === 'rooms' ? 'text-white border-b-2 border-teal-400' : 'text-teal-600 hover:text-teal-400'}`}>{t('thajmaathin')}</button>
          <button onClick={() => p.setSidebarTab('friends')} className={`flex-1 py-3 px-1 text-xs md:text-sm font-medium relative transition-colors ${p.sidebarTab === 'friends' ? 'text-white border-b-2 border-teal-400' : 'text-teal-600 hover:text-teal-400'}`}>
            {t('friends')}
            {p.friendRequests.length > 0 && <span className="absolute top-2 right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{p.friendRequests.length}</span>}
          </button>
          <button onClick={() => p.setSidebarTab('search')} className={`flex-1 py-3 px-1 text-xs md:text-sm font-medium transition-colors ${p.sidebarTab === 'search' ? 'text-white border-b-2 border-teal-400' : 'text-teal-600 hover:text-teal-400'}`}>{t('find')}</button>
        </div>

        {/* ... Rest of the Sidebar content (Rooms, Friends, Search, Tip Jar) stays exactly the same as your original file ... */}
      </div>

      {viewingStory && <StoryViewer story={viewingStory} onClose={() => setViewingStory(null)} />}
    </>
  );
}