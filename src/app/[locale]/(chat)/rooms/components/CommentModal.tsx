'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: any;
  user: User;
}

export default function CommentModal({ isOpen, onClose, post, user }: CommentModalProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isOpen || !post) return;
    const q = query(
      collection(db, "posts", post.id, "comments"), 
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [isOpen, post]);

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !post) return;
    
    setIsSending(true);
    try {
      await addDoc(collection(db, "posts", post.id, "comments"), {
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || "User",
        authorPhotoURL: user.photoURL || null,
        text: newComment.trim(),
        createdAt: serverTimestamp(),
      });
      setNewComment("");
    } catch (err: any) {
      alert("Failed to comment: " + err.message);
    }
    setIsSending(false);
  };

  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-lg mx-4 rounded-2xl bg-[#1e293b] border border-white/10 shadow-2xl relative flex flex-col h-[80vh] max-h-[600px]" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white">Comments</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="p-4 bg-[#0f172a] border-b border-slate-700">
          <p className="text-xs text-teal-400 font-bold mb-1">{post.authorName}</p>
          <p className="text-sm text-gray-300 line-clamp-2 mb-2">{post.text}</p>
          {post.imageUrl && (
            <img src={post.imageUrl} alt="Post attachment" className="max-h-40 w-auto rounded-lg border border-slate-600 object-cover" />
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments.length === 0 && (
            <p className="text-center text-gray-500 text-sm mt-10">No comments yet. Be the first!</p>
          )}
          
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0 overflow-hidden">
                {c.authorPhotoURL ? <img src={c.authorPhotoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-white">{c.authorName[0]}</div>}
              </div>
              <div className="flex-1 bg-[#0f172a] p-3 rounded-xl rounded-tl-none border border-slate-700/50">
                <p className="text-xs text-white font-bold mb-1">{c.authorName}</p>
                <p className="text-sm text-gray-300 break-words">{c.text}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendComment} className="p-4 border-t border-slate-700 bg-[#1e293b]">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-[#0f172a] text-sm text-white rounded-xl px-4 py-2 border border-slate-600 focus:outline-none focus:border-teal-500"
            />
            <button 
              type="submit" 
              disabled={isSending || !newComment.trim()}
              className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-bold transition"
            >
              {isSending ? '...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}