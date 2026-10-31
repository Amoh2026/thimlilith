'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase/client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function CreateRoomPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState<number>(5);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return alert("You must be logged in.");
    if (!name) return alert("Room name is required.");

    setLoading(true);

    try {
      // Save the room to Firestore
      const docRef = await addDoc(collection(db, 'rooms'), {
        name,
        description,
        ownerId: auth.currentUser.uid,
        members: [auth.currentUser.uid], // Creator is the first member
        isPaid,
        price: isPaid ? price : 0,
        createdAt: serverTimestamp(),
      });

      // Redirect to the newly created room!
      router.push(`/${locale}/rooms/${docRef.id}`);
      
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Failed to create room.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-200 pt-16 pb-24 px-4">
      <div className="max-w-lg mx-auto mt-8">
        <h1 className="text-2xl font-semibold mb-2 flex items-center gap-2">
          <span className="text-xl">🚪</span> Create a Room
        </h1>
        <p className="text-slate-400 text-sm mb-8">Host a Thajmaath (community space).</p>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Room Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kabyle Poetry Night"
              className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400" 
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Description</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this room about?"
              rows={3}
              className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400" 
            />
          </div>

          <div className="flex items-center gap-3 py-2">
            <input 
              type="checkbox" 
              id="paidToggle"
              checked={isPaid} 
              onChange={(e) => setIsPaid(e.target.checked)}
              className="w-5 h-5 accent-teal-400"
            />
            <label htmlFor="paidToggle" className="text-sm font-medium text-slate-200 cursor-pointer">
              Make this a Paid Room (Premium)
            </label>
          </div>

          {isPaid && (
            <div>
              <label className="block text-sm text-slate-400 mb-1">Monthly Price (€)</label>
              <input 
                type="number" 
                value={price} 
                onChange={(e) => setPrice(Number(e.target.value))}
                min={1}
                className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400" 
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-teal-400 text-[#0f172a] font-semibold py-3 rounded-xl active:scale-95 transition-transform disabled:opacity-50 mt-4"
          >
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </form>
      </div>
    </main>
  );
}