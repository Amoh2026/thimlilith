// src/app/[locale]/(chat)/rooms/components/Sidebars.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { User } from 'firebase/auth';

interface SidebarsProps {
  user: User;
  userDoc: any;
  rooms: any[];
  activeRoom: any;
  sidebarTab: 'rooms' | 'friends' | 'search';
  setSidebarTab: (v: 'rooms' | 'friends' | 'search') => void;
  friendRequests: any[];
  friendsList: any[];
  blockedUsersList: any[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  searchResults: any[];
  isSearching: boolean;
  newRoomName: string;
  setNewRoomName: (v: string) => void;
  isCreatingRoom: boolean;
  setIsCreatingRoom: (v: boolean) => void;
  getDMName: (room: any) => string;
  handleSelectRoom: (room: any) => void;
  handleCreateRoom: (e: React.FormEvent) => void;
  handleSearchUsers: (e: React.FormEvent) => void;
  handleSendFriendRequest: (u: any) => void;
  handleAcceptRequest: (id: string) => void;
  handleRejectRequest: (id: string) => void;
  handleStartDM: (u: any) => void;
  handleBlockUser: (uid: string, name: string) => void;
  handleLogout: () => void;
}

export function Sidebars(p: SidebarsProps) {
  
  // 💎 STRIPE CHECKOUT HANDLER
  const handleCheckout = async (type: 'premium' | 'donation', amount?: number) => {
    try {
      const token = await p.user.getIdToken();
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          type, 
          plan: type === 'premium' ? 'monthly' : undefined, 
          amount: amount 
        })
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || 'Failed to start checkout');
    } catch (err: any) {
      alert("Failed to connect to Stripe: " + err.message);
    }
  };

  return (
    <>
      {/* Far Left Sidebar */}
      <div className="w-16 flex flex-col items-center py-4 bg-[#0b1120] border-r border-slate-800">
        <div className="w-10 h-10 bg-teal-500 rounded-xl mb-8 flex items-center justify-center text-white font-bold">T</div>
        <div className="flex flex-col gap-6 text-slate-500">
          <button className="text-teal-400 text-xl" title="Chat">💬</button>
          <Link href="/feed" className="hover:text-teal-400 text-xl" title="Home">🏠</Link>
          <a href="https://apprendrethamazightkabyle.com" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 text-xl" title="Learn">📖</a>
          <button className="hover:text-teal-400 text-xl" title="Groups">👥</button>
          <button className="hover:text-teal-400 text-xl" title="Files">📁</button>
        </div>
        <div className="mt-auto flex flex-col items-center gap-4 pb-4">
          {p.user.photoURL
            ? <img src={p.user.photoURL} alt="User" className="w-8 h-8 rounded-full border-2 border-teal-500" />
            : <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-xs">{(p.user.displayName || p.user.email)?.[0].toUpperCase()}</div>}
          <button onClick={p.handleLogout} className="text-[10px] text-red-400 hover:text-red-300 font-medium">Logout</button>
        </div>
      </div>

      {/* Chat List Sidebar */}
      <div className="w-80 bg-[#0f172a] border-r border-slate-800 flex flex-col hidden md:flex">
        <div className="flex border-b border-slate-800">
          <button onClick={() => p.setSidebarTab('rooms')} className={`flex-1 py-3 px-2 text-sm font-medium ${p.sidebarTab === 'rooms' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-gray-500'}`}>Thajmaathin</button>
          <button onClick={() => p.setSidebarTab('friends')} className={`flex-1 py-3 px-2 text-sm font-medium relative ${p.sidebarTab === 'friends' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-gray-500'}`}>
            Friends
            {p.friendRequests.length > 0 && <span className="absolute top-2 right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{p.friendRequests.length}</span>}
          </button>
          <button onClick={() => p.setSidebarTab('search')} className={`flex-1 py-3 px-2 text-sm font-medium ${p.sidebarTab === 'search' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-gray-500'}`}>Find Users</button>
        </div>

        {p.sidebarTab === 'rooms' && (
          <>
            <div className="p-4 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Your Communities</h2>
              <button onClick={() => p.setIsCreatingRoom(!p.isCreatingRoom)} className="bg-teal-600 hover:bg-teal-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-lg">+</button>
            </div>
            {p.isCreatingRoom && (
              <form onSubmit={p.handleCreateRoom} className="p-3 bg-[#1e293b] border-y border-slate-700">
                <input type="text" value={p.newRoomName} onChange={(e) => p.setNewRoomName(e.target.value)} placeholder="E.g. Paris..." className="w-full bg-[#0f172a] text-sm text-white rounded-lg px-3 py-2 mb-2 border border-slate-600" autoFocus />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-teal-600 text-white text-xs py-1.5 rounded">Create</button>
                  <button type="button" onClick={() => p.setIsCreatingRoom(false)} className="flex-1 bg-slate-600 text-white text-xs py-1.5 rounded">Cancel</button>
                </div>
              </form>
            )}
            <div className="flex-1 overflow-y-auto">
              {p.rooms
                .filter(room => {
                  if (room.type === "direct") {
                    const isMember = room.members?.includes(p.user?.uid);
                    const partner = room.members?.find((uid: string) => uid !== p.user.uid);
                    const isBlocked = p.userDoc?.blockedUsers?.includes(partner);
                    return isMember && !isBlocked;
                  }
                  if (room.type === "group") {
                    return room.members?.includes(p.user?.uid);
                  }
                  return false;
                })
                .map(room => {
                  const isDM = room.type === "direct";
                  const displayName = isDM ? p.getDMName(room) : `Thajmaath n ${room.name}`;
                  const lastReadTime = p.userDoc?.lastRead?.[room.id] || 0;
                  const lastMessageTime = room.lastMessageAt?.toMillis() || 0;
                  const isUnread = room.lastMessageSenderId !== p.user.uid && lastMessageTime > lastReadTime;
                  return (
                    <div key={room.id} onClick={() => p.handleSelectRoom(room)} className={`flex items-center gap-3 p-3 cursor-pointer ${p.activeRoom?.id === room.id ? 'bg-[#1e293b] border-l-4 border-teal-500' : 'hover:bg-[#1e293b]'}`}>
                      <div className="relative">
                        <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-xl">{isDM ? '👤' : '👥'}</div>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center">
                          <span className={`font-medium text-sm capitalize truncate ${isUnread ? 'text-white font-bold' : 'text-gray-300'}`}>{displayName}</span>
                          {isUnread && <span className="w-2.5 h-2.5 bg-teal-500 rounded-full flex-shrink-0"></span>}
                        </div>
                        <p className="text-xs truncate text-gray-400">{room.lastMessageText || (isDM ? 'Private conversation' : 'Click to join chat')}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </>
        )}

        {p.sidebarTab === 'friends' && (
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
            {p.friendRequests.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Requests</h3>
                {p.friendRequests.map(req => (
                  <div key={req.id} className="bg-[#1e293b] border border-slate-700 p-3 rounded-lg mb-2">
                    <p className="text-sm text-white mb-2">{req.senderName} wants to be friends</p>
                    <div className="flex gap-2">
                      <button onClick={() => p.handleAcceptRequest(req.id)} className="flex-1 bg-teal-600 text-white text-xs py-1.5 rounded">Accept</button>
                      <button onClick={() => p.handleRejectRequest(req.id)} className="flex-1 bg-slate-600 text-white text-xs py-1.5 rounded">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">My Friends</h3>
              {p.friendsList.length === 0 && <p className="text-gray-500 text-sm">No friends yet.</p>}
              {p.friendsList.map(f => {
                const friendId = f.senderId === p.user.uid ? f.receiverId : f.senderId;
                const friendName = f.senderId === p.user.uid ? f.receiverName : f.senderName;
                return (
                  <div key={f.id} className="flex items-center gap-3 p-3 bg-[#1e293b] rounded-lg border border-slate-700 mb-2">
                    <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold">{friendName?.[0].toUpperCase()}</div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="text-white font-medium text-sm truncate">{friendName}</h4>
                      <p className="text-xs text-teal-400">Friend</p>
                    </div>
                    <button onClick={() => p.handleStartDM({ id: friendId, name: friendName })} className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg text-xs">Chat</button>
                  </div>
                );
              })}
            </div>
            {p.blockedUsersList.length > 0 && (
              <div className="mt-4 border-t border-slate-800 pt-4">
                <h3 className="text-xs font-bold text-red-400 uppercase mb-2">Blocked Users</h3>
                {p.blockedUsersList.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-3 bg-[#1e293b] rounded-lg border border-slate-700 mb-2">
                    <div className="w-10 h-10 rounded-full bg-red-900 flex items-center justify-center text-white font-bold">{u.name?.[0].toUpperCase()}</div>
                    <div className="flex-1 overflow-hidden"><h4 className="text-gray-400 font-medium text-sm truncate line-through">{u.name}</h4></div>
                    <button onClick={() => p.handleBlockUser(u.id, u.name)} className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg text-xs">Unblock</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {p.sidebarTab === 'search' && (
          <div className="flex flex-col h-full">
            <form onSubmit={p.handleSearchUsers} className="p-3 border-b border-slate-800">
              <input type="text" value={p.searchQuery} onChange={(e) => p.setSearchQuery(e.target.value)} placeholder="Search by name..." className="w-full bg-[#1e293b] text-sm text-white rounded-lg px-4 py-2 border border-slate-700" />
              <button type="submit" disabled={p.isSearching} className="w-full mt-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg">{p.isSearching ? 'Searching...' : 'Search'}</button>
            </form>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {p.searchResults.length === 0 && p.searchQuery && !p.isSearching && <p className="text-center text-gray-500 text-sm mt-4">No users found.</p>}
              {p.searchResults.map(u => (
                <div key={u.id} className="flex flex-col p-3 bg-[#1e293b] rounded-lg border border-slate-700">
                  <div className="flex items-center gap-3 mb-2">
                    {u.photoURL ? <img src={u.photoURL} alt="" className="w-10 h-10 rounded-full" /> : <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold">{u.name?.[0].toUpperCase()}</div>}
                    <div className="flex-1 overflow-hidden"><h4 className="text-white font-medium text-sm truncate">{u.name}</h4></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => p.handleStartDM(u)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-1.5 rounded-lg text-xs">Message</button>
                    <button onClick={() => p.handleSendFriendRequest(u)} className="flex-1 bg-teal-600 hover:bg-teal-500 text-white py-1.5 rounded-lg text-xs">Add Friend</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 👇 MONETIZATION, TIP JAR & AD SPACE SECTION 👇 */}
        <div className="mt-auto p-4 border-t border-slate-800 bg-[#0f172a]">
          
          {/* AD SPACE (Only shows for Free users) */}
          {!p.userDoc?.isPremium && (
            <div className="w-full h-20 bg-slate-800 border border-slate-700 rounded-lg mb-3 flex items-center justify-center text-[10px] text-gray-500 text-center">
              [ Google AdSense Space ]<br/>Hide with Premium 💎
            </div>
          )}

          {/* PREMIUM BUTTON */}
          {!p.userDoc?.isPremium ? (
            <button 
              onClick={() => handleCheckout('premium')}
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold py-2 rounded-lg mb-3 shadow-lg hover:scale-105 transition text-sm"
            >
              💎 Go Premium (€4.99/mo)
            </button>
          ) : (
            <div className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold py-2 rounded-lg mb-3 text-center shadow-lg text-sm">
              👑 Premium Member
            </div>
          )}

          {/* TIP JAR */}
            <div className="bg-[#1e293b] p-3 rounded-lg border border-slate-700 mb-2">
            
            {/* 👇 TEXT ON LEFT, IMAGE ON RIGHT */}
            <div className="flex items-center justify-between w-full mb-3 px-1">
              <p className="text-[11px] text-gray-400 leading-tight max-w-[150px]">
                Support the Kabyle language ❤️
              </p>
              <img 
                src="/stickers/identity/13_pottery.png" 
                alt="Kabyle Tip Jar" 
                className="w-12 h-12 object-contain drop-shadow-md hover:scale-110 transition-transform cursor-pointer"
              />
            </div>
            
            <div className="flex gap-1 justify-center mb-2 w-full">
              {[2, 5, 10].map(amt => (
                <button 
                  key={amt}
                  onClick={() => handleCheckout('donation', amt)}
                  className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1 rounded flex-1"
                >
                  €{amt}
                </button>
              ))}
            </div>
            
            <div className="flex gap-1 mt-1 w-full">
              <input 
                type="number" 
                id="custom-donation"
                placeholder="Custom €" 
                min="1"
                className="w-full bg-[#0f172a] text-white text-xs px-2 py-1 rounded border border-slate-600 focus:outline-none focus:border-teal-500"
              />
              <button 
                onClick={() => {
                  const input = document.getElementById('custom-donation') as HTMLInputElement;
                  const amt = Number(input.value);
                  if (amt >= 1) {
                     if (confirm(`Are you sure you want to donate €${amt}? Thank you! ❤️`)) {
                        handleCheckout('donation', amt);
                     }
                  } else {
                    alert("Please enter an amount of €1 or more.");
                  }
                }}
                className="bg-teal-600 hover:bg-teal-500 text-white text-xs px-3 py-1 rounded font-bold"
              >
                Tip
              </button>
            </div>
          </div>

        </div>
        {/* 👆 END OF MONETIZATION SECTION 👆 */}

      </div>
    </>
  );
}