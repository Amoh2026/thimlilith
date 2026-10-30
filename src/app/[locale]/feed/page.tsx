// src/app/[locale]/feed/page.tsx
"use client";

import StoryViewer from '@/app/[locale]/(chat)/rooms/components/StoryViewer';
import MobileBottomNav from '@/components/MobileBottomNav';
import CommentModal from '@/app/[locale]/(chat)/rooms/components/CommentModal';
import SharePostModal from '@/app/[locale]/(chat)/rooms/components/SharePostModal';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { db, auth, storage } from '@/lib/firebase/client';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged, User } from 'firebase/auth';

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  text: string;
  imageUrl?: string;
  createdAt: any;
  likes: string[];
}

export default function FeedPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale || 'en';

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostText, setNewPostText] = useState("");
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  // Stories State
  const [stories, setStories] = useState<any[]>([]);
  const [activeStory, setActiveStory] = useState<any>(null);
  const storyInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingStory, setIsUploadingStory] = useState(false);

  // Modals State
  const [sharePost, setSharePost] = useState<any>(null);
  const [commentPost, setCommentPost] = useState<any>(null);
  const [isSharing, setIsSharing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) {
        router.push(`/${locale}/rooms`);
      }
    });
    return () => unsubscribe();
  }, [router, locale]);

  // Fetch Posts
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
    });
    return () => unsub();
  }, [user]);

  // Fetch Stories (Filter last 24h)
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "stories"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
      const validStories = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((s: any) => s.createdAt && s.createdAt.toMillis() > twentyFourHoursAgo);
      setStories(validStories);
    });
    return () => unsub();
  }, [user]);

  const handleCreatePost = async () => {
    if ((!newPostText.trim() && !newPostImage) || !user) return;
    setIsPosting(true);

    try {
      let imageUrl = "";
      if (newPostImage) {
        const sref = ref(storage, `post_images/${Date.now()}_${newPostImage.name}`);
        await uploadBytes(sref, newPostImage);
        imageUrl = await getDownloadURL(sref);
      }

      await addDoc(collection(db, "posts"), {
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || "Anon",
        authorPhotoURL: user.photoURL || null,
        text: newPostText.trim(),
        imageUrl: imageUrl || null,
        createdAt: serverTimestamp(),
        likes: []
      });

      handleCancelPost();
    } catch (err: any) {
      alert("Failed to create post: " + err.message);
      console.error(err);
    }
    setIsPosting(false);
  };

  const handleCancelPost = () => {
    setNewPostText("");
    setNewPostImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreateStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingStory(true);
    try {
      const sref = ref(storage, `stories/${Date.now()}_${file.name}`);
      await uploadBytes(sref, file);
      const imageUrl = await getDownloadURL(sref);

      await addDoc(collection(db, "stories"), {
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || "User",
        authorPhotoURL: user.photoURL || null,
        imageUrl: imageUrl,
        createdAt: serverTimestamp()
      });

      alert("Story uploaded! It will disappear in 24 hours.");
    } catch (err: any) {
      alert("Failed to upload story: " + err.message);
    }
    setIsUploadingStory(false);
    if (storyInputRef.current) storyInputRef.current.value = '';
  };

  const handleLike = async (postId: string, currentLikes: string[], postAuthorId: string) => {
    if (!user) return;
    const hasLiked = currentLikes?.includes(user.uid);
    const postRef = doc(db, "posts", postId);
    
    try {
      await updateDoc(postRef, {
        likes: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });

      if (!hasLiked && postAuthorId !== user.uid) {
        await addDoc(collection(db, "notifications"), {
          userId: postAuthorId,
          type: 'like',
          text: `${user.displayName || 'Someone'} liked your post.`,
          link: `/${locale}/feed`,
          read: false,
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Like failed", err);
    }
  };

  const handleExecuteShare = async (targetRoomId: string) => {
    if (!sharePost || !user) return;
    setIsSharing(true);
    try {
      await addDoc(collection(db, "rooms", targetRoomId, "messages"), {
        senderId: user.uid,
        senderName: user.displayName || user.email?.split('@')[0] || "User",
        text: `📢 Shared a post from ${sharePost.authorName}:\n"${sharePost.text}"`,
        type: sharePost.imageUrl ? 'image' : 'text',
        fileUrl: sharePost.imageUrl || null,
        createdAt: serverTimestamp(),
        readBy: [],
        isForwarded: true
      });

      await updateDoc(doc(db, "rooms", targetRoomId), {
        lastMessageAt: serverTimestamp(),
        lastMessageText: `Shared a post from ${sharePost.authorName}`,
        lastMessageSenderId: user.uid
      });

      alert("Post shared to chat! ✨");
      setSharePost(null);
    } catch (err: any) {
      alert("Failed to share: " + err.message);
    }
    setIsSharing(false);
  };

  if (loading) return <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">Loading Feed...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-300">
      
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <Link href={`/${locale}/rooms`} className="text-teal-400 hover:text-teal-300 font-medium text-sm flex items-center gap-2">
          ← Back to Chat
        </Link>
        <h1 className="text-white font-bold text-lg">🏠 Home Feed</h1>
        <div className="w-20"></div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
        
        {/* STORIES ROW */}
        <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-1">
          {/* Create Story Button */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer" onClick={() => storyInputRef.current?.click()}>
            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-teal-500 flex items-center justify-center relative overflow-hidden">
               {isUploadingStory ? (
                 <span className="text-xs text-white">...</span>
               ) : (
                 <span className="text-2xl text-teal-400 font-bold">+</span>
               )}
            </div>
            <span className="text-xs text-gray-400 font-medium">Create Story</span>
            <input type="file" ref={storyInputRef} className="hidden" accept="image/*" onChange={handleCreateStory} />
          </div>

          {/* Display Active Stories */}
          {stories.map((story) => (
            <div key={story.id} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer" onClick={() => setActiveStory(story)}>
              <div className="w-16 h-16 rounded-full border-2 border-teal-500 p-0.5">
                <img src={story.imageUrl} alt="Story" className="w-full h-full rounded-full object-cover" />
              </div>
              <span className="text-xs text-gray-300 truncate w-16 text-center">
                {story.authorName.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>

        {/* CREATE POST BOX */}
        <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-4 shadow-lg">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold flex-shrink-0">
              {user.displayName?.[0].toUpperCase() || "U"}
            </div>
            <div className="flex-1">
              <textarea
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="What's on your mind? Share with the community..."
                className="w-full bg-transparent text-white resize-none outline-none placeholder-gray-500 min-h-[60px]"
                rows={2}
              />
              
              {newPostImage && (
                <div className="mt-2 relative inline-block">
                  <img src={URL.createObjectURL(newPostImage)} alt="Preview" className="h-32 rounded-lg object-cover" />
                  <button onClick={() => setNewPostImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
                </div>
              )}

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => setNewPostImage(e.target.files?.[0] || null)} 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-teal-400 hover:text-teal-300 text-sm font-medium flex items-center gap-1"
                >
                  🖼️ Add Image
                </button>
                
                <div className="flex items-center gap-2">
                  {(newPostText.trim() || newPostImage) && (
                    <button onClick={handleCancelPost} className="text-gray-400 hover:text-white px-3 py-1.5 text-sm transition">Cancel</button>
                  )}
                  <button
                    onClick={handleCreatePost}
                    disabled={isPosting || (!newPostText.trim() && !newPostImage)}
                    className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white px-5 py-1.5 rounded-full text-sm font-bold transition"
                  >
                    {isPosting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* POSTS TIMELINE */}
        {posts.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            <p className="text-4xl mb-2">🌱</p>
            <p>No posts yet. Be the first to share something!</p>
          </div>
        )}

        {posts.map(post => {
          const hasLiked = post.likes?.includes(user.uid);
          const postDate = post.createdAt ? new Date(post.createdAt.toMillis()) : new Date();
          
          return (
            <div key={post.id} className="bg-[#1e293b] border border-slate-700 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <Link href={`/${locale}/profile/${post.authorId}`} className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 hover:ring-2 ring-teal-500 transition">
                  {post.authorPhotoURL ? <img src={post.authorPhotoURL} alt="" className="w-full h-full object-cover" /> : <span className="text-white font-bold">{post.authorName[0].toUpperCase()}</span>}
                </Link>
                <div className="flex-1">
                  <Link href={`/${locale}/profile/${post.authorId}`} className="text-white font-bold hover:underline">
                    {post.authorName}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {postDate.toLocaleDateString()} at {postDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>

              {post.text && <p className="text-gray-200 text-sm whitespace-pre-wrap mb-3">{post.text}</p>}
              
              {post.imageUrl && (
                <img src={post.imageUrl} alt="Post" className="w-full rounded-xl mb-3 border border-slate-700" />
              )}

              <div className="flex items-center gap-4 pt-3 border-t border-slate-700">
                <button 
                  onClick={() => handleLike(post.id, post.likes || [], post.authorId)}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${hasLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
                >
                  {hasLiked ? '❤️' : '🤍'} {post.likes?.length || 0}
                </button>
                
                <button 
                  onClick={() => setCommentPost(post)}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-teal-400 transition-colors"
                >
                  💬 Comment
                </button>

                <button 
                  onClick={() => setSharePost(post)}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-teal-400 transition-colors"
                >
                  🔗 Share
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODALS */}
      {sharePost && (
        <SharePostModal 
          isOpen={!!sharePost} 
          onClose={() => setSharePost(null)} 
          post={sharePost} 
          user={user} 
          onShare={handleExecuteShare} 
        />
      )}

      {commentPost && (
        <CommentModal 
          isOpen={!!commentPost} 
          onClose={() => setCommentPost(null)} 
          post={commentPost} 
          user={user} 
        />
      )}

      {/* 👇 THE MISSING STORY VIEWER 👇 */}
      {activeStory && (
        <StoryViewer story={activeStory} onClose={() => setActiveStory(null)} />
      )}

      <MobileBottomNav />
    </div>
  );
}