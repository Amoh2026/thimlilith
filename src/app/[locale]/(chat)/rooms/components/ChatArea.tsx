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
  onOpenSettings: () => void;
  onForward: (msgId: string) => void;
  onOpenUserAction: (uid: string, name: string) => void;
  onUpdateRoomSettings: (data: any) => void;
  onSaveMessage: (msg: any) => void;
  savedCount: number;
  maxSaved: number;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (v: boolean) => void;
}

export function ChatArea(p: ChatAreaProps) {
  const [stickers, setStickers] = useState<{ emotions: string[], identity: string[] }>({ emotions: [], identity: [] });
  const [langMenuId, setLangMenuId] = useState<string | null>(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<'none' | 'room'>('none');
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [showPinnedBanner, setShowPinnedBanner] = useState(false);
  const [mobileActionMenuId, setMobileActionMenuId] = useState<string | null>(null);
  
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/chat/stickers')
      .then(res => res.json())
      .then(data => setStickers(data))
      .catch(err => console.error("Could not load stickers", err));
  }, []);

  useEffect(() => {
    if (p.activeRoom?.pinnedMessages?.length > 0) {
      const dismissed = sessionStorage.getItem(`dismissed_pin_${p.activeRoom?.id}`);
      if (!dismissed) {
        setShowPinnedBanner(true);
      } else {
        setShowPinnedBanner(false);
      }
    } else {
      setShowPinnedBanner(false);
    }
  }, [p.activeRoom?.id, p.activeRoom?.pinnedMessages?.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
        setShowStickerPicker(false);
        setShowMentionMenu(false);
      }
      const target = event.target as HTMLElement;
      if (!target.closest('.lang-menu-container')) {
        setLangMenuId(null);
      }
      if (!target.closest('.header-menu-container')) {
        setShowHeaderMenu(false);
      }
      if (!target.closest('.mobile-action-menu')) {
        setMobileActionMenuId(null);
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

  const renderMessageText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(@[a-zA-Z0-9_\u0600-\u06FF]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} className="text-blue-400 font-bold bg-blue-400/10 px-1 rounded">{part}</span>;
      }
      const linkParts = renderTextWithLinks(part);
      return linkParts.map((p: any, j: number) => 
        p.type === 'link' 
          ? <a key={`${i}-${j}`} href={p.content} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-300 underline break-all">{p.content}</a>
          : <span key={`${i}-${j}`}>{p.content}</span>
      );
    });
  };

  const renderActionButtons = (msg: any, isMe: boolean, isMobile: boolean = false) => {
    const isRoomAdmin = p.activeRoom?.admins?.includes(p.user.uid) || p.activeRoom?.createdBy === p.user.uid;
    const isRoomMod = p.activeRoom?.moderators?.includes(p.user.uid);
    const canDelete = isMe || isRoomAdmin || isRoomMod;
    const isMenuOpen = p.activeReactionMenu === msg.id;

    const baseClass = isMobile
      ? "w-full text-left px-4 py-2.5 text-sm text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] hover:bg-white/10 active:bg-white/20 flex items-center gap-3 transition-colors"
      : "bg-[#1e293b] border border-slate-600 hover:bg-slate-700 text-gray-300 rounded-full w-8 h-8 flex-shrink-0 flex items-center justify-center text-sm shadow-lg";

    const iconClass = isMobile ? "text-base" : "";

    return (
      <>
        <button type="button" onClick={(e) => { e.stopPropagation(); p.setReplyingTo(msg); setMobileActionMenuId(null); }} className={baseClass} title="Reply"><span className={iconClass}>↩️</span> {isMobile && "Reply"}</button>
        <button type="button" onClick={(e) => { e.stopPropagation(); p.onForward(msg.id); setMobileActionMenuId(null); }} className={baseClass} title="Forward"><span className={iconClass}>↪️</span> {isMobile && "Forward"}</button>
        <button type="button" onClick={(e) => { e.stopPropagation(); p.setActiveReactionMenu(isMenuOpen ? null : msg.id); setMobileActionMenuId(null); }} className={baseClass} title="React"><span className={iconClass}>😊</span> {isMobile && "React"}</button>
        
        {msg.type === 'text' && (
          <button type="button" onClick={(e) => { e.stopPropagation(); setLangMenuId(langMenuId === msg.id ? null : msg.id); setMobileActionMenuId(null); }} className={baseClass} title="Translate"><span className={iconClass}>🌍</span> {isMobile && "Translate"}</button>
        )}

        {(isMe || canDelete) && (
          <>
            {isMe && <button type="button" onClick={(e) => { e.stopPropagation(); p.handleEditMessage(msg.id, msg.text); setMobileActionMenuId(null); }} className={baseClass} title="Edit"><span className={iconClass}>✏️</span> {isMobile && "Edit"}</button>}
            <button type="button" onClick={(e) => { e.stopPropagation(); p.handleDeleteMessage(msg.id); setMobileActionMenuId(null); }} className={baseClass} title="Delete"><span className={iconClass}>🗑️</span> {isMobile && "Delete"}</button>
            {(isRoomAdmin || isRoomMod) && <button type="button" onClick={(e) => { e.stopPropagation(); p.activeRoom.pinnedMessages?.includes(msg.id) ? p.handleUnpinMessage(msg.id) : p.handlePinMessage(msg.id); setMobileActionMenuId(null); }} className={`${baseClass} ${p.activeRoom.pinnedMessages?.includes(msg.id) ? 'text-yellow-400 border-yellow-500' : ''}`} title="Pin"><span className={iconClass}>📌</span> {isMobile && "Pin"}</button>}
            
            <button type="button" onClick={(e) => { e.stopPropagation(); p.onSaveMessage(msg); setMobileActionMenuId(null); }} className={`${baseClass} ${p.savedCount >= p.maxSaved ? 'text-red-400 border-red-500' : 'text-yellow-400'}`} title="Save to Vault">
              <span className={iconClass}>{p.savedCount >= p.maxSaved ? '🔒' : '⭐'}</span> {isMobile && "Save"}
            </button>
          </>
        )}
      </>
    );
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#0b1120] h-full overflow-hidden relative">
      {/* Header */}
      <div className="h-16 border-b border-slate-800 flex items-center justify-between px-4 md:px-6 bg-[#0f172a] sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => p.setIsMobileSidebarOpen(true)} className="md:hidden text-gray-400 hover:text-white text-2xl p-1">☰</button>
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
          {p.activeRoom.type === "group" && (
            <button onClick={() => p.setShowRightSidebar(!p.showRightSidebar)} className={`border w-10 h-10 rounded-lg flex items-center justify-center text-xl transition ${p.showRightSidebar ? 'bg-teal-600 border-teal-500 text-white' : 'bg-[#1e293b] hover:bg-slate-700 border-slate-700 text-gray-300'}`} title="Toggle Members List">👥</button>
          )}

          <div className="relative header-menu-container">
            <button onClick={() => { setShowHeaderMenu(!showHeaderMenu); setActiveSubmenu('none'); }} className="bg-[#1e293b] hover:bg-slate-700 border border-slate-700 text-white w-10 h-10 rounded-lg flex items-center justify-center text-xl">⋮</button>
            
            {showHeaderMenu && (
              <div className="absolute right-0 top-12 bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl w-56 py-2 flex flex-col z-[100] max-h-[80vh] overflow-y-auto">
                
                {activeSubmenu === 'none' && (
                  <>
                    <button onClick={() => { p.setIsSearchExpanded(!p.isSearchExpanded); if (p.isSearchExpanded) { p.setMessageSearchTerm(""); p.setMessageSearchDate(""); } setShowHeaderMenu(false); }} className="text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white flex justify-between">🔍 Search Messages</button>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowHeaderMenu(false); setTimeout(() => p.onOpenSettings(), 50); }} className="text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white flex justify-between">⚙️ Privacy Settings</button>
                    
                    <button onClick={() => { setShowHeaderMenu(false); }} className="text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white flex justify-between items-center">
                      <span>⭐ My Vault</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${p.savedCount >= p.maxSaved ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-teal-400'}`}>
                        {p.savedCount} / {p.maxSaved}
                      </span>
                    </button>

                    <button onClick={() => { p.onVideo(); setShowHeaderMenu(false); }} className="text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white flex justify-between">📹 Video Call</button>
                    
                    <div className="border-t border-slate-700 my-1"></div>

                    {p.activeRoom.type === "group" && (
                      <button onClick={() => setActiveSubmenu('room')} className="text-left px-4 py-2 text-sm text-teal-300 hover:bg-slate-700 hover:text-white flex justify-between items-center">
                        <span>👥 Room Settings</span>
                        <span>▶</span>
                      </button>
                    )}

                    {p.activeRoom.type === "direct" && p.dmPartnerUid && (
                      <>
                        <div className="border-t border-slate-700 my-1"></div>
                        <button onClick={() => { p.handleBlockUser(p.dmPartnerUid!, p.getDMName(p.activeRoom)); setShowHeaderMenu(false); }} className="text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 hover:text-white">{p.isDMPartnerBlocked ? '🚫 Unblock' : '🚫 Block'}</button>
                        <button onClick={() => { p.handleReportUser(p.dmPartnerUid!, p.getDMName(p.activeRoom)); setShowHeaderMenu(false); }} className="text-left px-4 py-2 text-sm text-amber-400 hover:bg-slate-700 hover:text-white">⚠️ Report</button>
                      </>
                    )}
                  </>
                )}

                {activeSubmenu === 'room' && (
                  <>
                    <button onClick={() => setActiveSubmenu('none')} className="text-left px-4 py-2 text-xs text-gray-400 hover:text-white font-bold flex items-center gap-2 border-b border-slate-700 mb-1">
                      <span>◀</span> Back to Menu
                    </button>
                    <button onClick={() => { p.onOpenTheme(); setShowHeaderMenu(false); }} className="text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white">🎨 Decorate Room</button>
                    <button onClick={() => { p.setShowAddMemberModal(true); setShowHeaderMenu(false); }} className="text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white">➕ Add Member</button>
                    <button onClick={() => { p.handleCopyInviteLink(); setShowHeaderMenu(false); }} className="text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white">🔗 Invite Link</button>
                    <button onClick={() => { p.openMembersModal(); setShowHeaderMenu(false); }} className="text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white">👑 Manage Roles</button>
                    
                    {p.activeRoom.createdBy === p.user.uid && (
                      <>
                        <div className="border-t border-slate-700 my-1"></div>
                        <button onClick={() => { 
                          const newRule = p.activeRoom.permissions?.whoCanPost === "moderators" ? "everyone" : "moderators";
                          p.onUpdateRoomSettings({ permissions: { ...p.activeRoom.permissions, whoCanPost: newRule } }); 
                          setShowHeaderMenu(false); 
                        }} className="text-left px-4 py-2 text-sm text-yellow-300 hover:bg-slate-700 hover:text-white">
                          {p.activeRoom.permissions?.whoCanPost === "moderators" ? '🔓 Unlock Chat (Everyone)' : '🔒 Lock Chat (Mods Only)'}
                        </button>

                        <button onClick={() => { 
                          const newTimer = p.activeRoom.disappearingTimer === 86400 ? 0 : 86400;
                          p.onUpdateRoomSettings({ disappearingTimer: newTimer }); 
                          setShowHeaderMenu(false); 
                        }} className="text-left px-4 py-2 text-sm text-orange-300 hover:bg-slate-700 hover:text-white">
                          {p.activeRoom.disappearingTimer ? '⏳ Disappearing: ON (24h)' : '⏳ Disappearing: OFF'}
                        </button>
                      </>
                    )}
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
      {p.activeRoom.pinnedMessages && p.activeRoom.pinnedMessages.length > 0 && showPinnedBanner && (
        <div className="bg-teal-900/30 border-b border-teal-500/50 p-2 px-4 flex justify-between items-center relative z-20">
          <div className="flex items-center gap-2 text-teal-300 text-sm font-medium cursor-pointer flex-1" onClick={() => { p.setShowPinnedModal(true); setShowPinnedBanner(false); if (p.activeRoom?.id) sessionStorage.setItem(`dismissed_pin_${p.activeRoom.id}`, 'true'); }}>
            <span>📌</span>
            <span>{p.activeRoom.pinnedMessages.length} Pinned Message(s)</span>
            <span className="text-xs text-teal-400 underline ml-2">Click to view</span>
          </div>
          <button onClick={() => { setShowPinnedBanner(false); if (p.activeRoom?.id) sessionStorage.setItem(`dismissed_pin_${p.activeRoom.id}`, 'true'); }} className="text-teal-400 hover:text-white px-2 font-bold text-lg" title="Dismiss">×</button>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 min-h-0 p-4 md:p-6 overflow-y-auto overflow-x-hidden flex flex-col gap-4 relative" style={{ backgroundColor: (p.activeRoom.type === "direct" ? p.userDoc?.dmThemes?.[p.activeRoom.id]?.bgColor : p.activeRoom.customization?.bgColor) || '#0b1120', backgroundImage: (p.activeRoom.type === "direct" ? p.userDoc?.dmThemes?.[p.activeRoom.id]?.bgImage : p.activeRoom.customization?.bgImage) ? `url(${p.activeRoom.type === "direct" ? p.userDoc?.dmThemes?.[p.activeRoom.id]?.bgImage : p.activeRoom.customization?.bgImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {((p.activeRoom.type === "direct" && p.userDoc?.dmThemes?.[p.activeRoom.id]?.bgImage) || (p.activeRoom.type === "group" && p.activeRoom.customization?.bgImage)) && (<div className="absolute inset-0 bg-black/60 pointer-events-none"></div>)}
        {((p.activeRoom.type === "direct" && p.userDoc?.dmThemes?.[p.activeRoom.id]?.poemText) || (p.activeRoom.type === "group" && p.activeRoom.customization?.poemText)) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 select-none overflow-hidden">
            <p className="text-4xl md:text-6xl font-serif text-white text-center max-w-2xl leading-relaxed" style={{ transform: 'rotate(-15deg)' }}>{p.activeRoom.type === "direct" ? p.userDoc?.dmThemes?.[p.activeRoom.id]?.poemText : p.activeRoom.customization?.poemText}</p>
          </div>
        )}

        <div className="relative z-10 flex flex-col gap-4 w-full h-full pb-4">
          {p.filteredMessages.length === 0 && (<div className="text-center text-gray-500 mt-10">No messages yet. Say Azul to {p.activeRoom.type === "direct" ? p.getDMName(p.activeRoom) : `Thajmaath n ${p.activeRoom.name}`}!</div>)}
          
          {p.filteredMessages.map((msg, index) => {
            if (p.userDoc?.blockedUsers?.includes(msg.senderId)) return <div key={msg.id || index} className="text-center text-xs text-gray-600 my-2">Message from a blocked user</div>;
            const isMe = msg.senderId === p.user.uid;
            const isSelected = selectedMsgId === msg.id;
            const selectable = msg.type === 'text' && (msg.text || '').trim().length > 0;
            const bubbleClass = "px-4 py-3 rounded-2xl max-w-[300px] md:max-w-md break-words transition-all relative " + (isMe ? 'bg-teal-600 text-white rounded-tr-sm' : 'bg-[#1e293b] text-gray-200 rounded-tl-sm') + (isSelected ? ' ring-2 ring-emerald-400' : '') + (selectable ? ' cursor-pointer' : '');
            const ytId = msg.type === 'text' ? getYouTubeID(msg.text) : null;
            const isMenuOpen = p.activeReactionMenu === msg.id;

            return (
              <div key={msg.id || index} className={`relative w-full flex flex-col group my-2 ${isMe ? 'items-end' : 'items-start'}`}>
                
                {/* SENDER NAME + MOBILE 3-DOTS */}
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-xs text-gray-400 font-medium">
                    {isMe ? "You" : (
                      <button onClick={() => p.onOpenUserAction(msg.senderId, msg.senderName)} className="hover:text-teal-400 hover:underline transition-colors" title="View Profile">
                        {msg.senderName}
                      </button>
                    )}
                  </span>
                  {msg.senderIsPremium && <span title="Premium Member" className="text-[10px]">👑</span>}
                  {msg.senderIsDonator && <span title="Supporter" className="text-[10px]">❤️</span>}
                  
                  <div className="md:hidden relative mobile-action-menu">
                    <button 
                      onClick={() => setMobileActionMenuId(mobileActionMenuId === msg.id ? null : msg.id)} 
                      className="text-gray-400 hover:text-white w-6 h-6 flex items-center justify-center text-base"
                      aria-label="Message actions"
                    >
                      ⋮
                    </button>
                    {mobileActionMenuId === msg.id && (
                      <div className={`absolute top-7 ${isMe ? 'right-0' : 'left-0'} z-[100] w-52 bg-[#0f172a]/15 border border-white/30 rounded-xl shadow-2xl py-1 flex flex-col max-h-[50vh] overflow-y-auto`}>
                        {renderActionButtons(msg, isMe, true)}
                      </div>
                    )}
                  </div>
                </div>

                {/* MESSAGE BUBBLE ROW */}
                <div className={`flex items-center w-full relative ${isMe ? 'justify-end' : 'justify-start'}`}>
                  
                  {/* DESKTOP ACTIONS */}
                  <div className={`hidden md:flex absolute top-1/2 -translate-y-1/2 flex-col gap-1 transition-opacity duration-200 z-30 ${isMe ? 'left-0' : 'right-0'} opacity-0 group-hover:opacity-100`}>
                    {renderActionButtons(msg, isMe, false)}
                  </div>

                  {/* BUBBLE */}
                  <div className={bubbleClass} onClick={selectable ? () => setSelectedMsgId(isSelected ? null : msg.id) : undefined}>
                    {msg.replyTo && (
                      <div className="bg-black/20 border-l-4 border-teal-300 p-2 rounded mb-2 text-sm">
                        <button onClick={(e) => { e.stopPropagation(); if (msg.replyTo.senderId) p.onOpenUserAction(msg.replyTo.senderId, msg.replyTo.senderName); }} className="font-semibold text-teal-200 text-xs hover:underline hover:text-teal-400 transition-colors text-left">
                          {msg.replyTo.senderName}
                        </button>
                        <p className="text-gray-300 text-xs truncate max-w-[200px]">{msg.replyTo.text}</p>
                      </div>
                    )}
                    {msg.type === 'text' && (
                      <div className="flex flex-col gap-2">
                        <p className="break-words whitespace-pre-wrap">{renderMessageText(msg.text)}</p>
                        {translations[msg.id] && (<div className="mt-2 pt-2 border-t border-black/20 text-sm italic opacity-90">🌍 {translations[msg.id]}</div>)}
                        {ytId && (<div onClick={(e) => e.stopPropagation()}><iframe width="100%" height="200" src={`https://www.youtube.com/embed/${ytId}`} title="YouTube" frameBorder="0" allowFullScreen className="rounded-lg mt-2 max-w-sm bg-black"></iframe></div>)}
                      </div>
                    )}
                    {msg.type === 'image' && <img src={msg.fileUrl} alt="" className="max-w-full rounded-lg cursor-pointer" onClick={() => window.open(msg.fileUrl, '_blank')} />}
                    {msg.type === 'video' && <video controls className="max-w-full rounded-lg bg-black"><source src={msg.fileUrl} type="video/mp4" /></video>}
                    {msg.type === 'audio' && (<div className="flex flex-col gap-2"><audio controls className="max-w-[250px] h-10"><source src={msg.fileUrl} type="audio/webm" /></audio>{msg.text && (<p className="text-sm text-gray-200 italic border-l-2 border-teal-400 pl-2">"{msg.text}"</p>)}</div>)}
                    {msg.type === 'file' && <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-black/20 p-3 rounded-lg"><span className="text-2xl">📄</span><span className="text-sm font-semibold truncate max-w-[150px]">{msg.fileName}</span></a>}
                  </div>
                </div>

                {/* REACTIONS MENU */}
                {isMenuOpen && (
                  <div className={`absolute top-full mt-2 z-50 bg-[#1e293b] border border-teal-500 rounded-full px-2 py-1.5 flex gap-1 shadow-2xl ${isMe ? 'right-12' : 'left-12'}`}>
                    {REACTIONS.map(emoji => (
                      <button type="button" key={emoji} onClick={(e) => { e.stopPropagation(); p.handleReaction(msg.id, emoji, msg.reactions); }} className="hover:scale-125 text-2xl p-1">{emoji}</button>
                    ))}
                  </div>
                )}

                {/* REACTIONS DISPLAY */}
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

                {/* TIMESTAMP */}
                <span className={`text-[10px] text-gray-500 mt-1 px-1 flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
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
      <div className="flex-shrink-0 p-4 bg-[#0f172a] border-t border-slate-800 relative z-20" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        {selectedMsg && (
          <div className="bg-emerald-900/30 border border-emerald-500/50 rounded-lg p-2 mb-2 flex items-center gap-2">
            <span className="text-xs text-emerald-300 truncate flex-1">💾 Saving: “{(selectedMsg.text || '').slice(0, 60)}{(selectedMsg.text || '').length > 60 ? '…' : ''}”</span>
            <button type="button" onClick={async () => { const r = await p.onSaveToATK(selectedMsg); setSelectedMsgId(null); if (r.ok) alert("Saved to ATK ✨"); else alert(`Save failed: ${r.error || 'unknown error'}`); }} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium">Save to ATK</button>
            <button type="button" onClick={() => setSelectedMsgId(null)} className="text-gray-400 hover:text-white px-2" title="Cancel">✕</button>
          </div>
        )}
        {p.typingUsers.length > 0 && (<div className="text-xs text-teal-400 px-4 py-1 italic animate-pulse">{p.typingUsers.join(" and ")} {p.typingUsers.length === 1 ? 'is' : 'are'} typing...</div>)}
        {p.replyingTo && (
          <div className="bg-[#1e293b] border-l-4 border-teal-500 p-2 mb-2 rounded flex justify-between items-center">
            <div><p className="text-xs text-teal-400 font-bold">Replying to {p.replyingTo.senderName}</p><p className="text-sm text-gray-300 truncate max-w-[300px]">{p.replyingTo.text || "📎 Media"}</p></div>
            <button type="button" onClick={() => p.setReplyingTo(null)} className="text-gray-400 hover:text-white text-xl px-2">✕</button>
          </div>
        )}
        
        <form onSubmit={p.handleSendText} className="flex items-center gap-2 bg-[#1e293b] rounded-xl px-4 py-2">
          <input type="file" ref={p.fileInputRef} className="hidden" onChange={p.handleFileUpload} accept="image/*,video/*,.pdf,.doc,.docx" />
          <button type="button" onClick={() => p.fileInputRef.current?.click()} className="text-gray-400 hover:text-white p-2" title="File">📎</button>
          <button type="button" onClick={() => p.fileInputRef.current?.click()} className="text-gray-400 hover:text-white p-2" title="Media">🖼️</button>
          <button type="button" onClick={p.isRecording ? p.stopRecording : p.startRecording} className={`p-2 rounded-full ${p.isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400'}`}>{p.isRecording ? '⏹️' : '🎤'}</button>
          <input type="text" value={p.inputText} onChange={(e) => p.handleTyping(e.target.value)} onFocus={() => { setShowEmojiPicker(false); setShowStickerPicker(false); setShowMentionMenu(false); }} placeholder={p.isCheckingAI ? "AI Scanning..." : p.uploading ? "Uploading..." : p.isRecording ? "Recording..." : p.replyingTo ? `Reply to ${p.replyingTo.senderName}...` : `Message...`} disabled={p.uploading || p.isRecording || p.isCheckingAI || p.isDMPartnerBlocked} className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder-gray-500 px-2" />
          
          <div className="flex items-center relative" ref={pickerRef}>
            <button type="button" onClick={() => { setShowMentionMenu(!showMentionMenu); setShowEmojiPicker(false); setShowStickerPicker(false); }} className="text-gray-400 hover:text-white p-2 text-xl font-bold" title="Mention">@</button>
            <button type="button" onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowStickerPicker(false); setShowMentionMenu(false); }} className="text-gray-400 hover:text-white p-2 text-xl">😊</button>
            <button type="button" onClick={() => { setShowStickerPicker(!showStickerPicker); setShowEmojiPicker(false); setShowMentionMenu(false); }} className="text-gray-400 hover:text-white p-2 text-xl" title="Kabyle Stickers">🎨</button>
            
            {showMentionMenu && p.activeRoom && (
              <div className="absolute bottom-12 right-20 bg-[#1e293b] border border-slate-600 p-2 rounded-xl shadow-2xl w-48 max-h-60 overflow-y-auto z-50">
                <p className="text-xs text-gray-400 px-2 mb-2 uppercase font-bold">Mention Member</p>
                {(p.activeRoom.members || []).map((uid: string) => {
                  const name = p.activeRoom.memberNames?.[uid] || "User";
                  return (
                    <button key={uid} type="button" onClick={() => { p.setInputText(p.inputText + `@${name.split(' ')[0]} `); setShowMentionMenu(false); }} className="w-full text-left px-2 py-1.5 text-sm text-gray-200 hover:bg-teal-600 rounded">@{name}</button>
                  );
                })}
              </div>
            )}

            {showEmojiPicker && (
              <div className="absolute bottom-12 right-0 bg-[#1e293b] border border-slate-600 p-2 rounded-xl shadow-2xl grid grid-cols-6 gap-1 w-52 z-50">
                {["😀","😂","❤️","👍","🔥","😮","😢","🙏","🎉","💯","😍","😎","🥰","😡","🤔","👋","💪","✨","🥳","👏","🤣","😭","💔","🍀"].map(emoji => (<button key={emoji} type="button" onClick={() => { p.setInputText(p.inputText + emoji); setShowEmojiPicker(false); }} className="hover:scale-125 hover:bg-slate-700 rounded text-xl p-1 transition-transform">{emoji}</button>))}
              </div>
            )}

            {showStickerPicker && (
              <div className="absolute bottom-12 right-10 bg-[#1e293b] border border-slate-600 p-3 rounded-xl shadow-2xl w-80 h-96 overflow-y-auto z-50">
                {stickers.emotions.length > 0 && (<><h4 className="text-xs text-teal-400 font-bold uppercase mb-2">Émotions ({stickers.emotions.length})</h4><div className="grid grid-cols-4 gap-2 mb-4">{stickers.emotions.map(s => (<button key={s} type="button" onClick={() => { p.handleSendSticker(`/stickers/emotions/${s}`); setShowStickerPicker(false); }} className="hover:scale-110 transition-transform"><img src={`/stickers/emotions/${s}`} alt={s} className="w-12 h-12 rounded-lg object-cover bg-black/20" /></button>))}</div></>)}
                {stickers.identity.length > 0 && (<><h4 className="text-xs text-teal-400 font-bold uppercase mb-2">Identité & Fierté ({stickers.identity.length})</h4><div className="grid grid-cols-4 gap-2 mb-4">{stickers.identity.map(s => (<button key={s} type="button" onClick={() => { p.handleSendSticker(`/stickers/identity/${s}`); setShowStickerPicker(false); }} className="hover:scale-110 transition-transform"><img src={`/stickers/identity/${s}`} alt={s} className="w-12 h-12 rounded-lg object-cover bg-black/20" /></button>))}</div></>)}
                {stickers.emotions.length === 0 && stickers.identity.length === 0 && (<p className="text-center text-gray-500 text-sm mt-10">No stickers found. Drop images in the public folder!</p>)}
              </div>
            )}
          </div>

          <button type="submit" disabled={p.uploading || p.isRecording || p.isCheckingAI || !p.inputText.trim() || p.isDMPartnerBlocked} className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white p-2 rounded-lg">{p.isCheckingAI ? '⏳' : '➤'}</button>
        </form>
      </div>

      {p.activeRoom.type === "group" && !p.showRightSidebar && (
        <button onClick={() => p.setShowRightSidebar(true)} className="fixed right-4 bottom-24 z-[90] md:hidden bg-teal-600 hover:bg-teal-500 text-white w-12 h-12 rounded-full shadow-2xl flex items-center justify-center text-2xl border-2 border-slate-700" title="Show Members">👥</button>
      )}
    </div>
  );
}