// src/app/[locale]/(chat)/rooms/components/ChatArea.tsx
"use client";

import React, { RefObject, useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { getYouTubeID, renderTextWithLinks, REACTIONS } from './utils';

interface ChatAreaProps {
  user: User;
  userDoc: any;
  activeRoom: any;
  filteredMessages: any[];
  inputText: string;
  setInputText: (v: string) => void;
  uploading: boolean;
  isRecording: boolean;
  isCheckingAI: boolean;
  replyingTo: any;
  setReplyingTo: (v: any) => void;
  activeReactionMenu: string | null;
  setActiveReactionMenu: (v: string | null) => void;
  typingUsers: string[];
  messageSearchTerm: string;
  setMessageSearchTerm: (v: string) => void;
  messageSearchDate: string;
  setMessageSearchDate: (v: string) => void;
  isSearchExpanded: boolean;
  setIsSearchExpanded: (v: boolean) => void;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  isDMPartnerBlocked: boolean;
  dmPartnerUid: string | null;
  getDMName: (room: any) => string;
  handleSendText: (e: React.FormEvent) => void;
  handleEditMessage: (id: string, text: string) => void;
  handleDeleteMessage: (id: string) => void;
  handleReaction: (id: string, emoji: string, reactions: any) => void;
  handlePinMessage: (id: string) => void;
  handleUnpinMessage: (id: string) => void;
  handleBlockUser: (uid: string, name: string) => void;
  handleReportUser: (uid: string, name: string) => void;
  handleCopyInviteLink: () => void;
  handleTyping: (v: string) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  startRecording: () => void;
  stopRecording: () => void;
  setShowAddMemberModal: (v: boolean) => void;
  setShowPinnedModal: (v: boolean) => void;
  openMembersModal: () => void;
  showRightSidebar: boolean;
  setShowRightSidebar: (v: boolean) => void;
  onVideo: () => void;
  onSaveToATK: (msg: any) => Promise<{ ok: boolean; error?: string; id?: string }>;
  handleSendSticker: (url: string) => void;
  onTranslate: (msg: any, targetLang: string) => Promise<string | null>;
  onOpenTheme: () => void;
}

export function ChatArea(p: ChatAreaProps) {
  const [stickers, setStickers] = useState<{ emotions: string[], identity: string[] }>({ emotions: [], identity: [] });
  const [langMenuId, setLangMenuId] = useState<string | null>(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);

  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/chat/stickers')
      .then(res => res.json())
      .then(data => setStickers(data))
      .catch(err => console.error("Could not load stickers", err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
        setShowStickerPicker(false);
      }
      const target = event.target as HTMLElement;
      if (!target.closest('.lang-menu-container')) {
        setLangMenuId(null);
      }
      if (!target.closest('.header-menu-container')) {
        setShowHeaderMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!p.activeRoom) {
    return (
      <div className="flex-1 flex flex-col bg-[#0b1120]">
        <div className="flex-1 flex items-center justify-center text-gray-500">Select or create a Thajmaath to start chatting.</div>
      </div>
    );
  }

  const selectedMsg = selectedMsgId ? p.filteredMessages.find((m: any) => m.id === selectedMsgId) : null;

  return (
    <div className="flex-1 flex flex-col bg-[#0b1120] overflow-hidden relative">
      {/* Header */}
      <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-[#0f172a] relative z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-xl">{p.activeRoom.type === "direct" ? '👤' : '👥'}</div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-white font-medium capitalize ${p.isDMPartnerBlocked ? 'line-through text-gray-500' : ''}`}>
                {p.activeRoom.type === "direct" ? p.getDMName(p.activeRoom) : `Thajmaath n ${p.activeRoom.name}`}
              </h3>
            </div>
            <p className={`text-xs ${p.isDMPartnerBlocked ? 'text-red-400' : 'text-teal-400'}`}>
              {p.activeRoom.type === "direct" ? (p.isDMPartnerBlocked ? "Blocked User" : "Offline") : "Active community"}
            </p>
          </div>
        </div>

        <div className="flex gap-2 items-center relative">
          <div className="relative header-menu-container">
            <button 
              onClick={() => setShowHeaderMenu(!showHeaderMenu)} 
              className="bg-[#1e293b] hover:bg-slate-700 border border-slate-700 text-white w-10 h-10 rounded-lg flex items-center justify-center text-xl"
            >
              ⋮
            </button>

            {showHeaderMenu && (
              <div className="absolute right-0 top-12 bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl w-52 py-2 flex flex-col z-[100]">
                <button onClick={() => { p.setIsSearchExpanded(!p.isSearchExpanded); if (p.isSearchExpanded) { p.setMessageSearchTerm(""); p.setMessageSearchDate(""); } setShowHeaderMenu(false); }} className="text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white">🔍 Search Messages</button>
                <button onClick={() => { p.onVideo(); setShowHeaderMenu(false); }} className="text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white">📹 Video Call</button>
                <div className="border-t border-slate-700 my-1"></div>

                {p.activeRoom.type === "group" && p.activeRoom.createdBy === p.user.uid && (
                  <>
                    <button onClick={() => { p.onOpenTheme(); setShowHeaderMenu(false); }} className="text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white">🎨 Decorate Room</button>
                    <button onClick={() => { p.setShowAddMemberModal(true); setShowHeaderMenu(false); }} className="text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white">➕ Add Member</button>
                    <button onClick={() => { p.handleCopyInviteLink(); setShowHeaderMenu(false); }} className="text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white">🔗 Invite Link</button>
                    <button onClick={() => { p.openMembersModal(); setShowHeaderMenu(false); }} className="text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white">👑 Manage Roles</button>
                    <button onClick={() => { p.setShowRightSidebar(!p.showRightSidebar); setShowHeaderMenu(false); }} className="text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white">👥 {p.showRightSidebar ? 'Hide' : 'Show'} Members</button>
                  </>
                )}
                {p.activeRoom.type === "direct" && p.dmPartnerUid && (
                  <>
                    <button onClick={() => { p.handleBlockUser(p.dmPartnerUid!, p.getDMName(p.activeRoom)); setShowHeaderMenu(false); }} className="text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white">{p.isDMPartnerBlocked ? '🚫 Unblock' : '🚫 Block'}</button>
                    <button onClick={() => { p.handleReportUser(p.dmPartnerUid!, p.getDMName(p.activeRoom)); setShowHeaderMenu(false); }} className="text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white">⚠️ Report</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {p.isSearchExpanded && (
        <div className="bg-[#1e293b] border-b border-slate-800 p-2 flex items-center justify-center gap-4">
          <input type="text" placeholder="Search messages..." value={p.messageSearchTerm} onChange={(e) => p.setMessageSearchTerm(e.target.value)} className="bg-[#0f172a] text-sm text-white focus:outline-none rounded-lg px-3 py-1.5 w-64 border border-slate-700" />
          <input type="date" value={p.messageSearchDate} onChange={(e) => p.setMessageSearchDate(e.target.value)} className="bg-[#0f172a] text-sm text-gray-400 rounded-lg px-3 py-1.5 [color-scheme:dark] border border-slate-700" />
          <button onClick={() => { p.setIsSearchExpanded(false); p.setMessageSearchTerm(""); p.setMessageSearchDate(""); }} className="text-xs text-red-400 font-bold hover:underline">Close Search</button>
        </div>
      )}

      {/* Pinned Banner */}
      {p.activeRoom.pinnedMessages && p.activeRoom.pinnedMessages.length > 0 && (
        <div className="bg-teal-900/30 border-b border-teal-500/50 p-2 px-6 flex justify-between items-center cursor-pointer hover:bg-teal-900/50 relative z-20" onClick={() => p.setShowPinnedModal(true)}>
          <div className="flex items-center gap-2 text-teal-300 text-sm font-medium">
            <span>📌</span>
            <span>{p.activeRoom.pinnedMessages.length} Pinned Message(s)</span>
          </div>
          <span className="text-xs text-teal-400 underline">Click to view</span>
        </div>
      )}

      {/* Messages Container with Custom Theme Background */}
      <div 
        className="flex-1 p-6 overflow-y-auto overflow-x-hidden flex flex-col gap-4 relative"
        style={{
          backgroundColor: (p.activeRoom.type === "direct" 
            ? p.userDoc?.dmThemes?.[p.activeRoom.id]?.bgColor 
            : p.activeRoom.customization?.bgColor) || '#0b1120',
            
          backgroundImage: (p.activeRoom.type === "direct"
            ? p.userDoc?.dmThemes?.[p.activeRoom.id]?.bgImage
            : p.activeRoom.customization?.bgImage) 
            ? `url(${p.activeRoom.type === "direct" ? p.userDoc?.dmThemes?.[p.activeRoom.id]?.bgImage : p.activeRoom.customization?.bgImage})` 
            : 'none',
            
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay so text stays readable */}
        {((p.activeRoom.type === "direct" && p.userDoc?.dmThemes?.[p.activeRoom.id]?.bgImage) || 
          (p.activeRoom.type === "group" && p.activeRoom.customization?.bgImage)) && (
          <div className="absolute inset-0 bg-black/60 pointer-events-none"></div>
        )}

        {/* Poem Background */}
        {((p.activeRoom.type === "direct" && p.userDoc?.dmThemes?.[p.activeRoom.id]?.poemText) || 
          (p.activeRoom.type === "group" && p.activeRoom.customization?.poemText)) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 select-none overflow-hidden">
            <p className="text-4xl md:text-6xl font-serif text-white text-center max-w-2xl leading-relaxed" style={{ transform: 'rotate(-15deg)' }}>
              {p.activeRoom.type === "direct" 
                ? p.userDoc?.dmThemes?.[p.activeRoom.id]?.poemText 
                : p.activeRoom.customization?.poemText}
            </p>
          </div>
        )}

        <div className="relative z-10 flex flex-col gap-4 w-full h-full pb-4">
          {p.filteredMessages.length === 0 && (
            <div className="text-center text-gray-500 mt-10">No messages yet. Say Azul to {p.activeRoom.type === "direct" ? p.getDMName(p.activeRoom) : `Thajmaath n ${p.activeRoom.name}`}!</div>
          )}

          {p.filteredMessages.map((msg, index) => {
            if (p.userDoc?.blockedUsers?.includes(msg.senderId)) return <div key={msg.id || index} className="text-center text-xs text-gray-600 my-2">Message from a blocked user</div>;

            const isMe = msg.senderId === p.user.uid;
            const isRoomAdmin = p.activeRoom?.admins?.includes(p.user.uid) || p.activeRoom?.createdBy === p.user.uid;
            const isRoomMod = p.activeRoom?.moderators?.includes(p.user.uid);
            const canDelete = isMe || isRoomAdmin || isRoomMod;
            
            const msgClass = "flex flex-col relative mb-2 group " + (isMe ? 'self-end items-end' : 'items-start');
            
            const isSelected = selectedMsgId === msg.id;
            const selectable = msg.type === 'text' && (msg.text || '').trim().length > 0;
            const bubbleClass = "px-4 py-3 rounded-2xl max-w-[300px] md:max-w-md break-words transition-all relative "
              + (isMe ? 'bg-teal-600 text-white rounded-tr-sm' : 'bg-[#1e293b] text-gray-200 rounded-tl-sm')
              + (isSelected ? ' ring-2 ring-emerald-400' : '')
              + (selectable ? ' cursor-pointer' : '');
            const ytId = msg.type === 'text' ? getYouTubeID(msg.text) : null;
            const isMenuOpen = p.activeReactionMenu === msg.id;
            const parts = msg.type === 'text' ? renderTextWithLinks(msg.text) : [];

            return (
              <div key={msg.id || index} className={msgClass}>
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-xs text-gray-400 font-medium">{isMe ? "You" : msg.senderName}</span>
                </div>

                <div className="relative flex w-fit max-w-full items-center">
                  
                  {/* Action Buttons - Absolutely positioned to float in the margin */}
                  <div className={`absolute top-1/2 -translate-y-1/2 flex flex-col gap-1 transition-opacity duration-200 opacity-100 md:opacity-0 md:group-hover:opacity-100 z-30 ${isMe ? 'right-full mr-3' : 'left-full ml-3'}`}>
                    <button type="button" onClick={(e) => { e.stopPropagation(); p.setReplyingTo(msg); }} className="bg-[#1e293b] border border-slate-600 hover:bg-slate-700 text-gray-300 rounded-full w-8 h-8 flex-shrink-0 flex items-center justify-center text-sm shadow-lg" title="Reply">↩️</button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); p.setActiveReactionMenu(isMenuOpen ? null : msg.id); }} className="bg-[#1e293b] border border-slate-600 hover:bg-slate-700 text-gray-300 rounded-full w-8 h-8 flex-shrink-0 flex items-center justify-center text-sm shadow-lg" title="React">😊</button>
                    
                    {msg.type === 'text' && (
                      <div className="relative lang-menu-container">
                        <button type="button" onClick={(e) => { 
                          e.stopPropagation(); 
                          setLangMenuId(langMenuId === msg.id ? null : msg.id); 
                        }} className={`bg-[#1e293b] border border-slate-600 hover:bg-slate-700 text-teal-400 rounded-full w-8 h-8 flex-shrink-0 flex items-center justify-center text-sm shadow-lg ${translatingId === msg.id ? 'animate-pulse' : ''}`} title="Translate">
                          {translatingId === msg.id ? '⏳' : '🌍'}
                        </button>

                        {langMenuId === msg.id && (
                          <div className={`absolute top-0 bg-[#1e293b] border border-teal-500 rounded-lg shadow-xl flex flex-col p-1 z-50 w-32 ${isMe ? 'right-10' : 'left-10'}`}>
                            {[
                              { code: 'en', label: '🇬🇧 English' },
                              { code: 'fr', label: '🇫🇷 Français' },
                              { code: 'ar', label: '🇸🇦 العربية' },
                              { code: 'kab', label: 'ⵣ Kabyle' }
                            ].map(lang => (
                              <button key={lang.code} type="button" onClick={async (e) => {
                                e.stopPropagation();
                                setLangMenuId(null);
                                setTranslatingId(msg.id);
                                try {
                                  const t = await p.onTranslate(msg, lang.code);
                                  if (t) setTranslations((prev: any) => ({ ...prev, [msg.id]: t }));
                                } finally {
                                  setTranslatingId(null);
                                }
                              }} className="text-left text-xs text-gray-300 hover:bg-teal-600 hover:text-white px-2 py-1.5 rounded transition-colors">
                                {lang.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {(isMe || canDelete) && (
                      <>
                        {isMe && <button type="button" onClick={(e) => { e.stopPropagation(); p.handleEditMessage(msg.id, msg.text); }} className="bg-[#1e293b] border border-slate-600 hover:bg-slate-700 text-blue-400 rounded-full w-8 h-8 flex-shrink-0 flex items-center justify-center text-sm shadow-lg" title="Edit">✏️</button>}
                        <button type="button" onClick={(e) => { e.stopPropagation(); p.handleDeleteMessage(msg.id); }} className="bg-[#1e293b] border border-slate-600 hover:bg-slate-700 text-red-400 rounded-full w-8 h-8 flex-shrink-0 flex items-center justify-center text-sm shadow-lg" title="Delete">🗑️</button>
                        {(isRoomAdmin || isRoomMod) && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); p.activeRoom.pinnedMessages?.includes(msg.id) ? p.handleUnpinMessage(msg.id) : p.handlePinMessage(msg.id); }} className={`bg-[#1e293b] border border-slate-600 rounded-full w-8 h-8 flex-shrink-0 flex items-center justify-center text-sm shadow-lg ${p.activeRoom.pinnedMessages?.includes(msg.id) ? 'text-yellow-400 border-yellow-500' : 'text-gray-300'}`} title="Pin">📌</button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={bubbleClass}
                    onClick={selectable ? () => setSelectedMsgId(isSelected ? null : msg.id) : undefined}
                  >
                    {msg.replyTo && (
                      <div className="bg-black/20 border-l-4 border-teal-300 p-2 rounded mb-2 text-sm">
                        <p className="font-semibold text-teal-200 text-xs">{msg.replyTo.senderName}</p>
                        <p className="text-gray-300 text-xs truncate max-w-[200px]">{msg.replyTo.text}</p>
                      </div>
                    )}
                    
                    {msg.type === 'text' && (
                      <div className="flex flex-col gap-2">
                        <p className="break-words whitespace-pre-wrap">
                          {parts.map((part: any) =>
                            part.type === 'link'
                              ? <a key={part.key} href={part.content} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-300 underline break-all">{part.content}</a>
                              : <span key={part.key}>{part.content}</span>
                          )}
                        </p>

                        {translations[msg.id] && (
                          <div className="mt-2 pt-2 border-t border-black/20 text-sm italic opacity-90">
                            🌍 {translations[msg.id]}
                          </div>
                        )}

                        {ytId && (
                          <div onClick={(e) => e.stopPropagation()}>
                            <iframe width="100%" height="200" src={`https://www.youtube.com/embed/${ytId}`} title="YouTube" frameBorder="0" allowFullScreen className="rounded-lg mt-2 max-w-sm bg-black"></iframe>
                          </div>
                        )}
                      </div>
                    )}
                    {msg.type === 'image' && <img src={msg.fileUrl} alt="" className="max-w-full rounded-lg cursor-pointer" onClick={() => window.open(msg.fileUrl, '_blank')} />}
                    {msg.type === 'video' && <video controls className="max-w-full rounded-lg bg-black"><source src={msg.fileUrl} type="video/mp4" /></video>}
                    
                    {msg.type === 'audio' && (
                      <div className="flex flex-col gap-2">
                        <audio controls className="max-w-[250px] h-10">
                          <source src={msg.fileUrl} type="audio/webm" />
                        </audio>
                        {msg.text && (
                          <p className="text-sm text-gray-200 italic border-l-2 border-teal-400 pl-2">
                            "{msg.text}"
                          </p>
                        )}
                      </div>
                    )}
                    
                    {msg.type === 'file' && <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-black/20 p-3 rounded-lg"><span className="text-2xl">📄</span><span className="text-sm font-semibold truncate max-w-[150px]">{msg.fileName}</span></a>}
                  </div>
                </div>

                {isMenuOpen && (
                  <div className={`absolute top-full mt-2 z-50 bg-[#1e293b] border border-teal-500 rounded-full px-2 py-1.5 flex gap-1 shadow-2xl ${isMe ? 'right-12' : 'left-12'}`}>
                    {REACTIONS.map(emoji => (
                      <button type="button" key={emoji} onClick={(e) => { e.stopPropagation(); p.handleReaction(msg.id, emoji, msg.reactions); }} className="hover:scale-125 text-2xl p-1">{emoji}</button>
                    ))}
                  </div>
                )}

                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end pr-2' : 'justify-start pl-2'}`}>
                    {Object.entries(msg.reactions).map(([emoji, users]: [string, any]) => {
                      if (!users || users.length === 0) return null;
                      const hasReacted = users.includes(p.user.uid);
                      return (
                        <button type="button" key={emoji} onClick={() => p.handleReaction(msg.id, emoji, msg.reactions)} className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${hasReacted ? 'bg-teal-900/50 border-teal-500 text-teal-300' : 'bg-[#1e293b] border-slate-600 text-gray-400'}`}>
                          <span>{emoji}</span><span>{users.length}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <span className="text-[10px] text-gray-500 mt-1 px-1 flex items-center gap-1 justify-end">
                  {msg.createdAt ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Sending...'}
                  {msg.editedAt && <span className="italic">(edited)</span>}
                  {isMe && <span className="ml-1">{msg.readBy && msg.readBy.length > 0 ? <span className="text-teal-400 text-xs">✓✓</span> : <span className="text-gray-500 text-xs">✓</span>}</span>}
                </span>
              </div>
            );
          })}
          <div ref={p.messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-4 bg-[#0f172a] border-t border-slate-800 relative z-20">
        
        {selectedMsg && (
          <div className="bg-emerald-900/30 border border-emerald-500/50 rounded-lg p-2 mb-2 flex items-center gap-2">
            <span className="text-xs text-emerald-300 truncate flex-1">
              💾 Saving: “{(selectedMsg.text || '').slice(0, 60)}{(selectedMsg.text || '').length > 60 ? '…' : ''}”
            </span>
            <button
              type="button"
              onClick={async () => {
                const r = await p.onSaveToATK(selectedMsg);
                setSelectedMsgId(null);
                if (r.ok) alert("Saved to ATK ✨");
                else alert(`Save failed: ${r.error || 'unknown error'}`);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
            >
              Save to ATK
            </button>
            <button
              type="button"
              onClick={() => setSelectedMsgId(null)}
              className="text-gray-400 hover:text-white px-2"
              title="Cancel"
            >
              ✕
            </button>
          </div>
        )}

        {p.typingUsers.length > 0 && (
          <div className="text-xs text-teal-400 px-4 py-1 italic animate-pulse">
            {p.typingUsers.join(" and ")} {p.typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        {p.replyingTo && (
          <div className="bg-[#1e293b] border-l-4 border-teal-500 p-2 mb-2 rounded flex justify-between items-center">
            <div>
              <p className="text-xs text-teal-400 font-bold">Replying to {p.replyingTo.senderName}</p>
              <p className="text-sm text-gray-300 truncate max-w-[300px]">{p.replyingTo.text || "📎 Media"}</p>
            </div>
            <button type="button" onClick={() => p.setReplyingTo(null)} className="text-gray-400 hover:text-white text-xl px-2">✕</button>
          </div>
        )}
        
        <form onSubmit={p.handleSendText} className="flex items-center gap-2 bg-[#1e293b] rounded-xl px-4 py-2">
          <input type="file" ref={p.fileInputRef} className="hidden" onChange={p.handleFileUpload} accept="image/*,video/*,.pdf,.doc,.docx" />
          
          <button type="button" onClick={() => p.fileInputRef.current?.click()} className="text-gray-400 hover:text-white p-2" title="File">📎</button>
          <button type="button" onClick={() => p.fileInputRef.current?.click()} className="text-gray-400 hover:text-white p-2" title="Media">🖼️</button>
          <button type="button" onClick={p.isRecording ? p.stopRecording : p.startRecording} className={`p-2 rounded-full ${p.isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400'}`}>{p.isRecording ? '⏹️' : '🎤'}</button>
          
          <input 
            type="text" 
            value={p.inputText} 
            onChange={(e) => p.handleTyping(e.target.value)} 
            onFocus={() => { setShowEmojiPicker(false); setShowStickerPicker(false); }}
            placeholder={p.isCheckingAI ? "AI Scanning..." : p.uploading ? "Uploading..." : p.isRecording ? "Recording..." : p.replyingTo ? `Reply to ${p.replyingTo.senderName}...` : `Message...`} 
            disabled={p.uploading || p.isRecording || p.isCheckingAI || p.isDMPartnerBlocked} 
            className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder-gray-500 px-2" 
          />

          <div className="flex items-center relative" ref={pickerRef}>
            <button 
              type="button" 
              onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowStickerPicker(false); }} 
              className="text-gray-400 hover:text-white p-2 text-xl"
            >
              😊
            </button>
            
            {showEmojiPicker && (
              <div className="absolute bottom-12 right-0 bg-[#1e293b] border border-slate-600 p-2 rounded-xl shadow-2xl grid grid-cols-6 gap-1 w-52 z-50">
                {["😀","😂","❤️","👍","🔥","😮","😢","🙏","🎉","💯","😍","😎","🥰","😡","🤔","👋","💪","✨","🥳","👏","🤣","😭","💔","🍀"].map(emoji => (
                  <button key={emoji} type="button" onClick={() => { p.setInputText(p.inputText + emoji); setShowEmojiPicker(false); }} className="hover:scale-125 hover:bg-slate-700 rounded text-xl p-1 transition-transform">
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            <button 
              type="button" 
              onClick={() => { setShowStickerPicker(!showStickerPicker); setShowEmojiPicker(false); }} 
              className="text-gray-400 hover:text-white p-2 text-xl"
              title="Kabyle Stickers"
            >
              🎨
            </button>

            {showStickerPicker && (
              <div className="absolute bottom-12 right-10 bg-[#1e293b] border border-slate-600 p-3 rounded-xl shadow-2xl w-80 h-96 overflow-y-auto z-50">
                
                {/* DYNAMIC EMOTIONS */}
                {stickers.emotions.length > 0 && (
                  <>
                    <h4 className="text-xs text-teal-400 font-bold uppercase mb-2">Émotions ({stickers.emotions.length})</h4>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {stickers.emotions.map(s => (
                        <button key={s} type="button" onClick={() => { p.handleSendSticker(`/stickers/emotions/${s}`); setShowStickerPicker(false); }} className="hover:scale-110 transition-transform">
                          <img src={`/stickers/emotions/${s}`} alt={s} className="w-12 h-12 rounded-lg object-cover bg-black/20" />
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* DYNAMIC IDENTITY */}
                {stickers.identity.length > 0 && (
                  <>
                    <h4 className="text-xs text-teal-400 font-bold uppercase mb-2">Identité & Fierté ({stickers.identity.length})</h4>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {stickers.identity.map(s => (
                        <button key={s} type="button" onClick={() => { p.handleSendSticker(`/stickers/identity/${s}`); setShowStickerPicker(false); }} className="hover:scale-110 transition-transform">
                          <img src={`/stickers/identity/${s}`} alt={s} className="w-12 h-12 rounded-lg object-cover bg-black/20" />
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* EMPTY STATE */}
                {stickers.emotions.length === 0 && stickers.identity.length === 0 && (
                  <p className="text-center text-gray-500 text-sm mt-10">No stickers found. Drop images in the public folder!</p>
                )}
              </div>
            )}
          </div>
          
          <button type="submit" disabled={p.uploading || p.isRecording || p.isCheckingAI || !p.inputText.trim() || p.isDMPartnerBlocked} className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white p-2 rounded-lg">
            {p.isCheckingAI ? '⏳' : '➤'}
          </button>
        </form>
      </div>
    </div>
  );
}