// src/app/[locale]/hashtag/[tag]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { db, auth } from '@/lib/firebase/client';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';


export default function HashtagPage() {
  const params = useParams();
  const tag = params.tag as string;
  const locale = params.locale as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!tag) return;
    // Query posts that contain this hashtag
    const q = query(
      collection(db, "posts"),
      where("hashtags", "array-contains", `#${tag.toLowerCase()}`),
      orderBy("createdAt", "desc")
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [tag]);

  const renderPostText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(#[\w\u0600-\u06FF]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        return <Link key={i} href={`/${locale}/hashtag/${part.slice(1)}`} className="text-teal-400 hover:underline font-medium">{part}</Link>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (loading) return <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-300 pb-20">
      <div className="sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <Link href={`/${locale}/feed`} className="text-teal-400 hover:text-teal-300 font-medium text-sm">← Back to Feed</Link>
        <h1 className="text-white font-bold text-lg">#{tag}</h1>
        <div className="w-20"></div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {posts.length === 0 && (
          <div className="text-center text-gray-500 py-10">No posts found for #{tag}.</div>
        )}

        {posts.map(post => {
          const postDate = post.createdAt ? new Date(post.createdAt.toMillis()) : new Date();
          return (
            <div key={post.id} className="bg-[#1e293b] border border-slate-700 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <Link href={`/${locale}/profile/${post.authorId}`} className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {post.authorPhotoURL ? <img src={post.authorPhotoURL} alt="" className="w-full h-full object-cover" /> : <span className="text-white font-bold">{post.authorName[0].toUpperCase()}</span>}
                </Link>
                <div className="flex-1">
                  <Link href={`/${locale}/profile/${post.authorId}`} className="text-white font-bold hover:underline">{post.authorName}</Link>
                  <p className="text-xs text-gray-500">{postDate.toLocaleDateString()}</p>
                </div>
              </div>
              {post.text && <p className="text-gray-200 text-sm whitespace-pre-wrap mb-3">{renderPostText(post.text)}</p>}
              {post.imageUrl && <img src={post.imageUrl} alt="Post" className="w-full rounded-xl mb-3 border border-slate-700" />}
            </div>
          );
        })}
      </div>
      
    </div>
  );
}