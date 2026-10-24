"use client";

import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import { db, auth, storage } from '@/lib/firebase/client';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, setDoc, where, getDocs, getDoc, deleteDoc, updateDoc, or, and, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  onAuthStateChanged, signOut, User, signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup
} from 'firebase/auth';

const getYouTubeID = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const renderTextWithLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) => {
    if (part.match(urlRegex)) {
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-300 underline hover:text-blue-200 break-all">{part}</a>;
    }
    return part;
  });
};

export default function ThimlilithChatUI() {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<any>(null); 
  const [loading, setLoading] = useState(true);

  const [sidebarTab, setSidebarTab] = useState<'rooms' | 'friends' | 'search'>('rooms');

  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [newRoomName, setNewRoomName] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [blockedUsersList, setBlockedUsersList] = useState<any[]>([]); // NEW

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
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

  // 2. User Doc Listener
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) setUserDoc(docSnap.data());
    });
    return () => unsub();
  }, [user]);

  // 2.5 Fetch Blocked Users Details
  useEffect(() => {
    if (!userDoc?.blockedUsers || userDoc.blockedUsers.length === 0) {
      setBlockedUsersList([]);
      return;
    }
    const fetchBlockedUsers = async () => {
      const users: any[] = [];
      for (const uid of userDoc.blockedUsers) {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) users.push({ id: snap.id, ...snap.data() });
      }
      setBlockedUsersList(users);
    };
    fetchBlockedUsers();
  }, [userDoc?.blockedUsers]);

  // 3. Fetch Rooms
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "rooms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRooms(roomsList);
      if (roomsList.length > 0 && !activeRoom) handleSelectRoom(roomsList[0]);
    });
    return () => unsubscribe();
  }, [user]); 

  // 4. Fetch Friends & Requests
  useEffect(() => {
    if (!user) return;
    const qRequests = query(collection(db, "friend_requests"), where("receiverId", "==", user.uid), where("status", "==", "pending"));
    const unsubReq = onSnapshot(qRequests, (snapshot) => {
      setFriendRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qFriends = query(
      collection(db, "friend_requests"), 
      and(
        where("status", "==", "accepted"), 
        or(where("senderId", "==", user.uid), where("receiverId", "==", user.uid))
      )
    );
    const unsubFriends = onSnapshot(qFriends, (snapshot) => {
      setFriendsList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubReq(); unsubFriends(); };
  }, [user]);

  // 5. Fetch Messages
  useEffect(() => {
    if (!user || !activeRoom) return;
    setMessages([]); 
    const q = query(collection(db, "rooms", activeRoom.id, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user, activeRoom?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- ACTIONS ---
  const handleSelectRoom = async (room: any) => {
    setActiveRoom(room);
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          [`lastRead.${room.id}`]: Date.now()
        });
      } catch (err) { console.error(err); }
    }
  };

  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryText = searchQuery.trim().toLowerCase();
    if (!queryText) return;
    setIsSearching(true); setSearchResults([]);
    try {
      const usersRef = collection(db, "users");
      let q;
      if (queryText.includes('@')) {
        q = query(usersRef, where("email", "==", queryText));
      } else {
        q = query(usersRef, where("name", ">=", queryText), where("name", "<=", queryText + '\uf8ff'));
      }
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(u => u.id !== user?.uid); 
      setSearchResults(results);
    } catch (err: any) { alert(`Search failed: ${err.message}`); }
    setIsSearching(false);
  };

  const handleSendFriendRequest = async (targetUser: any) => {
    if (!user) return;
    try {
      const q1 = query(collection(db, "friend_requests"), where("senderId", "==", user.uid), where("receiverId", "==", targetUser.id));
      const q2 = query(collection(db, "friend_requests"), where("senderId", "==", targetUser.id), where("receiverId", "==", user.uid));
      const snap1 = await getDocs(q1);
      const snap2 = await getDocs(q2);
      if (!snap1.empty || !snap2.empty) { alert("Request already exists."); return; }

      await addDoc(collection(db, "friend_requests"), {
        senderId: user.uid, senderName: user.displayName || user.email?.split('@')[0],
        receiverId: targetUser.id, receiverName: targetUser.name,
        status: "pending", createdAt: serverTimestamp()
      });
      setSearchQuery(""); setSearchResults([]);
      alert("Friend request sent!");
    } catch (err) { alert("Failed to send request."); }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try { await updateDoc(doc(db, "friend_requests", requestId), { status: "accepted" }); } catch (err) { alert("Failed to accept."); }
  };

  const handleRejectRequest = async (requestId: string) => {
    try { await deleteDoc(doc(db, "friend_requests", requestId)); } catch (err) { alert("Failed to reject."); }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || !user) return;
    try {
      const newRoomRef = await addDoc(collection(db, "rooms"), {
        name: newRoomName, createdBy: user.uid, createdAt: serverTimestamp(),
        members: [user.uid], type: "group"
      });
      setActiveRoom({ id: newRoomRef.id, name: newRoomName, createdBy: user.uid, type: "group" });
      setNewRoomName(""); setIsCreatingRoom(false);
    } catch (err) { alert("Failed to create room."); }
  };

  const handleStartDM = async (otherUser: any) => {
    if (!user) return;
    const sortedUids = [user.uid, otherUser.id].sort();
    const dmId = `dm_${sortedUids[0]}_${sortedUids[1]}`;
    const roomRef = doc(db, "rooms", dmId);
    const myName = user.displayName || user.email || "Me";
    const theirName = otherUser.name || otherUser.email || "User";

    try {
      const roomSnap = await getDoc(roomRef);
      await setDoc(roomRef, {
        type: "direct", members: [user.uid, otherUser.id],
        memberNames: { [user.uid]: myName, [otherUser.id]: theirName },
        createdAt: roomSnap.exists() ? roomSnap.data().createdAt : serverTimestamp(),
        createdBy: user.uid, name: "Direct Message" 
      }, { merge: true }); 

      setSearchQuery(""); setSearchResults([]);
      handleSelectRoom({ id: dmId, type: "direct", members: [user.uid, otherUser.id], memberNames: { [user.uid]: myName, [otherUser.id]: theirName }, name: "Direct Message", otherUser });
      setSidebarTab('rooms'); 
    } catch (err) { alert("Failed to start DM."); }
  };

  const handleAddMember = async () => {
    if (!activeRoom || activeRoom.type !== "group") return;
    const emailToAdd = prompt("Enter the email of the person you want to add:");
    if (!emailToAdd) return;

    try {
      const q = query(collection(db, "users"), where("email", "==", emailToAdd.toLowerCase().trim()));
      const snap = await getDocs(q);
      if (snap.empty) { alert("User not found."); return; }
      
      const newMember = snap.docs[0].data();
      const newMemberId = snap.docs[0].id;

      await updateDoc(doc(db, "rooms", activeRoom.id), {
        members: arrayUnion(newMemberId),
        [`memberNames.${newMemberId}`]: newMember.name || newMember.email
      });
      alert(`${newMember.name || newMember.email} added to the group!`);
    } catch (err) { alert("Failed to add member."); }
  };

  // BLOCK / UNBLOCK LOGIC
  const handleBlockUser = async (targetUid: string, targetName: string) => {
    if (!user || !userDoc) return;
    const isBlocked = userDoc.blockedUsers?.includes(targetUid);

    try {
      if (isBlocked) {
        await updateDoc(doc(db, "users", user.uid), { blockedUsers: arrayRemove(targetUid) });
        alert(`${targetName} has been unblocked.`);
      } else {
        if (confirm(`Are you sure you want to block ${targetName}?`)) {
          await updateDoc(doc(db, "users", user.uid), { blockedUsers: arrayUnion(targetUid) });
          alert(`${targetName} has been blocked.`);
          setActiveRoom(null); // Close the chat
        }
      }
    } catch (err) { alert("Failed to update block status."); }
  };

  const handleReportUser = async (targetUid: string, targetName: string) => {
    if (!user) return;
    const reason = prompt(`Why are you reporting ${targetName}? (e.g., Spam, Harassment, Inappropriate content)`);
    if (!reason) return;

    try {
      await addDoc(collection(db, "reports"), {
        reporterId: user.uid, reporterName: user.displayName || user.email,
        reportedId: targetUid, reportedName: targetName,
        reason: reason, createdAt: serverTimestamp(), status: "pending"
      });
      alert("User reported. Our admins will review this.");
    } catch (err) { alert("Failed to send report."); }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(res.user, { displayName: name || email.split('@')[0] });
        setUser({ ...res.user, displayName: name || email.split('@')[0] });
      }
    } catch (err: any) { setError(err.message.replace("Firebase: ", "")); }
  };

  const handleGoogleLogin = async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (err: any) { setError(err.message); }
  };

  const handleLogout = () => signOut(auth);

  const sendMessageToFirestore = async (msgData: any) => {
    if (!user || !activeRoom) return;
    await addDoc(collection(db, "rooms", activeRoom.id, "messages"), {
      senderId: user.uid, senderName: user.displayName || user.email?.split('@')[0] || "Anonymous",
      createdAt: serverTimestamp(), ...msgData
    });

    try {
      await updateDoc(doc(db, "rooms", activeRoom.id), {
        lastMessageAt: serverTimestamp(), lastMessageText: msgData.text || "📎 Media", lastMessageSenderId: user.uid
      });
    } catch (error: any) { console.error("Failed to update room metadata:", error); }
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !activeRoom) return;
    await sendMessageToFirestore({ type: 'text', text: inputText });
    setInputText("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !activeRoom) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `chat_uploads/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      await sendMessageToFirestore({ type: isImage ? 'image' : isVideo ? 'video' : 'file', fileUrl: url, fileName: file.name, text: "" });
    } catch (error) { alert("Failed to upload file."); }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setUploading(true);
        try {
          const storageRef = ref(storage, `chat_uploads/audio_${Date.now()}.webm`);
          await uploadBytes(storageRef, audioBlob);
          const url = await getDownloadURL(storageRef);
          await sendMessageToFirestore({ type: 'audio', fileUrl: url, text: "" });
        } catch (error) { console.error(error); }
        setUploading(false);
      };
      mediaRecorder.start(); setIsRecording(true);
    } catch (err) { alert("Microphone denied."); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#0f172a] text-white">Loading...</div>;

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0f172a] text-white p-4">
        <div className="w-full max-w-md bg-[#1e293b] p-8 rounded-2xl shadow-xl border border-slate-700">
          <h1 className="text-3xl font-bold text-teal-400 mb-2 text-center">Thimlilith</h1>
          <p className="text-center text-gray-400 mb-8">ⵜⵉⵎⵍⵉⵍⵉⵜ - Join the Thajmaath</p>
          {error && <div className="bg-red-500/20 text-red-400 p-3 rounded mb-4 text-sm">{error}</div>}
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
            {!isLogin && <input type="text" placeholder="Display Name" value={name} onChange={e => setName(e.target.value)} className="bg-[#0f172a] border border-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-teal-500" required />}
            <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} className="bg-[#0f172a] border border-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-teal-500" required />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="bg-[#0f172a] border border-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-teal-500" required />
            <button type="submit" className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-lg mt-2">{isLogin ? "Login" : "Create Account"}</button>
          </form>
          <div className="flex items-center my-6"><div className="flex-1 border-t border-slate-700"></div><span className="px-4 text-sm text-gray-500">OR</span><div className="flex-1 border-t border-slate-700"></div></div>
          <button onClick={handleGoogleLogin} className="w-full bg-white text-gray-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2">Continue with Google</button>
          <p className="text-center text-sm text-gray-400 mt-6">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setIsLogin(!isLogin); setError(""); }} className="text-teal-400 hover:underline">{isLogin ? "Sign up" : "Log in"}</button>
          </p>
        </div>
      </div>
    );
  }

  const getDMName = (room: any) => {
    if (room.otherUser) return room.otherUser.name || room.otherUser.email || "Direct Message";
    if (room.type === "direct" && room.memberNames && room.members) {
      const otherMemberUid = room.members.find((uid: string) => uid !== user?.uid);
      if (otherMemberUid && room.memberNames[otherMemberUid]) return room.memberNames[otherMemberUid];
    }
    return "Direct Message"; 
  };

  const dmPartnerUid = activeRoom?.type === "direct" ? activeRoom.members?.find((uid: string) => uid !== user.uid) : null;
  const isDMPartnerBlocked = dmPartnerUid && userDoc?.blockedUsers?.includes(dmPartnerUid);

  return (
    <div className="flex h-screen bg-[#0f172a] text-gray-300 font-sans">
      {/* Far Left Sidebar */}
      <div className="w-16 flex flex-col items-center py-4 bg-[#0b1120] border-r border-slate-800">
        <div className="w-10 h-10 bg-teal-500 rounded-xl mb-8 flex items-center justify-center text-white font-bold">T</div>
        <div className="flex flex-col gap-6 text-slate-500">
          <button className="text-teal-400" title="Chat">💬</button>
          <Link href="/feed" className="hover:text-teal-400 text-xl" title="Home/Feed">🏠</Link>
          <button className="hover:text-teal-400" title="Groups">👥</button>
          <button className="hover:text-teal-400" title="Files">📁</button>
        </div>
        <div className="mt-auto flex flex-col items-center gap-4 pb-4">
           {user.photoURL ? <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border-2 border-teal-500" /> : <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-xs">{(user.displayName || user.email)?.[0].toUpperCase()}</div>}
           <button onClick={handleLogout} className="text-[10px] text-red-400 hover:text-red-300 font-medium">Logout</button>
        </div>
      </div>

      {/* Chat List Sidebar */}
      <div className="w-80 bg-[#0f172a] border-r border-slate-800 flex flex-col hidden md:flex">
        <div className="flex border-b border-slate-800 overflow-x-auto">
          <button onClick={() => setSidebarTab('rooms')} className={`flex-1 py-3 px-2 text-sm font-medium ${sidebarTab === 'rooms' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-gray-500 hover:text-gray-300'}`}>Thajmaathin</button>
          <button onClick={() => setSidebarTab('friends')} className={`flex-1 py-3 px-2 text-sm font-medium relative ${sidebarTab === 'friends' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-gray-500 hover:text-gray-300'}`}>
            Friends
            {friendRequests.length > 0 && <span className="absolute top-2 right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{friendRequests.length}</span>}
          </button>
          <button onClick={() => setSidebarTab('search')} className={`flex-1 py-3 px-2 text-sm font-medium ${sidebarTab === 'search' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-gray-500 hover:text-gray-300'}`}>Find Users</button>
        </div>

        {/* Tab Content: Rooms */}
        {sidebarTab === 'rooms' && (
          <>
            <div className="p-4 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Your Communities</h2>
              <button onClick={() => setIsCreatingRoom(!isCreatingRoom)} className="bg-teal-600 hover:bg-teal-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-lg transition">+</button>
            </div>
            
            {isCreatingRoom && (
              <form onSubmit={handleCreateRoom} className="p-3 bg-[#1e293b] border-y border-slate-700">
                <input type="text" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} placeholder="E.g. Paris, Algiers..." className="w-full bg-[#0f172a] text-sm text-white rounded-lg px-3 py-2 mb-2 focus:outline-none border border-slate-600" autoFocus />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-teal-600 text-white text-xs py-1.5 rounded">Create</button>
                  <button type="button" onClick={() => setIsCreatingRoom(false)} className="flex-1 bg-slate-600 text-white text-xs py-1.5 rounded">Cancel</button>
                </div>
              </form>
            )}

            <div className="flex-1 overflow-y-auto">
              {rooms
                .filter(room => room.type === "group" || room.members?.includes(user?.uid))
                .filter(room => {
                  if (room.type !== "direct") return true;
                  const partner = room.members?.find((uid: string) => uid !== user.uid);
                  return !userDoc?.blockedUsers?.includes(partner);
                })
                .map((room) => {
                const isDM = room.type === "direct";
                const displayName = isDM ? getDMName(room) : `Thajmaath n ${room.name}`;
                const lastReadTime = userDoc?.lastRead?.[room.id] || 0;
                const lastMessageTime = room.lastMessageAt?.toMillis() || 0;
                const isUnread = room.lastMessageSenderId !== user.uid && lastMessageTime > lastReadTime;

                return (
                  <div 
                    key={room.id} onClick={() => handleSelectRoom(room)}
                    className={`flex items-center gap-3 p-3 cursor-pointer transition ${activeRoom?.id === room.id ? 'bg-[#1e293b] border-l-4 border-teal-500' : 'hover:bg-[#1e293b]'}`}
                  >
                    <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-xl">{isDM ? '👤' : '👥'}</div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-center">
                        <span className={`font-medium text-sm capitalize truncate ${isUnread ? 'text-white font-bold' : 'text-gray-300'}`}>{displayName}</span>
                        {isUnread && <span className="w-2.5 h-2.5 bg-teal-500 rounded-full flex-shrink-0"></span>}
                      </div>
                      <p className={`text-xs truncate ${isUnread ? 'text-gray-200 font-medium' : 'text-gray-400'}`}>
                        {room.lastMessageText || (isDM ? 'Private conversation' : 'Click to join chat')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Tab Content: Friends & Blocked */}
        {sidebarTab === 'friends' && (
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
            {friendRequests.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Requests</h3>
                {friendRequests.map(req => (
                  <div key={req.id} className="bg-[#1e293b] border border-slate-700 p-3 rounded-lg mb-2">
                    <p className="text-sm text-white mb-2">{req.senderName} wants to be friends</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleAcceptRequest(req.id)} className="flex-1 bg-teal-600 text-white text-xs py-1.5 rounded hover:bg-teal-500">Accept</button>
                      <button onClick={() => handleRejectRequest(req.id)} className="flex-1 bg-slate-600 text-white text-xs py-1.5 rounded hover:bg-slate-500">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">My Friends</h3>
              {friendsList.length === 0 && <p className="text-gray-500 text-sm">You have no friends yet.</p>}
              {friendsList.map(friendship => {
                const friendId = friendship.senderId === user.uid ? friendship.receiverId : friendship.senderId;
                const friendName = friendship.senderId === user.uid ? friendship.receiverName : friendship.senderName;
                return (
                  <div key={friendship.id} className="flex items-center gap-3 p-3 bg-[#1e293b] rounded-lg border border-slate-700 mb-2">
                    <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold">{friendName?.[0].toUpperCase()}</div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="text-white font-medium text-sm truncate">{friendName}</h4>
                      <p className="text-xs text-teal-400">Friend</p>
                    </div>
                    <button onClick={() => handleStartDM({ id: friendId, name: friendName })} className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg text-xs font-medium">Chat</button>
                  </div>
                );
              })}
            </div>

            {/* BLOCKED USERS SECTION */}
            {blockedUsersList.length > 0 && (
              <div className="mt-4 border-t border-slate-800 pt-4">
                <h3 className="text-xs font-bold text-red-400 uppercase mb-2">Blocked Users</h3>
                {blockedUsersList.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-3 bg-[#1e293b] rounded-lg border border-slate-700 mb-2">
                    <div className="w-10 h-10 rounded-full bg-red-900 flex items-center justify-center text-white font-bold">{u.name?.[0].toUpperCase()}</div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="text-gray-400 font-medium text-sm truncate line-through">{u.name}</h4>
                    </div>
                    <button onClick={() => handleBlockUser(u.id, u.name)} className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg text-xs font-medium">Unblock</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Search Users */}
        {sidebarTab === 'search' && (
          <div className="flex flex-col h-full">
            <form onSubmit={handleSearchUsers} className="p-3 border-b border-slate-800">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by email or name..." className="w-full bg-[#1e293b] text-sm text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500" />
              <button type="submit" disabled={isSearching} className="w-full mt-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg">{isSearching ? 'Searching...' : 'Search'}</button>
            </form>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {searchResults.length === 0 && searchQuery && !isSearching && <p className="text-center text-gray-500 text-sm mt-4">No users found.</p>}
              {searchResults.map((u) => (
                <div key={u.id} className="flex flex-col p-3 bg-[#1e293b] rounded-lg border border-slate-700">
                  <div className="flex items-center gap-3 mb-2">
                    {u.photoURL ? <img src={u.photoURL} alt="User" className="w-10 h-10 rounded-full" /> : <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold">{u.name?.[0].toUpperCase()}</div>}
                    <div className="flex-1 overflow-hidden">
                      <h4 className="text-white font-medium text-sm truncate">{u.name}</h4>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleStartDM(u)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-1.5 rounded-lg text-xs font-medium">Message</button>
                    <button onClick={() => handleSendFriendRequest(u)} className="flex-1 bg-teal-600 hover:bg-teal-500 text-white py-1.5 rounded-lg text-xs font-medium">Add Friend</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#0b1120]">
        {activeRoom ? (
          <>
            <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-[#0f172a]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-xl">{activeRoom.type === "direct" ? '👤' : '👥'}</div>
                <div>
                  <h3 className={`text-white font-medium capitalize ${isDMPartnerBlocked ? 'line-through text-gray-500' : ''}`}>
                    {activeRoom.type === "direct" ? getDMName(activeRoom) : `Thajmaath n ${activeRoom.name}`}
                  </h3>
                  <p className={`text-xs ${isDMPartnerBlocked ? 'text-red-400' : 'text-teal-400'}`}>
                    {activeRoom.type === "direct" ? (isDMPartnerBlocked ? "Blocked User" : "Private Chat") : "Active community"}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                 {activeRoom.type === "group" && (
                   <button onClick={handleAddMember} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">➕ Add Member</button>
                 )}

                 {activeRoom.type === "direct" && dmPartnerUid && (
                   <>
                    <button 
                      onClick={() => handleBlockUser(dmPartnerUid, getDMName(activeRoom))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 ${isDMPartnerBlocked ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
                    >
                      {isDMPartnerBlocked ? '🚫 Unblock' : '🚫 Block'}
                    </button>
                    <button onClick={() => handleReportUser(dmPartnerUid, getDMName(activeRoom))} className="bg-slate-700 hover:bg-slate-600 text-gray-300 px-3 py-1.5 rounded-lg text-sm font-medium">⚠️ Report</button>
                   </>
                 )}

                 <button className="text-gray-400 hover:text-white px-3 py-1.5">📞</button>
                 <button 
                  onClick={async () => {
                    try {
                      if (!user) return;
                      const idToken = await user.getIdToken();
                      const res = await fetch('/api/chat/livekit-token', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` }, body: JSON.stringify({ roomName: activeRoom.id, participantName: user.displayName || 'Guest' }) });
                      const data = await res.json();
                      if (data.token) { sessionStorage.setItem('lk_token', data.token); window.location.href = `/room/${activeRoom.id}`; } else { alert('Failed to get video token.'); }
                    } catch (err) { console.error(err); }
                  }}
                  className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  📹 Video
                </button>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
              {messages.length === 0 && <div className="text-center text-gray-500 mt-10">No messages yet. Say Azul to {activeRoom.type === "direct" ? getDMName(activeRoom) : `Thajmaath n ${activeRoom.name}`}!</div>}
              
              {messages.map((msg, index) => {
                if (userDoc?.blockedUsers?.includes(msg.senderId)) {
                  return <div key={msg.id || index} className="text-center text-xs text-gray-600 my-2">Message from a blocked user</div>;
                }

                const isMe = msg.senderId === user.uid;
                const msgContainerClass = "flex flex-col max-w-[75%] " + (isMe ? 'self-end items-end' : 'items-start');
                const bubbleClass = "px-4 py-3 rounded-2xl " + (isMe ? 'bg-teal-600 text-white rounded-tr-sm' : 'bg-[#1e293b] text-gray-200 rounded-tl-sm');
                const ytId = msg.type === 'text' ? getYouTubeID(msg.text) : null;
                
                return (
                  <div key={msg.id || index} className={msgContainerClass}>
                    <div className="flex items-center gap-2 mb-1 px-1">
                      {!isMe && <span className="text-xs text-gray-400 font-medium">{msg.senderName}</span>}
                      {isMe && <span className="text-xs text-gray-400 font-medium">You</span>}
                    </div>
                    <div className={bubbleClass}>
                      {msg.type === 'text' && <div className="flex flex-col gap-2"><p className="break-words">{renderTextWithLinks(msg.text)}</p>{ytId && <iframe width="100%" height="200" src={`https://www.youtube.com/embed/${ytId}`} title="YouTube" frameBorder="0" allowFullScreen className="rounded-lg mt-2 max-w-sm bg-black"></iframe>}</div>}
                      {msg.type === 'image' && <img src={msg.fileUrl} alt="upload" className="max-w-xs rounded-lg cursor-pointer" onClick={() => window.open(msg.fileUrl, '_blank')} />}
                      {msg.type === 'video' && <video controls className="max-w-xs rounded-lg bg-black"><source src={msg.fileUrl} type="video/mp4" /></video>}
                      {msg.type === 'audio' && <audio controls className="max-w-[250px] h-10"><source src={msg.fileUrl} type="audio/webm" /></audio>}
                      {msg.type === 'file' && <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-black/20 p-3 rounded-lg hover:bg-black/30 transition"><span className="text-2xl">📄</span><div className="flex flex-col"><span className="text-sm font-semibold truncate max-w-[150px]">{msg.fileName}</span><span className="text-[10px] text-gray-300">Click to download</span></div></a>}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1 px-1">{msg.createdAt ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Sending...'}</span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-[#0f172a] border-t border-slate-800">
              <form onSubmit={handleSendText} className="flex items-center gap-2 bg-[#1e293b] rounded-xl px-4 py-2">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,video/*,.pdf,.doc,.docx" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-white p-2 transition" title="Upload File">📎</button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-white p-2 transition" title="Upload Media">🖼️</button>
                <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`p-2 rounded-full transition ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-white'}`}>{isRecording ? '⏹️' : '🎤'}</button>
                <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder={uploading ? "Uploading..." : isRecording ? "Recording..." : `Message ${activeRoom.type === "direct" ? getDMName(activeRoom) : `Thajmaath n ${activeRoom.name}`}...`} disabled={uploading || isRecording || isDMPartnerBlocked} className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder-gray-500 px-2" />
                <button type="button" className="text-gray-400 hover:text-white p-2">😊</button>
                <button type="submit" disabled={uploading || isRecording || !inputText.trim() || isDMPartnerBlocked} className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white p-2 rounded-lg">➤</button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">Select or create a Thajmaath to start chatting.</div>
        )}
      </div>
    </div>
  );
}