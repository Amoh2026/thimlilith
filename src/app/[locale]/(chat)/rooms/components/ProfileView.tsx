'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface ProfileViewProps {
  profileId: string;
  currentUser: User;
  currentUserDoc: any;
  onClose?: () => void;
}

export function ProfileView({ profileId, currentUser, currentUserDoc, onClose }: ProfileViewProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editBanner, setEditBanner] = useState("");

  const isMe = currentUser.uid === profileId;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const snap = await getDoc(doc(db, "users", profileId));
        if (snap.exists()) {
          setProfile(snap.data());
          setEditBio(snap.data().bio || "");
          setEditBanner(snap.data().bannerUrl || "");
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [profileId]);

  const handleSaveProfile = async () => {
    try {
      await updateDoc(doc(db, "users", profileId), {
        bio: editBio,
        bannerUrl: editBanner,
      });
      setProfile({ ...profile, bio: editBio, bannerUrl: editBanner });
      setIsEditing(false);
    } catch (err) {
      alert("Failed to save profile.");
    }
  };

  if (loading) return <div className="text-white text-center py-20">Loading Profile...</div>;
  if (!profile) return <div className="text-white text-center py-20">User not found.</div>;

  return (
    <div className="w-full max-w-2xl mx-auto bg-[#1e293b] rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
      
      {/* BANNER */}
      <div className="h-40 w-full bg-slate-800 relative group">
        {profile.bannerUrl ? (
          <img src={profile.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-teal-900 to-slate-900"></div>
        )}
        {isMe && !isEditing && (
          <button onClick={() => setIsEditing(true)} className="absolute top-3 right-3 bg-black/50 hover:bg-black text-white px-3 py-1 rounded-lg text-xs backdrop-blur-sm">
            ✏️ Edit Banner
          </button>
        )}
      </div>

      {/* AVATAR & INFO */}
      <div className="px-6 pb-6 relative">
        <div className="flex justify-between items-end -mt-12 mb-4">
          <div className="w-24 h-24 rounded-full border-4 border-[#1e293b] bg-teal-600 flex items-center justify-center text-4xl text-white font-bold shadow-lg z-10 overflow-hidden">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              profile.name?.[0].toUpperCase()
            )}
          </div>

          <div className="flex gap-2 mb-2">
            {isMe ? (
              !isEditing && (
                <button onClick={() => setIsEditing(true)} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                  Edit Profile
                </button>
              )
            ) : (
              <button onClick={() => { if (onClose) onClose(); router.push(`/en/rooms?dm=${profileId}`); }} className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                💬 Send Message
              </button>
            )}
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            {profile.name}
            {profile.isPremium && <span title="Premium" className="text-xl">👑</span>}
          </h1>
          <p className="text-sm text-gray-400">Joined {profile.lastSeen ? new Date(profile.lastSeen.toMillis()).toLocaleDateString() : "Recently"}</p>
          
          {isEditing ? (
            <div className="mt-4 space-y-3 bg-[#0f172a] p-4 rounded-xl border border-slate-700">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Banner Image URL</label>
                <input type="text" value={editBanner} onChange={(e) => setEditBanner(e.target.value)} placeholder="https://..." className="w-full bg-[#1e293b] text-white text-sm px-3 py-2 rounded border border-slate-600 focus:border-teal-500 outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Bio</label>
                <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Tell us about yourself..." rows={3} className="w-full bg-[#1e293b] text-white text-sm px-3 py-2 rounded border border-slate-600 focus:border-teal-500 outline-none resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(false)} className="flex-1 bg-slate-700 text-white py-2 rounded font-medium">Cancel</button>
                <button onClick={handleSaveProfile} className="flex-1 bg-teal-600 hover:bg-teal-500 text-white py-2 rounded font-medium">Save</button>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-gray-300 text-sm">
              {profile.bio || (isMe ? "You haven't written a bio yet. Click 'Edit Profile' to add one." : "No bio yet.")}
            </p>
          )}
        </div>

        {/* PROFILE STATS / TABS */}
        <div className="flex gap-6 mt-8 border-b border-slate-700 pb-2">
          <div className="text-center">
            <p className="text-white font-bold">{profile.savedMessageCount || 0}</p>
            <p className="text-xs text-gray-400">Vault Messages</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold">-</p>
            <p className="text-xs text-gray-400">Friends</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold">-</p>
            <p className="text-xs text-gray-400">Rooms</p>
          </div>
        </div>

        <div className="mt-6 text-center text-gray-500 text-sm py-8 border border-slate-700 border-dashed rounded-xl">
          Posts from {profile.name} will appear here in the next update.
        </div>
      </div>
    </div>
  );
}