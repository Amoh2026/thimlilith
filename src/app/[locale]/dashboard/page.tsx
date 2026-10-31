"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, auth } from '@/lib/firebase/client';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function CreatorDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setRooms([]);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Fetch only rooms created by this user
    const q = query(collection(db, "rooms"), where("createdBy", "==", user.uid));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const roomsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          memberCount: (data.members || []).length 
        };
      });
      
      // Sort by most members
      roomsData.sort((a, b) => b.memberCount - a.memberCount);
      setRooms(roomsData);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  if (loading) {
    return <div className="p-10 text-white bg-[#0f172a] h-screen flex items-center justify-center">Loading Dashboard...</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#0f172a] text-white">
        <h1 className="text-2xl font-bold text-red-400 mb-4">Please log in</h1>
        <Link href="/rooms" className="bg-teal-600 px-6 py-2 rounded-lg hover:bg-teal-500">Go to Chat</Link>
      </div>
    );
  }

  // Calculate aggregate stats
  const totalRooms = rooms.length;
  const totalMembers = rooms.reduce((acc, room) => acc + room.memberCount, 0);
  
  // Prepare data for chart (Top 10 rooms to keep it clean)
  const chartData = rooms.slice(0, 10).map(r => ({
    name: r.name?.substring(0, 12) + (r.name?.length > 12 ? '...' : '') || 'Unnamed',
    members: r.memberCount
  }));

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-300 font-sans p-6 md:p-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <span className="text-teal-400">ⵣ</span> Creator Dashboard
          </h1>
          <p className="text-teal-400 text-sm">Manage your communities and track growth</p>
        </div>
        <Link href="/rooms" className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition">
          ← Back to App
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium mb-1">Total Rooms Owned</p>
            <h2 className="text-4xl font-bold text-white">{totalRooms}</h2>
          </div>
          <div className="text-4xl text-teal-500/50">ⵜ</div>
        </div>
        
        <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium mb-1">Total Community Members</p>
            <h2 className="text-4xl font-bold text-white">{totalMembers}</h2>
          </div>
          <div className="text-4xl text-teal-500/50">ⵓ</div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-lg mb-8">
        <h3 className="text-lg font-bold text-white mb-6">Members per Room (Top 10)</h3>
        {rooms.length === 0 ? (
          <p className="text-gray-500 text-center py-10">You don't own any rooms yet. Create one to see stats!</p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: '#334155', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="members" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Room List */}
      <h3 className="text-lg font-bold text-white mb-4">Your Rooms</h3>
      <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0b1120] text-gray-400 text-sm">
              <th className="p-4 border-b border-slate-700">Room Name</th>
              <th className="p-4 border-b border-slate-700">Members</th>
              <th className="p-4 border-b border-slate-700">Type</th>
              <th className="p-4 border-b border-slate-700 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((r) => (
              <tr key={r.id} className="border-b border-slate-700 hover:bg-[#0f172a]/50 transition">
                <td className="p-4">
                  <p className="font-bold text-white">{r.name || 'Unnamed Room'}</p>
                </td>
                <td className="p-4 text-teal-400 font-bold">{r.memberCount}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${r.type === 'direct' ? 'bg-slate-700 text-slate-300' : 'bg-teal-500/20 text-teal-400'}`}>
                    {r.type === 'direct' ? 'DM' : 'Group'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Link href="/rooms" className="text-sm text-gray-400 hover:text-white underline">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {rooms.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  No rooms found. Click "Back to App" to create your first community.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}