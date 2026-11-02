'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase/client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useTranslations } from 'next-intl';

export default function CreateRoomPage() {
  const t = useTranslations('CreateRoom');
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState<number>(5);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return alert(t('mustBeLoggedIn'));
    if (!name) return alert(t('roomRequired'));

    setLoading(true);

    try {
      // Generate a random invite code for the chat system
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Save the room to Firestore with ALL required fields for the Chat UI
      const docRef = await addDoc(collection(db, 'rooms'), {
        name,
        description,
        type: "group", // 👈 This makes it show up in the sidebar!
        createdBy: auth.currentUser.uid, // 👈 The old chat UI uses this
        ownerId: auth.currentUser.uid, // 👈 The new room page uses this
        members: [auth.currentUser.uid],
        admins: [auth.currentUser.uid], // 👈 Gives you admin rights
        moderators: [],
        inviteCode, // 👈 Generates an invite link
        pinnedMessages: [],
        permissions: { whoCanPost: "everyone" },
        isPaid,
        price: isPaid ? price : 0,
        createdAt: serverTimestamp(),
      });

      // Redirect to the newly created room!
      router.push(`/${locale}/rooms/${docRef.id}`);
      
    } catch (error) {
      console.error("Error creating room:", error);
      alert(t('failedToCreate'));
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-200 pt-16 pb-24 px-4">
      <div className="max-w-lg mx-auto mt-8">
        
        {/* BACK BUTTON HEADER */}
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => router.back()} 
            className="text-slate-400 hover:text-white p-2 -ml-2 rounded-full hover:bg-slate-800 transition-colors flex items-center justify-center"
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <span className="text-xl">🚪</span> Create a Room
            </h1>
            <p className="text-slate-400 text-sm">{t('subtitle')}</p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">{t('roomName')}</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder={t('roomNamePlaceholder')}
              className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400" 
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">{t('description')}</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('descPlaceholder')}
              rows={3}
              className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400" 
            />
          </div>

          <div className="flex items-center gap-3 py-2">
            <input 
              type="checkbox" 
              id="paidToggle"
              checked={isPaid} 
              onChange={(e) => setIsPaid(e.target.checked)}
              className="w-5 h-5 accent-teal-400"
            />
            <label htmlFor="paidToggle" className="text-sm font-medium text-slate-200 cursor-pointer">
              Make this a Paid Room (Premium)
            </label>
          </div>

          {isPaid && (
            <div>
              <label className="block text-sm text-slate-400 mb-1">{t('monthlyPrice')}</label>
              <input 
                type="number" 
                value={price} 
                onChange={(e) => setPrice(Number(e.target.value))}
                min={1}
                className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400" 
              />
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button 
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-[#1e293b] border border-white/10 text-slate-300 font-semibold py-3 rounded-xl active:scale-95 transition-transform"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-[2] bg-teal-400 text-[#0f172a] font-semibold py-3 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
            >
              {loading ? t('creating') : t('createRoom')}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}