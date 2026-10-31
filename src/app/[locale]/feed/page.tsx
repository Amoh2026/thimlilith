// src/app/[locale]/feed/page.tsx
"use client";

import StoryViewer from '@/app/[locale]/(chat)/rooms/components/StoryViewer';

import CommentModal from '@/app/[locale]/(chat)/rooms/components/CommentModal';
import SharePostModal from '@/app/[locale]/(chat)/rooms/components/SharePostModal';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { db, auth, storage } from '@/lib/firebase/client';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, arrayUnion, arrayRemove, where, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged, User } from 'firebase/auth';

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  text: string;
  imageUrl?: string;
  hashtags?: string[];
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

  // Feed & Follow State
  const [feedTab, setFeedTab] = useState<'global' | 'following'>('global');
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [followingLoad, setFollowingLoad] = useState<Record<string, boolean>>({});

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

  // Fetch Follows
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "follows"), where("followerId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setFollowingIds(snap.docs.map(d => d.data().followingId));
    });
    return () => unsub();
  }, [user]);

  // Fetch All Users
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  // Fetch Stories
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

      const extractedTags = newPostText.match(/#[\w\u0600-\u06FF]+/g)?.map(t => t.toLowerCase()) || [];

      await addDoc(collection(db, "posts"), {
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || "Anon",
        authorPhotoURL: user.photoURL || null,
        text: newPostText.trim(),
        imageUrl: imageUrl || null,
        hashtags: extractedTags,
        createdAt: serverTimestamp(),
        likes: []
      });

      handleCancelPost();
    } catch (err: any) {
      alert("Failed to create post: " + err.message);
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
        authorId: user.uid, authorName: user.displayName || user.email?.split('@')[0] || "User", authorPhotoURL: user.photoURL || null, imageUrl, createdAt: serverTimestamp()
      });
      alert("Story uploaded! It will disappear in 24 hours.");
    } catch (err: any) { alert("Failed: " + err.message); }
    setIsUploadingStory(false);
    if (storyInputRef.current) storyInputRef.current.value = '';
  };

  const handleLike = async (postId: string, currentLikes: string[], postAuthorId: string) => {
    if (!user) return;
    const hasLiked = currentLikes?.includes(user.uid);
    const postRef = doc(db, "posts", postId);
    try {
      await updateDoc(postRef, { likes: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid) });
      if (!hasLiked && postAuthorId !== user.uid) {
        await addDoc(collection(db, "notifications"), {
          userId: postAuthorId, type: 'like', text: `${user.displayName || 'Someone'} liked your post.`, link: `/${locale}/feed`, read: false, createdAt: serverTimestamp()
        });
      }
    } catch (err) {}
  };

  // 🛠️ FIXED FOLLOW FUNCTION
  const handleFollow = async (targetId: string) => {
    if (!user) return;
    setFollowingLoad(prev => ({ ...prev, [targetId]: true }));
    try {
      await setDoc(doc(db, "follows", `${user.uid}_${targetId}`), { 
        followerId: user.uid, 
        followingId: targetId, 
        createdAt: serverTimestamp() 
      });
    } catch (err: any) {
      alert("Failed to follow user: " + err.message);
    }
    setFollowingLoad(prev => ({ ...prev, [targetId]: false }));
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

  if (loading) return <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">Loading Feed...</div>;
  if (!user) return null;

  const displayedPosts = feedTab === 'global' ? posts : posts.filter(post => followingIds.includes(post.authorId));

  const suggestedUsers = allUsers
    .filter(u => u.id !== user.uid && !followingIds.includes(u.id))
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-300">
      
      <div className="sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <Link href={`/${locale}/rooms`} className="text-teal-400 hover:text-teal-300 font-medium text-sm flex items-center gap-2">
          ← Back to Chat
        </Link>
        <h1 className="text-white font-bold text-lg flex items-center gap-2">
          <span className="font-bold text-xl">ⵣ</span> Home Feed
        </h1>
        <div className="w-20"></div>
      </div>

      <div className="flex border-b border-slate-800 bg-[#0f172a]">
        <button onClick={() => setFeedTab('global')} className={`flex-1 py-3 text-center font-bold transition-colors flex items-center justify-center gap-2 ${feedTab === 'global' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-gray-500 hover:text-gray-300'}`}>
          <span className="text-lg font-bold">ⴰ</span> Global
        </button>
        <button onClick={() => setFeedTab('following')} className={`flex-1 py-3 text-center font-bold transition-colors flex items-center justify-center gap-2 ${feedTab === 'following' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-gray-500 hover:text-gray-300'}`}>
          <span className="text-lg font-bold">ⴼ</span> Following
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
        
        {/* STORIES ROW */}
        <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-1">
          <div className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer" onClick={() => storyInputRef.current?.click()}>
            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-teal-500 flex items-center justify-center relative overflow-hidden">
               {isUploadingStory ? <span className="text-xs text-white">...</span> : <span className="text-2xl text-teal-400 font-bold">+</span>}
            </div>
            <span className="text-xs text-gray-400 font-medium">Create Story</span>
            <input type="file" ref={storyInputRef} className="hidden" accept="image/*" onChange={handleCreateStory} />
          </div>

          {stories.map((story) => (
            <div key={story.id} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer" onClick={() => setActiveStory(story)}>
              <div className="w-16 h-16 rounded-full border-2 border-teal-500 p-0.5">
                <img src={story.imageUrl} alt="Story" className="w-full h-full rounded-full object-cover" />
              </div>
              <span className="text-xs text-gray-300 truncate w-16 text-center">{story.authorName.split(' ')[0]}</span>
            </div>
          ))}
        </div>

        {/* WHO TO FOLLOW WIDGET */}
        {suggestedUsers.length > 0 && (
          <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-4 shadow-lg">
            <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Who to follow</h3>
            <div className="space-y-3">
              {suggestedUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between">
                  <Link href={`/${locale}/profile/${u.id}`} className="flex items-center gap-3 hover:opacity-80">
                    <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold overflow-hidden">
                      {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : u.name?.[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm truncate max-w-[150px]">{u.name}</p>
                      <p className="text-xs text-gray-500">New to Thimlilith</p>
                    </div>
                  </Link>
                  
                  {/* FIXED BUTTON WITH LOADING STATE */}
                  <button 
                    onClick={() => handleFollow(u.id)} 
                    disabled={followingLoad[u.id]}
                    className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-gray-200 transition disabled:opacity-50 min-w-[70px] flex justify-center"
                  >
                    {followingLoad[u.id] ? '...' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CREATE POST BOX */}
        <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-4 shadow-lg">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold flex-shrink-0">
              {user.displayName?.[0].toUpperCase() || "U"}
            </div>
            <div className="flex-1">
              <textarea value={newPostText} onChange={(e) => setNewPostText(e.target.value)} placeholder="What's on your mind? Use #hashtags..." className="w-full bg-transparent text-white resize-none outline-none placeholder-gray-500 min-h-[60px]" rows={2} />
              {newPostImage && (
                <div className="mt-2 relative inline-block">
                  <img src={URL.createObjectURL(newPostImage)} alt="Preview" className="h-32 rounded-lg object-cover" />
                  <button onClick={() => setNewPostImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
                </div>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => setNewPostImage(e.target.files?.[0] || null)} />
                <button onClick={() => fileInputRef.current?.click()} className="text-teal-400 hover:text-teal-300 text-sm font-medium flex items-center gap-1"><span className="font-bold text-base">ⵉ</span> Add Image</button>
                <div className="flex items-center gap-2">
                  {(newPostText.trim() || newPostImage) && (
                    <button onClick={handleCancelPost} className="text-gray-400 hover:text-white px-3 py-1.5 text-sm transition">Cancel</button>
                  )}
                  <button onClick={handleCreatePost} disabled={isPosting || (!newPostText.trim() && !newPostImage)} className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white px-5 py-1.5 rounded-full text-sm font-bold transition">{isPosting ? 'Posting...' : 'Post'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* POSTS TIMELINE */}
        {displayedPosts.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            <p className="text-4xl mb-2 font-bold text-teal-600">ⵍ</p>
            <p>{feedTab === 'following' ? "You aren't following anyone yet, or they haven't posted." : "No posts yet. Be the first to share something!"}</p>
          </div>
        )}

        {displayedPosts.map(post => {
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

              {post.text && <p className="text-gray-200 text-sm whitespace-pre-wrap mb-3">{renderPostText(post.text)}</p>}
              
              {post.imageUrl && <img src={post.imageUrl} alt="Post" className="w-full rounded-xl mb-3 border border-slate-700" />}

              <div className="flex items-center gap-4 pt-3 border-t border-slate-700">
                <button onClick={() => handleLike(post.id, post.likes || [], post.authorId)} className={`flex items-center gap-1.5 text-sm transition-colors ${hasLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}>
                  {hasLiked ? '❤️' : '🤍'} {post.likes?.length || 0}
                </button>
                <button onClick={() => setCommentPost(post)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-teal-400 transition-colors">
                  <span className="font-bold text-base">ⵎ</span> Comment
                </button>
                <button onClick={() => setSharePost(post)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-teal-400 transition-colors">
                  <span className="font-bold text-base">ⵙ</span> Share
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {sharePost && <SharePostModal isOpen={!!sharePost} onClose={() => setSharePost(null)} post={sharePost} user={user} onShare={handleExecuteShare} />}
      {commentPost && <CommentModal isOpen={!!commentPost} onClose={() => setCommentPost(null)} post={commentPost} user={user} />}
      {activeStory && <StoryViewer story={activeStory} onClose={() => setActiveStory(null)} />}
      
    </div>
  );
}