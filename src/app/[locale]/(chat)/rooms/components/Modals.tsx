// src/app/[locale]/(chat)/rooms/components/Modals.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';

interface ModalsProps {
  user: User;
  activeRoom: any;
  messages: any[];
  showReportModal: boolean;
  setShowReportModal: (v: boolean) => void;
  reportTarget: any;
  reportReason: string;
  setReportReason: (v: string) => void;
  submitReport: () => void;
  showAddMemberModal: boolean;
  setShowAddMemberModal: (v: boolean) => void;
  memberSearchQuery: string;
  setMemberSearchQuery: (v: string) => void;
  memberSearchResults: any[];
  isSearchingMembers: boolean;
  handleSearchMembersToAdd: (e: React.FormEvent) => void;
  addMemberToRoom: (u: any) => void;
  showMembersModal: boolean;
  setShowMembersModal: (v: boolean) => void;
  roomMembersList: any[];
  handlePromote: (uid: string) => void;
  handleDemote: (uid: string) => void;
  showPinnedModal: boolean;
  setShowPinnedModal: (v: boolean) => void;
  handleUnpinMessage: (id: string) => void;
  showThemeModal: boolean;
  setShowThemeModal: (v: boolean) => void;
  themeData: any;
  setThemeData: (v: any) => void;
  handleSaveTheme: () => void;
}

export function Modals(p: ModalsProps) {
  // State to hold stickers for the background picker
  const [themeStickers, setThemeStickers] = useState<{ emotions: string[], identity: string[] }>({ emotions: [], identity: [] });

  useEffect(() => {
    if (p.showThemeModal) {
      fetch('/api/chat/stickers')
        .then(res => res.json())
        .then(data => setThemeStickers(data))
        .catch(err => console.error("Could not load stickers for theme", err));
    }
  }, [p.showThemeModal]);

  return (
    <>
      {/* Report Modal */}
      {p.showReportModal && p.reportTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md bg-[#1e293b] rounded-2xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Report {p.reportTarget.name}</h2>
            <p className="text-sm text-gray-400 mb-4">Why are you reporting this user?</p>
            <div className="space-y-2 mb-6">
              {["Spam", "Harassment", "Racism / Hate Speech", "Inappropriate Media", "Other"].map(reason => (
                <label key={reason} className="flex items-center gap-3 p-3 bg-[#0f172a] rounded-lg border border-slate-700 cursor-pointer">
                  <input type="radio" name="reportReason" value={reason} checked={p.reportReason === reason} onChange={e => p.setReportReason(e.target.value)} />
                  <span className="text-sm text-gray-200">{reason}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => p.setShowReportModal(false)} className="flex-1 bg-slate-700 text-white py-2 rounded-lg">Cancel</button>
              <button onClick={p.submitReport} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-lg">Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {p.showAddMemberModal && p.activeRoom && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md bg-[#1e293b] rounded-2xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Add Member</h2>
            <form onSubmit={p.handleSearchMembersToAdd} className="flex gap-2 mb-4">
              <input type="text" value={p.memberSearchQuery} onChange={e => p.setMemberSearchQuery(e.target.value)} placeholder="Search by nickname..." className="flex-1 bg-[#0f172a] text-sm text-white rounded-lg px-4 py-2 border border-slate-700" />
              <button type="submit" disabled={p.isSearchingMembers} className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 rounded-lg">{p.isSearchingMembers ? '...' : 'Search'}</button>
            </form>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-6">
              {p.memberSearchResults.length === 0 && p.memberSearchQuery && !p.isSearchingMembers && <p className="text-center text-gray-500 text-sm">No users found.</p>}
              {p.memberSearchResults.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-[#0f172a] rounded-lg border border-slate-700">
                  <div className="flex items-center gap-3">
                    {m.photoURL ? <img src={m.photoURL} alt="" className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-xs">{m.name?.[0].toUpperCase()}</div>}
                    <p className="text-sm font-bold text-white">{m.name}</p>
                  </div>
                  <button onClick={() => p.addMemberToRoom(m)} className="bg-teal-600 hover:bg-teal-500 text-white text-xs px-3 py-1.5 rounded-lg">Add</button>
                </div>
              ))}
            </div>
            <button onClick={() => p.setShowAddMemberModal(false)} className="w-full bg-slate-700 text-white font-bold py-2 rounded-lg">Close</button>
          </div>
        </div>
      )}

      {/* Manage Members Modal */}
      {p.showMembersModal && p.activeRoom && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md bg-[#1e293b] rounded-2xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Manage Members</h2>
            <p className="text-xs text-gray-400 mb-4">Promote members to Moderators.</p>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-6">
              {p.roomMembersList.map(m => {
                const isAdmin = p.activeRoom.admins?.includes(m.id) || p.activeRoom.createdBy === m.id;
                const isMod = p.activeRoom.moderators?.includes(m.id);
                const isMe = m.id === p.user.uid;
                return (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-[#0f172a] rounded-lg border border-slate-700">
                    <div className="flex items-center gap-3">
                      {m.photoURL ? <img src={m.photoURL} alt="" className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-xs">{m.name?.[0].toUpperCase()}</div>}
                      <p className="text-sm font-bold text-white">{m.name} {isMe && "(You)"}</p>
                    </div>
                    <div>
                      {isAdmin ? <span className="text-xs font-bold text-teal-400">Admin</span>
                        : isMod ? <button onClick={() => p.handleDemote(m.id)} className="text-xs text-red-400">Remove Mod</button>
                        : <button onClick={() => p.handlePromote(m.id)} className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1 rounded">Make Mod</button>}
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => p.setShowMembersModal(false)} className="w-full bg-teal-600 text-white font-bold py-2 rounded-lg">Close</button>
          </div>
        </div>
      )}

      {/* Pinned Messages Modal */}
      {p.showPinnedModal && p.activeRoom && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md bg-[#1e293b] rounded-2xl p-6 border border-slate-700 flex flex-col max-h-[80vh]">
            <h2 className="text-xl font-bold text-white mb-4">📌 Pinned Messages</h2>
            <div className="space-y-3 overflow-y-auto mb-6 flex-1">
              {p.messages.filter(m => p.activeRoom.pinnedMessages?.includes(m.id)).map(msg => (
                <div key={msg.id} className="bg-[#0f172a] p-4 rounded-xl border border-slate-700">
                  <p className="text-xs text-teal-400 font-bold mb-1">{msg.senderName}</p>
                  <p className="text-sm text-gray-200 break-words">{msg.text || "📎 Media"}</p>
                  {(p.activeRoom.admins?.includes(p.user.uid) || p.activeRoom.moderators?.includes(p.user.uid)) && (
                    <button onClick={() => p.handleUnpinMessage(msg.id)} className="text-xs text-red-400 hover:underline mt-2">Unpin</button>
                  )}
                </div>
              ))}
              {p.messages.filter(m => p.activeRoom.pinnedMessages?.includes(m.id)).length === 0 && (
                <p className="text-center text-gray-500 text-sm">No pinned messages.</p>
              )}
            </div>
            <button onClick={() => p.setShowPinnedModal(false)} className="w-full bg-teal-600 text-white font-bold py-2 rounded-lg">Close</button>
          </div>
        </div>
      )}

      {/* Theme Customization Modal */}
      {p.showThemeModal && p.activeRoom && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md bg-[#1e293b] rounded-xl p-6 border border-slate-700 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">🎨 Decorate Room</h2>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Background Color</label>
                <input 
                  type="color" 
                  value={p.themeData?.bgColor || "#0b1120"} 
                  onChange={(e) => p.setThemeData({ ...p.themeData, bgColor: e.target.value })}
                  className="w-full h-10 rounded cursor-pointer bg-transparent"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Background Image URL (Optional)</label>
                <input 
                  type="text" 
                  placeholder="https://example.com/image.jpg"
                  value={p.themeData?.bgImage || ""} 
                  onChange={(e) => p.setThemeData({ ...p.themeData, bgImage: e.target.value })}
                  className="w-full bg-[#0f172a] text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-teal-500 outline-none"
                />
              </div>

              {/* 👇 NEW: PICK A STICKER AS BACKGROUND 👇 */}
              <div className="bg-[#0f172a] border border-slate-700 rounded-lg p-3">
                <label className="text-sm text-teal-400 font-bold mb-2 block">OR Pick a Sticker as Background</label>
                <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto pr-1">
                  {themeStickers.emotions.map(s => (
                    <button key={s} type="button" onClick={() => p.setThemeData({ ...p.themeData, bgImage: `/stickers/emotions/${s}` })} className="hover:scale-110 transition-transform">
                      <img src={`/stickers/emotions/${s}`} alt={s} className="w-10 h-10 rounded object-cover bg-black/20" />
                    </button>
                  ))}
                  {themeStickers.identity.map(s => (
                    <button key={s} type="button" onClick={() => p.setThemeData({ ...p.themeData, bgImage: `/stickers/identity/${s}` })} className="hover:scale-110 transition-transform">
                      <img src={`/stickers/identity/${s}`} alt={s} className="w-10 h-10 rounded object-cover bg-black/20" />
                    </button>
                  ))}
                </div>
                {p.themeData?.bgImage && (
                  <button type="button" onClick={() => p.setThemeData({ ...p.themeData, bgImage: "" })} className="text-xs text-red-400 mt-2 hover:underline">Clear Background Image</button>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Poem / Quote (Optional)</label>
                <textarea 
                  placeholder="Write a Kabyle poem or quote..."
                  value={p.themeData?.poemText || ""} 
                  onChange={(e) => p.setThemeData({ ...p.themeData, poemText: e.target.value })}
                  rows={3}
                  className="w-full bg-[#0f172a] text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-teal-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => p.setShowThemeModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg">Cancel</button>
              <button onClick={p.handleSaveTheme} className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}