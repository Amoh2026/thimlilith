// src/app/[locale]/(chat)/rooms/page.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { db, auth, storage } from '@/lib/firebase/client';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, setDoc, where, getDocs, getDoc, deleteDoc, updateDoc, or, and, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged, signOut, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { containsBannedWords } from '@/lib/moderation/filter';
import { saveToATK } from '@/lib/atk';

// Components
import PremiumModal, { type LimitType } from './components/PremiumModal';
import SettingsModal from './components/SettingsModal';
import ForwardModal from './components/ForwardModal';
import WelcomeModal from './components/WelcomeModal';
import VaultFullModal from './components/VaultFullModal';
import UserActionModal from './components/UserActionModal';
import { RightSidebar } from './components/RightSidebar';
import { LoginScreen, BannedScreen, MutedScreen, CharterScreen } from './components/GateScreens';
import { Sidebars } from './components/Sidebars';
import { ChatArea } from './components/ChatArea';
import { Modals } from './components/Modals';

export default function ThimlilithChatUI() {
  // ─── STATE ────────────────────────────────────────────────
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Auth form
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  // Chat
  const [sidebarTab, setSidebarTab] = useState<'rooms' | 'friends' | 'search'>('rooms');
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [newRoomName, setNewRoomName] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCheckingAI, setIsCheckingAI] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [activeReactionMenu, setActiveReactionMenu] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [messageSearchTerm, setMessageSearchTerm] = useState("");
  const [messageSearchDate, setMessageSearchDate] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Vault & Limits
  const [savedCount, setSavedCount] = useState(0);
  const [showVaultModal, setShowVaultModal] = useState(false);

  // Mobile Navigation
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Social
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [blockedUsersList, setBlockedUsersList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // User Action Menu
  const [actionUser, setActionUser] = useState<{ id: string; name: string } | null>(null);
  const [actionIsFriend, setActionIsFriend] = useState(false);

  // Modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<any>(null);
  const [reportReason, setReportReason] = useState("Spam");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberSearchResults, setMemberSearchResults] = useState<any[]>([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [roomMembersList, setRoomMembersList] = useState<any[]>([]);
  const [showPinnedModal, setShowPinnedModal] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  
  // Theme State
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [themeData, setThemeData] = useState<any>({ bgColor: "#0b1120", bgImage: "", poemText: "" });

  // Premium Modal State
  const [premiumModal, setPremiumModal] = useState<{ open: boolean; type: LimitType }>({ open: false, type: 'translate' });
  const [showSettings, setShowSettings] = useState(false);
  const [forwardMsgId, setForwardMsgId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const lastMessageTimeRef = useRef<number>(0);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── EFFECTS ───
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setLoading(false);
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        await setDoc(userRef, {
          uid: currentUser.uid,
          name: currentUser.displayName || currentUser.email?.split('@')[0],
          email: currentUser.email?.toLowerCase(),
          photoURL: currentUser.photoURL || null,
        }, { merge: true });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    if (!user || rooms.length === 0) return;
    let unreadCount = 0;
    rooms.forEach(room => {
      const lastRead = userDoc?.lastRead?.[room.id] || 0;
      const lastMsgTime = room.lastMessageAt?.toMillis() || 0;
      if (room.lastMessageSenderId !== user.uid && lastMsgTime > lastRead) unreadCount++;
    });

    if (unreadCount > 0) {
      document.title = `(${unreadCount}) New Message${unreadCount > 1 ? 's' : ''} | Thimlilith`;
    } else {
      document.title = 'Thimlilith';
    }

    if (unreadCount > 0 && document.visibilityState === 'hidden') {
      const lastNotified = sessionStorage.getItem('lastNotifiedCount');
      if (lastNotified !== unreadCount.toString()) {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Thimlilith 💬', {
            body: `You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''}!`,
            icon: '/favicon.ico'
          });
          sessionStorage.setItem('lastNotifiedCount', unreadCount.toString());
        }
      }
    } else {
      sessionStorage.removeItem('lastNotifiedCount');
    }
  }, [rooms, userDoc?.lastRead, user]);

  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const setOnline = async () => { await updateDoc(userRef, { isOnline: true, lastSeen: serverTimestamp() }).catch(() => {}); };
    const setOffline = async () => { await updateDoc(userRef, { isOnline: false, lastSeen: serverTimestamp() }).catch(() => {}); };
    setOnline();
    const handleVis = () => document.visibilityState === "visible" ? setOnline() : setOffline();
    document.addEventListener("visibilitychange", handleVis);
    window.addEventListener("beforeunload", setOffline);
    return () => {
      document.removeEventListener("visibilitychange", handleVis);
      window.removeEventListener("beforeunload", setOffline);
      setOffline();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) { setUserDoc(snap.data()); setLoading(false); }
    });
    return () => unsub();
  }, [user]);

  // ⭐ SAVED VAULT LISTENER
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "savedMessages"));
    const unsub = onSnapshot(q, (snap) => {
      setSavedCount(snap.docs.length);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!userDoc?.blockedUsers || userDoc.blockedUsers.length === 0) { setBlockedUsersList([]); return; }
    const fetchBlocked = async () => {
      const users: any[] = [];
      for (const uid of userDoc.blockedUsers) {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) users.push({ id: snap.id, ...snap.data() });
      }
      setBlockedUsersList(users);
    };
    fetchBlocked();
  }, [userDoc?.blockedUsers]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      const timer = setTimeout(() => {
        window.location.href = '/en/rooms';
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "rooms"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRooms(list);
      if (list.length > 0 && !activeRoom) {
        const savedRoomId = sessionStorage.getItem('activeRoomId');
        if (savedRoomId) {
          const targetRoom = list.find(r => r.id === savedRoomId);
          if (targetRoom) {
            handleSelectRoom(targetRoom);
            sessionStorage.removeItem('activeRoomId');
            return;
          }
        }
        handleSelectRoom(list[0]);
      }
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (activeRoom && rooms.length > 0) {
      const updated = rooms.find(r => r.id === activeRoom.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(activeRoom)) setActiveRoom(updated);
    }
  }, [rooms, activeRoom]);

  useEffect(() => {
    if (!user) return;
    const qReq = query(collection(db, "friend_requests"), where("receiverId", "==", user.uid), where("status", "==", "pending"));
    const unsubReq = onSnapshot(qReq, (snap) => setFriendRequests(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const qFri = query(collection(db, "friend_requests"), and(where("status", "==", "accepted"), or(where("senderId", "==", user.uid), where("receiverId", "==", user.uid))));
    const unsubFri = onSnapshot(qFri, (snap) => setFriendsList(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubReq(); unsubFri(); };
  }, [user]);

  useEffect(() => {
    if (!user || !activeRoom) return;
    setMessages([]);
    const q = query(collection(db, "rooms", activeRoom.id, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [user, activeRoom?.id]);

  useEffect(() => {
    if (!user || !activeRoom || messages.length === 0) return;
    const markRead = async () => {
      for (const msg of messages) {
        if (msg.senderId !== user.uid && (!msg.readBy || !msg.readBy.includes(user.uid))) {
          try { await updateDoc(doc(db, "rooms", activeRoom.id, "messages", msg.id), { readBy: arrayUnion(user.uid) }); } catch {}
        }
      }
    };
    markRead();
  }, [messages, user, activeRoom]);

  useEffect(() => {
    if (!user || !activeRoom) return;
    const q = query(collection(db, "rooms", activeRoom.id, "typing"));
    const unsub = onSnapshot(q, (snap) => {
      const now = Date.now();
      const names = snap.docs.map(d => d.data()).filter(d => d.uid !== user.uid && d.updatedAt && now - d.updatedAt < 4000).map(d => d.name);
      setTypingUsers([...new Set(names)]);
    });
    return () => unsub();
  }, [user, activeRoom?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── HANDLERS ───
  const handleSelectRoom = async (room: any) => {
    setActiveRoom(room);
    setReplyingTo(null); setIsSearchExpanded(false); setMessageSearchTerm(""); setMessageSearchDate("");
    if (user) { try { await updateDoc(doc(db, "users", user.uid), { [`lastRead.${room.id}`]: Date.now() }); } catch {} }
  };

  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = searchQuery.trim().toLowerCase();
    if (!t) return;
    setIsSearching(true); setSearchResults([]);
    try {
      const usersRef = collection(db, "users");
      const snap = await getDocs(usersRef);
      
      const results = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((u: any) => {
          if (u.id === user?.uid) return false;
          if (u.privacySearch === "private") return false;
          const hasName = u.name && u.name.toLowerCase().includes(t);
          const hasEmail = u.email && u.email.toLowerCase().includes(t);
          return hasName || hasEmail;
        });
      setSearchResults(results);
    } catch (err: any) { alert(`Search failed: ${err.message}`); }
    setIsSearching(false);
  };

  const handleSearchMembersToAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = memberSearchQuery.trim().toLowerCase();
    if (!t) return;
    setIsSearchingMembers(true); setMemberSearchResults([]);
    try {
      const q = query(collection(db, "users"), where("name", ">=", t), where("name", "<=", t + '\uf8ff'));
      const snap = await getDocs(q);
      const results = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter((u: any) => u.id !== user?.uid && !activeRoom?.members?.includes(u.id));
      setMemberSearchResults(results);
    } catch (err: any) { alert(`Search failed: ${err.message}`); }
    setIsSearchingMembers(false);
  };

  const addMemberToRoom = async (target: any) => {
    if (!activeRoom || !user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/chat/rooms/${activeRoom.id}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: target.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add member');
      alert(`${data.name || target.name} added!`);
      setMemberSearchResults(prev => prev.filter(u => u.id !== target.id));
    } catch (err: any) { alert(`Failed: ${err.message}`); }
  };

  const handleSendFriendRequest = async (target: any) => {
    if (!user) return;
    try {
      const q1 = query(collection(db, "friend_requests"), where("senderId", "==", user.uid), where("receiverId", "==", target.id));
      const q2 = query(collection(db, "friend_requests"), where("senderId", "==", target.id), where("receiverId", "==", user.uid));
      if (!(await getDocs(q1)).empty || !(await getDocs(q2)).empty) { alert("Request already exists."); return; }
      await addDoc(collection(db, "friend_requests"), { senderId: user.uid, senderName: user.displayName || user.email?.split('@')[0], receiverId: target.id, receiverName: target.name, status: "pending", createdAt: serverTimestamp() });
      setSearchQuery(""); setSearchResults([]);
      alert("Friend request sent!");
    } catch { alert("Failed to send request."); }
  };

  const handleAcceptRequest = async (id: string) => { try { await updateDoc(doc(db, "friend_requests", id), { status: "accepted" }); } catch {} };
  const handleRejectRequest = async (id: string) => { try { await deleteDoc(doc(db, "friend_requests", id)); } catch {} };

  const handleOpenUserAction = async (uid: string, name: string) => {
    if (!user) return;
    setActionUser({ id: uid, name });
    const q = query(
      collection(db, "friend_requests"),
      and(where("status", "==", "accepted"), or(
        and(where("senderId", "==", user.uid), where("receiverId", "==", uid)),
        and(where("senderId", "==", uid), where("receiverId", "==", user.uid))
      ))
    );
    const snap = await getDocs(q);
    setActionIsFriend(!snap.empty);
  };

  const handleActionSendDM = async () => {
    if (!actionUser || !user) return;
    setActionUser(null);
    await handleStartDM({ id: actionUser.id, name: actionUser.name });
  };

  const handleActionAddFriend = async () => {
    if (!actionUser || !user) return;
    setActionUser(null);
    await handleSendFriendRequest({ id: actionUser.id, name: actionUser.name });
  };

  const handleActionBlock = async () => {
    if (!actionUser || !user) return;
    const target = actionUser;
    setActionUser(null);
    await handleBlockUser(target.id, target.name);
  };

  const handleActionReport = async () => {
    if (!actionUser || !user) return;
    const target = actionUser;
    setActionUser(null);
    handleReportUser(target.id, target.name);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || !user) return;
    try {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const ref = await addDoc(collection(db, "rooms"), {
        name: newRoomName, createdBy: user.uid, createdAt: serverTimestamp(),
        members: [user.uid], type: "group", admins: [user.uid], moderators: [], pinnedMessages: [], inviteCode,
        permissions: { whoCanPost: "everyone" }
      });
      setActiveRoom({ id: ref.id, name: newRoomName, createdBy: user.uid, type: "group", admins: [user.uid], moderators: [], pinnedMessages: [], inviteCode, permissions: { whoCanPost: "everyone" } });
      setNewRoomName(""); setIsCreatingRoom(false);
    } catch { alert("Failed to create room."); }
  };

  const handleStartDM = async (other: any) => {
    if (!user) return;
    const sorted = [user.uid, other.id].sort();
    const dmId = `dm_${sorted[0]}_${sorted[1]}`;
    const ref = doc(db, "rooms", dmId);
    const myName = user.displayName || user.email || "Me";
    const theirName = other.name || "User";
    try {
      const snap = await getDoc(ref);
      await setDoc(ref, { type: "direct", members: [user.uid, other.id], memberNames: { [user.uid]: myName, [other.id]: theirName }, createdAt: snap.exists() ? snap.data().createdAt : serverTimestamp(), createdBy: user.uid, name: "Direct Message" }, { merge: true });
      setSearchQuery(""); setSearchResults([]);
      handleSelectRoom({ id: dmId, type: "direct", members: [user.uid, other.id], memberNames: { [user.uid]: myName, [other.id]: theirName }, name: "Direct Message", otherUser: other });
      setSidebarTab('rooms');
    } catch { alert("Failed to start DM."); }
  };

  const openMembersModal = async () => {
    if (!activeRoom) return;
    setShowMembersModal(true);
    const members: any[] = [];
    for (const uid of activeRoom.members || []) {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) members.push({ id: snap.id, ...snap.data() });
    }
    setRoomMembersList(members);
  };

  const handlePromote = async (uid: string, name?: string) => { 
    if (!activeRoom) return;
    if (!confirm(`Are you sure you want to promote ${name || 'this user'} to Moderator?`)) return;
    await updateDoc(doc(db, "rooms", activeRoom.id), { moderators: arrayUnion(uid) }); 
  };
  const handleDemote = async (uid: string, name?: string) => { 
    if (!activeRoom) return;
    if (!confirm(`Are you sure you want to demote ${name || 'this user'}?`)) return;
    await updateDoc(doc(db, "rooms", activeRoom.id), { moderators: arrayRemove(uid) }); 
  };

  const handleSaveTheme = async () => {
    if (!activeRoom || !user) return;
    try {
      if (activeRoom.type === "group") {
        if (activeRoom.createdBy !== user.uid) { alert("Only the room creator can change the group decoration."); return; }
        await updateDoc(doc(db, "rooms", activeRoom.id), { customization: themeData });
      } else {
        await updateDoc(doc(db, "users", user.uid), { [`dmThemes.${activeRoom.id}`]: themeData });
      }
      setShowThemeModal(false);
    } catch (err) { alert("Failed to save theme."); }
  };
  
  const handleKickMember = async (targetUid: string, targetName: string) => {
    if (!activeRoom || !user) return;
    if (!confirm(`Kick ${targetName} from this room?`)) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/chat/rooms/${activeRoom.id}/kick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: targetUid }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error || 'Failed to kick');
    } catch (e: any) { alert(e.message || 'Failed to kick'); }
  };

  const handlePinMessage = async (id: string) => { if (activeRoom) await updateDoc(doc(db, "rooms", activeRoom.id), { pinnedMessages: arrayUnion(id) }); };
  const handleUnpinMessage = async (id: string) => { if (activeRoom) await updateDoc(doc(db, "rooms", activeRoom.id), { pinnedMessages: arrayRemove(id) }); };

  const handleCopyInviteLink = () => {
    if (!activeRoom?.inviteCode) { alert("This room doesn't have an invite code. Create a new room!"); return; }
    const url = `${window.location.origin}/en/join/${activeRoom.inviteCode}`;
    navigator.clipboard.writeText(url);
    alert(`Invite link copied!\n\n${url}`);
  };

  const handleBlockUser = async (uid: string, name: string) => {
    if (!user || !userDoc) return;
    const isBlocked = userDoc.blockedUsers?.includes(uid);
    try {
      if (isBlocked) { await updateDoc(doc(db, "users", user.uid), { blockedUsers: arrayRemove(uid) }); alert(`${name} unblocked.`); }
      else if (confirm(`Block ${name}?`)) { await updateDoc(doc(db, "users", user.uid), { blockedUsers: arrayUnion(uid) }); alert(`${name} blocked.`); setActiveRoom(null); }
    } catch { alert("Failed."); }
  };

  const handleReportUser = (uid: string, name: string) => { setReportTarget({ uid, name }); setReportReason("Spam"); setShowReportModal(true); };

  const submitReport = async () => {
    if (!user || !reportTarget) return;
    try {
      await addDoc(collection(db, "reports"), { reporterId: user.uid, reporterName: user.displayName || user.email, reportedId: reportTarget.uid, reportedName: reportTarget.name, roomId: activeRoom?.id || "unknown", reason: reportReason, createdAt: serverTimestamp(), status: "pending" });
      alert("Reported."); setShowReportModal(false);
    } catch (err: any) { alert(`Failed: ${err.message}`); }
  };

  const handleReaction = async (msgId: string, emoji: string, current: any) => {
    if (!user) return;
    const ref = doc(db, "rooms", activeRoom.id, "messages", msgId);
    const reacted = (current?.[emoji] || []).includes(user.uid);
    await updateDoc(ref, { [`reactions.${emoji}`]: reacted ? arrayRemove(user.uid) : arrayUnion(user.uid) });
    setActiveReactionMenu(null);
  };

  const handleEditMessage = async (id: string, old: string) => {
    const nv = prompt("Edit message:", old);
    if (!nv || nv.trim() === "" || nv === old) return;
    await updateDoc(doc(db, "rooms", activeRoom.id, "messages", id), { text: nv, editedAt: serverTimestamp() });
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    await deleteDoc(doc(db, "rooms", activeRoom.id, "messages", id));
  };

  const handleAcceptCharter = async () => { if (user) await updateDoc(doc(db, "users", user.uid), { charterAccepted: true, charterAcceptedAt: serverTimestamp() }); };

  const addStrike = async (reason: string) => {
    if (!user || !userDoc) return;
    const strikes = [...(userDoc.strikes || []), { reason, date: new Date().toISOString(), by: "system" }];
    const n = strikes.length;
    let status = "active", mutedUntil: string | null = null;
    if (n === 1) alert(`⚠️ Warning: ${reason}`);
    else if (n === 2) { status = "muted"; mutedUntil = new Date(Date.now() + 3600000).toISOString(); alert(`🔇 Muted: ${reason}`); }
    else { status = "banned"; alert(`🚫 Banned: ${reason}`); signOut(auth); }
    await updateDoc(doc(db, "users", user.uid), { strikes, status, mutedUntil });
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    try {
      if (isLogin) await signInWithEmailAndPassword(auth, email, password);
      else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(res.user, { displayName: name || email.split('@')[0] });
        setUser({ ...res.user, displayName: name || email.split('@')[0] });
      }
    } catch (err: any) { setError(err.message.replace("Firebase: ", "")); }
  };

  const handleGoogleLogin = async () => { try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (err: any) { setError(err.message); } };
  const handleLogout = () => signOut(auth);

  const sendMessageToFirestore = async (data: any) => {
    if (!user || !activeRoom) return;
    const reply = replyingTo ? { id: replyingTo.id, text: replyingTo.text || "📎", senderName: replyingTo.senderName, senderId: replyingTo.senderId } : null;
    
    let expiresAt = null;
    if (activeRoom.disappearingTimer && activeRoom.disappearingTimer > 0) {
      expiresAt = Date.now() + (activeRoom.disappearingTimer * 1000);
    }

    await addDoc(collection(db, "rooms", activeRoom.id, "messages"), { 
      senderId: user.uid, 
      senderName: user.displayName || user.email?.split('@')[0] || "Anon", 
      senderIsPremium: userDoc?.isPremium || false,
      senderIsDonator: userDoc?.isDonator || false,
      createdAt: serverTimestamp(), 
      replyTo: reply, 
      readBy: [], 
      expiresAt: expiresAt,
      ...data 
    });
    try { await updateDoc(doc(db, "rooms", activeRoom.id), { lastMessageAt: serverTimestamp(), lastMessageText: data.text || "📎", lastMessageSenderId: user.uid }); } catch {}
    setReplyingTo(null);
  };

  const handleTyping = async (text: string) => {
    setInputText(text);
    if (!user || !activeRoom) return;
    const ref = doc(db, "rooms", activeRoom.id, "typing", user.uid);
    if (text.trim() === "") { await deleteDoc(ref).catch(() => {}); return; }
    if (typingTimeoutRef.current) return;
    try {
      await setDoc(ref, { uid: user.uid, name: user.displayName || user.email?.split('@')[0] || "Someone", updatedAt: Date.now() });
      typingTimeoutRef.current = setTimeout(() => { typingTimeoutRef.current = null; }, 2000);
    } catch {}
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !activeRoom) return;
    
    const isRoomAdmin = activeRoom?.admins?.includes(user.uid) || activeRoom?.createdBy === user.uid;
    const isRoomMod = activeRoom?.moderators?.includes(user.uid);
    if (activeRoom?.permissions?.whoCanPost === "moderators" && !isRoomAdmin && !isRoomMod) {
      alert("Only moderators can post in this room.");
      return;
    }

    if (containsBannedWords(inputText)) { addStrike("Use of prohibited language"); setInputText(""); return; }
    const now = Date.now();
    if (now - lastMessageTimeRef.current < 3000) { addStrike("Spamming"); return; }
    setIsCheckingAI(true);
    try {
      const res = await fetch('/api/moderation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: inputText }) });
      const data = await res.json();
      if (data.flagged) { addStrike("AI detected toxic language"); setInputText(""); setIsCheckingAI(false); return; }
    } catch {}
    setIsCheckingAI(false);
    lastMessageTimeRef.current = now;
    await deleteDoc(doc(db, "rooms", activeRoom.id, "typing", user.uid)).catch(() => {});
    await sendMessageToFirestore({ type: 'text', text: inputText });
    setInputText("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !activeRoom) return;
    setUploading(true);
    try {
      const sref = ref(storage, `chat_uploads/${Date.now()}_${file.name}`);
      await uploadBytes(sref, file);
      const url = await getDownloadURL(sref);
      const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file';
      await sendMessageToFirestore({ type, fileUrl: url, fileName: file.name, text: "" });
    } catch { alert("Upload failed."); }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      
      mr.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setUploading(true);
        try {
          const sref = ref(storage, `chat_uploads/audio_${Date.now()}.webm`);
          await uploadBytes(sref, blob);
          const url = await getDownloadURL(sref);

          let transcript = "";
          try {
            const formData = new FormData();
            formData.append("file", blob, "voice.webm");
            const token = await user!.getIdToken();
            const transRes = await fetch('/api/transcribe', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
            if (transRes.status === 403) {
              setPremiumModal({ open: true, type: 'transcribe' });
            } else {
              const transData = await transRes.json();
              if (transData.text) transcript = transData.text;
            }
          } catch (err) { console.error("Transcription failed", err); }

          await sendMessageToFirestore({ type: 'audio', fileUrl: url, text: transcript || "" });

          if (transcript && transcript.trim().length > 3) {
            await saveToATK({
              text: transcript,
              uid: user!.uid,
              messageId: "voice_note", 
              roomId: activeRoom!.id,
              roomName: activeRoom!.name,
              senderName: user!.displayName || user!.email?.split('@')[0],
              source: "thimlilith_voice",
            }).catch(console.error);
          }
        } catch (err) { alert("Failed to process audio."); }
        setUploading(false);
      };
      mr.start(); setIsRecording(true);
    } catch { alert("Mic denied."); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
    }
  };

  // ─── HELPERS ───
  const getDMName = (room: any) => {
    if (room.otherUser) return room.otherUser.name || "Direct Message";
    if (room.type === "direct" && room.memberNames && room.members) {
      const other = room.members.find((uid: string) => uid !== user?.uid);
      if (other && room.memberNames[other]) return room.memberNames[other];
    }
    return "Direct Message";
  };

  const dmPartnerUid = activeRoom?.type === "direct" ? activeRoom.members?.find((uid: string) => uid !== user?.uid) : null;
  const isDMPartnerBlocked = dmPartnerUid && userDoc?.blockedUsers?.includes(dmPartnerUid);

  const filteredMessages = messages.filter(msg => {
    let match = true;
    if (messageSearchTerm.trim()) {
      const t = messageSearchTerm.toLowerCase();
      match = (msg.text && msg.text.toLowerCase().includes(t)) || (msg.senderName && msg.senderName.toLowerCase().includes(t));
    }
    if (match && messageSearchDate && msg.createdAt) {
      const d = msg.createdAt.toDate();
      match = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` === messageSearchDate;
    }
    return match;
  });

  const handleSendSticker = async (stickerUrl: string) => {
    if (!user || !activeRoom) return;
    await sendMessageToFirestore({ type: 'image', fileUrl: stickerUrl, text: "" });
  };

  const handleSaveToATK = async (msg: any) => {
    if (!user || !activeRoom) return { ok: false as const, error: "Not ready" };
    if (msg.type !== 'text' || !msg.text) return { ok: false as const, error: "Only text messages can be saved" };
    return saveToATK({
      text: msg.text,
      uid: user.uid,
      messageId: msg.id,
      roomId: activeRoom.id,
      roomName: activeRoom.name,
      senderName: msg.senderName,
    });
  };

  useEffect(() => {
    if (userDoc && !userDoc.hasSeenWelcome) setShowWelcome(true);
  }, [userDoc]);

  const handleExecuteForward = async (targetRoomId: string) => {
    if (!forwardMsgId || !activeRoom || !user) return;
    const msgToForward = messages.find(m => m.id === forwardMsgId);
    setForwardMsgId(null);
    if (!msgToForward) return;

    try {
      const newMsgRef = collection(db, "rooms", targetRoomId, "messages");
      await addDoc(newMsgRef, {
        senderId: user.uid,
        senderName: user.displayName || user.email?.split('@')[0] || "Anon",
        senderIsPremium: userDoc?.isPremium || false,
        senderIsDonator: userDoc?.isDonator || false,
        text: msgToForward.text || "",
        type: msgToForward.type || "text",
        fileUrl: msgToForward.fileUrl || null,
        fileName: msgToForward.fileName || null,
        createdAt: serverTimestamp(),
        readBy: [],
        isForwarded: true
      });

      await updateDoc(doc(db, "rooms", targetRoomId), {
        lastMessageAt: serverTimestamp(),
        lastMessageText: msgToForward.text || "📎 Media",
        lastMessageSenderId: user.uid
      });

      alert("Message forwarded successfully! ✨");
    } catch (err: any) { alert(`Failed to forward: ${err.message}`); }
  };

  const handleSaveSettings = async (data: any) => {
    if (!user) return;
    try { await updateDoc(doc(db, "users", user.uid), data); }
    catch (err) { alert("Failed to save settings."); }
  };

  const handleSaveMessage = async (msg: any) => {
    if (!user || !activeRoom) return;
    const maxAllowed = userDoc?.isPremium ? 10 : 6;
    
    if (savedCount >= maxAllowed) {
      setShowVaultModal(true);
      return;
    }

    try {
      const vaultRef = doc(db, "users", user.uid, "savedMessages", msg.id);
      await setDoc(vaultRef, {
        originalMsgId: msg.id,
        originalRoomId: activeRoom.id,
        roomName: activeRoom.name || "Direct Message",
        senderId: msg.senderId,
        senderName: msg.senderName,
        text: msg.text || "",
        type: msg.type || "text",
        fileUrl: msg.fileUrl || null,
        fileName: msg.fileName || null,
        savedAt: serverTimestamp(),
        savedBy: user.uid
      });
      alert("⭐ Message saved to your Vault!");
    } catch (err: any) { alert("Failed to save message: " + err.message); }
  };

  const handleUpdateRoomSettings = async (data: any) => {
    if (!activeRoom || !user) return;
    try {
      await updateDoc(doc(db, "rooms", activeRoom.id), data);
      setActiveRoom({ ...activeRoom, ...data });
    } catch (err) { alert("Failed to update room settings."); }
  };

  const handleWelcomeDismiss = async () => {
    setShowWelcome(false);
    if (user) {
      try { await updateDoc(doc(db, 'users', user.uid), { hasSeenWelcome: true }); } catch (err) {}
    }
  };

  const handleTranslate = async (msg: any, targetLang: string) => {
    if (!msg.text) return null;
    try {
      const token = await user!.getIdToken();
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ text: msg.text, targetLang })
      });
      if (res.status === 403) { setPremiumModal({ open: true, type: 'translate' }); return null; }
      const data = await res.json();
      if (!res.ok) { alert(`API Error: ${data.error}`); return null; }
      return data.translation || null;
    } catch (err: any) { alert(`Fetch Error: ${err.message}`); return null; }
  };

  // ─── RENDER ───
  if (loading) return <div className="flex h-screen items-center justify-center bg-[#0f172a] text-white">Loading...</div>;
  if (!user) return <LoginScreen isLogin={isLogin} setIsLogin={setIsLogin} email={email} setEmail={setEmail} password={password} setPassword={setPassword} name={name} setName={setName} error={error} setError={setError} onSubmit={handleEmailAuth} onGoogle={handleGoogleLogin} />;
  if (userDoc?.status === "banned") return <BannedScreen onLogout={handleLogout} />;
  if (userDoc?.status === "muted") return <MutedScreen mutedUntil={userDoc.mutedUntil} onLogout={handleLogout} />;
  if (!userDoc?.charterAccepted) return <CharterScreen onAccept={handleAcceptCharter} onLogout={handleLogout} />;

  return (
   <div className="flex h-full w-full bg-[#0f172a] text-gray-300 font-sans overflow-hidden">
      <WelcomeModal open={showWelcome} onClose={handleWelcomeDismiss} />
      <PremiumModal open={premiumModal.open} type={premiumModal.type} onClose={() => setPremiumModal({ ...premiumModal, open: false })} />
      
      <Sidebars
        user={user} userDoc={userDoc} rooms={rooms} activeRoom={activeRoom}
        sidebarTab={sidebarTab} setSidebarTab={setSidebarTab}
        friendRequests={friendRequests} friendsList={friendsList} blockedUsersList={blockedUsersList}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery} searchResults={searchResults} isSearching={isSearching}
        newRoomName={newRoomName} setNewRoomName={setNewRoomName} isCreatingRoom={isCreatingRoom} setIsCreatingRoom={setIsCreatingRoom}
        getDMName={getDMName} handleSelectRoom={handleSelectRoom} handleCreateRoom={handleCreateRoom}
        handleSearchUsers={handleSearchUsers} handleSendFriendRequest={handleSendFriendRequest}
        handleAcceptRequest={handleAcceptRequest} handleRejectRequest={handleRejectRequest}
        handleStartDM={handleStartDM} handleBlockUser={handleBlockUser} handleLogout={handleLogout}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
      />
      
      <ChatArea
        user={user} userDoc={userDoc} activeRoom={activeRoom} filteredMessages={filteredMessages}
        inputText={inputText} setInputText={setInputText}
        uploading={uploading} isRecording={isRecording} isCheckingAI={isCheckingAI}
        replyingTo={replyingTo} setReplyingTo={setReplyingTo}
        activeReactionMenu={activeReactionMenu} setActiveReactionMenu={setActiveReactionMenu}
        typingUsers={typingUsers}
        messageSearchTerm={messageSearchTerm} setMessageSearchTerm={setMessageSearchTerm}
        messageSearchDate={messageSearchDate} setMessageSearchDate={setMessageSearchDate}
        isSearchExpanded={isSearchExpanded} setIsSearchExpanded={setIsSearchExpanded}
        messagesEndRef={messagesEndRef} fileInputRef={fileInputRef}
        isDMPartnerBlocked={isDMPartnerBlocked} dmPartnerUid={dmPartnerUid} getDMName={getDMName}
        handleSendText={handleSendText} handleEditMessage={handleEditMessage} handleDeleteMessage={handleDeleteMessage}
        handleReaction={handleReaction} handlePinMessage={handlePinMessage} handleUnpinMessage={handleUnpinMessage}
        handleBlockUser={handleBlockUser} handleReportUser={handleReportUser} handleCopyInviteLink={handleCopyInviteLink}
        handleTyping={handleTyping} handleFileUpload={handleFileUpload}
        startRecording={startRecording} stopRecording={stopRecording}
        setShowAddMemberModal={setShowAddMemberModal} setShowPinnedModal={setShowPinnedModal}
        openMembersModal={openMembersModal}
        showRightSidebar={showRightSidebar}
        setShowRightSidebar={setShowRightSidebar}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        onVideo={async () => {
          try {
            if (!user) return;
            const token = await user.getIdToken();
            const res = await fetch('/api/chat/livekit-token', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ roomName: activeRoom.id, participantName: user.displayName || 'Guest' }) });
            const data = await res.json();
            if (data.token) { sessionStorage.setItem('lk_token', data.token); window.location.href = `/room/${activeRoom.id}`; }
          } catch {}
        }}
        onSaveToATK={handleSaveToATK}
        onOpenSettings={() => setShowSettings(true)}
        onForward={(msgId) => setForwardMsgId(msgId)}
        onUpdateRoomSettings={handleUpdateRoomSettings}
        onOpenUserAction={handleOpenUserAction}
        onSaveMessage={handleSaveMessage}
        savedCount={savedCount}
        maxSaved={userDoc?.isPremium ? 10 : 6}
        handleSendSticker={handleSendSticker} 
        onTranslate={handleTranslate}
        onOpenTheme={() => {
          if (activeRoom.type === "direct") {
            const myDMTheme = userDoc?.dmThemes?.[activeRoom.id];
            setThemeData(myDMTheme || { bgColor: "#0b1120", bgImage: "", poemText: "" });
          } else {
            setThemeData(activeRoom.customization || { bgColor: "#0b1120", bgImage: "", poemText: "" });
          }
          setShowThemeModal(true);
        }}
      />
      
      {showRightSidebar && activeRoom && activeRoom.type !== "direct" && (
        <RightSidebar
          activeRoom={activeRoom}
          user={user}
          userDoc={userDoc}
          showRightSidebar={showRightSidebar}
          onKick={handleKickMember}
          onPromote={handlePromote}
          onDemote={handleDemote}
          onClose={() => setShowRightSidebar(false)}
          onOpenUserAction={handleOpenUserAction} // 👈 THIS LINE MUST BE HERE
        />
      )}

      <Modals
        user={user} activeRoom={activeRoom} messages={messages}
        showReportModal={showReportModal} setShowReportModal={setShowReportModal}
        reportTarget={reportTarget} reportReason={reportReason} setReportReason={setReportReason} submitReport={submitReport}
        showAddMemberModal={showAddMemberModal} setShowAddMemberModal={setShowAddMemberModal}
        memberSearchQuery={memberSearchQuery} setMemberSearchQuery={setMemberSearchQuery}
        memberSearchResults={memberSearchResults} isSearchingMembers={isSearchingMembers}
        handleSearchMembersToAdd={handleSearchMembersToAdd} addMemberToRoom={addMemberToRoom}
        showMembersModal={showMembersModal} setShowMembersModal={setShowMembersModal}
        roomMembersList={roomMembersList} handlePromote={handlePromote} handleDemote={handleDemote}
        showPinnedModal={showPinnedModal} setShowPinnedModal={setShowPinnedModal} handleUnpinMessage={handleUnpinMessage}
        showThemeModal={showThemeModal} setShowThemeModal={setShowThemeModal}
        themeData={themeData} setThemeData={setThemeData} handleSaveTheme={handleSaveTheme}
      />
      
      <ForwardModal isOpen={!!forwardMsgId} onClose={() => setForwardMsgId(null)} rooms={rooms} getDMName={getDMName} onForward={handleExecuteForward} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} userDoc={userDoc} onSave={handleSaveSettings} />
      
      <VaultFullModal isOpen={showVaultModal} onClose={() => setShowVaultModal(false)} isPremium={userDoc?.isPremium || false} />
      
    <UserActionModal 
        isOpen={!!actionUser} 
        onClose={() => setActionUser(null)} 
        targetUser={actionUser} 
        isFriend={actionIsFriend} 
        isSelf={actionUser?.id === user?.uid} 
        onSendDM={handleActionSendDM} 
        onAddFriend={handleActionAddFriend} 
        onBlock={handleActionBlock} 
        onReport={handleActionReport} 
      />
    </div>
  );
}