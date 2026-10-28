"use client";

import React, { useState, useEffect, useRef } from 'react';
import { db, auth, storage } from '@/lib/firebase/client';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged, User } from 'firebase/auth';
import Link from 'next/link';

export default function FacebookFeed() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [postText, setPostText] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  // Fetch Posts
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!postText.trim() && !imageFile)) return;

    setUploading(true);
    let imageUrl = "";

    try {
      if (imageFile) {
        const storageRef = ref(storage, `post_images/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, "posts"), {
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || "Anonymous",
        authorPhoto: user.photoURL || null,
        text: postText,
        imageUrl: imageUrl || null,
        likes: [],
        createdAt: serverTimestamp(),
      });

      setPostText("");
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post.");
    }
    setUploading(false);
  };

  const handleLike = async (postId: string, likes: string[]) => {
    if (!user) return;
    const postRef = doc(db, "posts", postId);
    const hasLiked = likes?.includes(user.uid);

    try {
      await updateDoc(postRef, {
        likes: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f172a] text-white flex-col gap-4">
        <p>Please log in on the Chat page first.</p>
        <Link href="/" className="bg-teal-600 px-4 py-2 rounded-lg">Go to Login</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-300">
      
      {/* Facebook Top Navbar */}
      <div className="bg-[#1e293b] border-b border-slate-700 sticky top-0 z-50 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-teal-400">Thimlilith</h1>
          <input type="text" placeholder="Search Thimlilith..." className="bg-[#0f172a] px-4 py-2 rounded-full text-sm w-64 focus:outline-none border border-slate-700" />
        </div>
        
        <div className="flex items-center gap-6">
          <Link href="/" className="p-2 hover:bg-slate-700 rounded-lg text-xl" title="Chat">💬</Link>
          <button className="p-2 hover:bg-slate-700 rounded-lg text-xl" title="Home">🏠</button>
          <button className="p-2 hover:bg-slate-700 rounded-lg text-xl" title="Notifications">🔔</button>
          <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'U'}&background=0D8ABC&color=fff`} alt="Profile" className="w-8 h-8 rounded-full" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-2xl mx-auto py-6 px-4">
        
        {/* Create Post Box */}
        <div className="bg-[#1e293b] rounded-xl p-4 mb-6 shadow-lg border border-slate-700">
          <form onSubmit={handleCreatePost}>
            <div className="flex items-center gap-3 mb-3">
              <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'U'}&background=0D8ABC&color=fff`} alt="Profile" className="w-10 h-10 rounded-full" />
              <input 
                type="text" 
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder={`What's on your mind, ${user.displayName?.split(' ')[0] || 'User'}?`}
                className="flex-1 bg-[#0f172a] px-4 py-2 rounded-full text-sm focus:outline-none border border-slate-700"
              />
            </div>
            
            {imageFile && (
              <div className="mb-3 relative">
                <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full max-h-64 object-cover rounded-lg" />
                <button type="button" onClick={() => setImageFile(null)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-700 pt-3">
              <div className="flex gap-4">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-green-400 hover:bg-slate-700 px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1">
                  🖼️ Photo
                </button>
                <button type="button" className="text-blue-400 hover:bg-slate-700 px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1">
                  📍 Check in
                </button>
              </div>
              <button type="submit" disabled={uploading || (!postText.trim() && !imageFile)} className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white px-6 py-1.5 rounded-lg font-medium">
                {uploading ? "Posting..." : "Post"}
              </button>
            </div>
          </form>
        </div>

        {/* Stories Section (Horizontal Scroll) */}
        <div className="flex gap-2 overflow-x-auto mb-6 pb-2 custom-scrollbar">
          <div className="min-w-[110px] h-[190px] bg-[#1e293b] rounded-xl relative overflow-hidden cursor-pointer group border border-slate-700">
            <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'U'}&background=0D8ABC&color=fff`} alt="User" className="w-full h-3/4 object-cover group-hover:opacity-80" />
            <div className="absolute bottom-0 w-full bg-[#1e293b] text-center py-2 text-xs font-medium">Create Story</div>
            <div className="absolute bottom-9 left-1/2 -translate-x-1/2 bg-teal-600 border-2 border-[#1e293b] rounded-full w-8 h-8 flex items-center justify-center text-white font-bold text-xl">+</div>
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[110px] h-[190px] bg-slate-700 rounded-xl relative overflow-hidden cursor-pointer border border-slate-700">
              <img src={`https://picsum.photos/seed/${i}/200/300`} alt="Story" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              <div className="absolute top-2 left-2 w-8 h-8 rounded-full border-2 border-teal-500 bg-slate-800"></div>
              <div className="absolute bottom-2 left-2 text-xs font-medium text-white drop-shadow-md">User {i}</div>
            </div>
          ))}
        </div>

        {/* Feed Posts */}
        <div className="flex flex-col gap-4">
          {posts.map((post) => {
            const hasLiked = post.likes?.includes(user.uid);
            return (
              <div key={post.id} className="bg-[#1e293b] rounded-xl shadow-lg border border-slate-700 overflow-hidden">
                {/* Post Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={post.authorPhoto || `https://ui-avatars.com/api/?name=${post.authorName}&background=0D8ABC&color=fff`} alt="Author" className="w-10 h-10 rounded-full" />
                    <div>
                      <h4 className="font-semibold text-white">{post.authorName}</h4>
                      <p className="text-xs text-gray-400">{post.createdAt ? new Date(post.createdAt.toDate()).toLocaleString() : 'Just now'}</p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-white">⋯</button>
                </div>

                {/* Post Content */}
                {post.text && <p className="px-4 pb-3 text-gray-200">{post.text}</p>}
                {post.imageUrl && (
                  <img src={post.imageUrl} alt="Post content" className="w-full max-h-[500px] object-cover bg-black" />
                )}

                {/* Post Stats */}
                <div className="px-4 py-2 flex items-center justify-between text-sm text-gray-400 border-b border-slate-700 mx-4">
                  <div className="flex items-center gap-1">
                    <span className="bg-teal-600 text-white rounded-full p-1 text-[10px]">👍</span>
                    {post.likes?.length || 0}
                  </div>
                  <div>{post.comments?.length || 0} comments</div>
                </div>

                {/* Post Actions */}
                <div className="p-2 flex justify-around border-t border-slate-700">
                  <button 
                    onClick={() => handleLike(post.id, post.likes || [])}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium hover:bg-slate-700 transition flex-1 justify-center ${hasLiked ? 'text-teal-400' : 'text-gray-400'}`}
                  >
                    👍 Like
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-gray-400 hover:bg-slate-700 transition flex-1 justify-center">
                    💬 Comment
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-gray-400 hover:bg-slate-700 transition flex-1 justify-center">
                    ↗️ Share
                  </button>
                </div>
              </div>
            );
          })}
          {posts.length === 0 && <div className="text-center text-gray-500 mt-10">No posts yet. Be the first to share something!</div>}
        </div>
      </div>
    </div>
  );
}