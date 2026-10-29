'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { ProfileView } from '@/app/[locale]/(chat)/rooms/components/ProfileView';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const uid = params.uid as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) setUserDoc(snap.data());
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  if (loading) return <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">Loading...</div>;
  if (!user) {
    router.push('/en/rooms');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 md:p-8 flex flex-col items-center">
      <button onClick={() => router.back()} className="mb-6 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm self-start md:self-auto md:absolute md:left-8 md:top-8">
        ← Back to Chat
      </button>
      
      <ProfileView profileId={uid} currentUser={user} currentUserDoc={userDoc} />
    </div>
  );
}