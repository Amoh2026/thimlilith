'use client';

import { useEffect, useState, useRef } from 'react';
import { db, auth } from '@/lib/firebase/client';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

interface Message {
  id: string;
  text: string;
  senderName: string;
  senderId: string;
}

export default function LiveRoomOverlay({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch real-time messages from Firestore
  useEffect(() => {
    if (!roomId) return;

    const q = query(
      collection(db, 'liveChats', roomId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          text: data.text,
          senderName: data.senderName || 'Anonymous',
          senderId: data.senderId,
        });
      });
      setMessages(msgs);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [roomId]);

  // 3. Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !roomId) return;

    try {
      const msgText = newMessage;
      setNewMessage(''); // clear immediately for UX

      await addDoc(collection(db, 'liveChats', roomId, 'messages'), {
        text: msgText,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Thimlilith User',
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending message: ", error);
      alert("Failed to send message.");
    }
  };

  // 4. Send Virtual Gift (Placeholder for Stripe logic)
  const sendGift = (giftName: string, emoji: string) => {
    if (!currentUser) return;
    // In the future, this will trigger a Stripe transaction first.
    addDoc(collection(db, 'liveChats', roomId, 'messages'), {
      text: `${emoji} sent a ${giftName}!`,
      senderId: currentUser.uid,
      senderName: currentUser.displayName || 'Thimlilith User',
      createdAt: serverTimestamp(),
      isGift: true,
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#1e293b]">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-[#0f172a]/50">
        <h2 className="text-teal-400 font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          Live Chat
        </h2>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-sm text-center mt-10">No messages yet. Say Azul!</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="text-sm">
              <span className={`font-bold ${msg.senderId === currentUser?.uid ? 'text-teal-400' : 'text-purple-400'}`}>
                {msg.senderName}:
              </span>{' '}
              <span className="text-gray-200">{msg.text}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Gifts Area */}
      <div className="p-2 border-t border-white/10 flex gap-2 justify-center bg-[#0f172a]/30">
        <button onClick={() => sendGift('Rose', '🌹')} className="text-2xl hover:scale-125 transition-transform" title="Send Rose">🌹</button>
        <button onClick={() => sendGift('Crown', '👑')} className="text-2xl hover:scale-125 transition-transform" title="Send Crown">👑</button>
        <button onClick={() => sendGift('Fire', '🔥')} className="text-2xl hover:scale-125 transition-transform" title="Send Fire">🔥</button>
        <button onClick={() => sendGift('Diamond', '💎')} className="text-2xl hover:scale-125 transition-transform" title="Send Diamond">💎</button>
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-[#0f172a] flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Say something..."
          className="flex-1 bg-[#1e293b] text-white border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-teal-400"
        />
        <button 
          type="submit" 
          className="bg-teal-500 hover:bg-teal-600 text-white w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
        >
          ⵙ
        </button>
      </form>
    </div>
  );
}