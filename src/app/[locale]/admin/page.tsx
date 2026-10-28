"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, auth } from '@/lib/firebase/client';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [reports, setReports] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'reports' | 'users'>('reports');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        return;
      }

      // 👇 VERIFY WITH THE SERVER
      try {
        const token = await currentUser.getIdToken();
        const res = await fetch('/api/admin/verify', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setIsAdmin(data.isAdmin);
      } catch (err) {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Fetch Reports & Users if Admin
  useEffect(() => {
    if (!isAdmin) return;

    const qReports = query(collection(db, "reports"), where("status", "==", "pending"));
    const unsubReports = onSnapshot(qReports, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qUsers = query(collection(db, "users"));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const u: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      u.sort((a, b) => {
        if (a.status !== 'active' && b.status === 'active') return -1;
        if (a.status === 'active' && b.status !== 'active') return 1;
        return (b.strikes?.length || 0) - (a.strikes?.length || 0);
      });
      setUsersList(u);
    });

    return () => { unsubReports(); unsubUsers(); };
  }, [isAdmin]);

  const handleDismissReport = async (reportId: string) => {
    if (!confirm("Dismiss this report?")) return;
    await updateDoc(doc(db, "reports", reportId), { status: "dismissed" });
  };

  const handleResolveReport = async (reportId: string, reportedId: string) => {
    if (!confirm("Mark as resolved and Ban the reported user?")) return;
    await updateDoc(doc(db, "reports", reportId), { status: "resolved" });
    await updateDoc(doc(db, "users", reportedId), { status: "banned" });
    alert("User banned and report resolved.");
  };

  const handleClearStrikes = async (userId: string) => {
    if (!confirm("Clear strikes and unmute this user?")) return;
    await updateDoc(doc(db, "users", userId), { strikes: [], status: "active", mutedUntil: null });
  };

  const handleBanUser = async (userId: string) => {
    if (!confirm("PERMANENT BAN this user?")) return;
    await updateDoc(doc(db, "users", userId), { status: "banned" });
  };

  if (loading) return <div className="p-10 text-white bg-[#0f172a] h-screen">Loading secure environment...</div>;

  if (!user || !isAdmin) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#0f172a] text-white">
        <h1 className="text-4xl font-bold text-red-500 mb-4">⛔ Access Denied</h1>
        <p className="text-gray-400 mb-8">You do not have administrator privileges.</p>
        <p className="text-sm text-gray-500 mb-4">Logged in as: {user?.email || 'Not logged in'}</p>
        <Link href="/rooms" className="bg-teal-600 px-6 py-2 rounded-lg hover:bg-teal-500">Back to Chat</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-300 font-sans p-6 md:p-10">
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-teal-400 text-sm">Thimlilith Trust & Safety Command Center (Server Verified)</p>
        </div>
        <div className="flex gap-4">
          <Link href="/rooms" className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm font-medium">Back to App</Link>
          <button onClick={() => signOut(auth)} className="bg-red-600/20 text-red-400 border border-red-600/50 hover:bg-red-600/30 px-4 py-2 rounded-lg text-sm font-medium">Logout</button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button onClick={() => setActiveTab('reports')} className={`px-6 py-2 rounded-lg font-bold transition ${activeTab === 'reports' ? 'bg-teal-600 text-white' : 'bg-[#1e293b] text-gray-400 hover:text-white'}`}>🚨 Pending Reports ({reports.length})</button>
        <button onClick={() => setActiveTab('users')} className={`px-6 py-2 rounded-lg font-bold transition ${activeTab === 'users' ? 'bg-teal-600 text-white' : 'bg-[#1e293b] text-gray-400 hover:text-white'}`}>👥 Manage Users ({usersList.length})</button>
      </div>

      {activeTab === 'reports' && (
        <div className="grid gap-4">
          {reports.length === 0 && <p className="text-gray-500">No pending reports. The community is safe! 🛡️</p>}
          {reports.map((r) => (
            <div key={r.id} className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Report against: {r.reportedName || r.reportedId}</h3>
                <p className="text-sm text-red-400 mb-2">Reason: {r.reason}</p>
                <p className="text-xs text-gray-400">Reported by: {r.reporterName || r.reporterId}</p>
              </div>
              <div className="flex gap-2 items-center">
                <button onClick={() => handleDismissReport(r.id)} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm">Dismiss</button>
                <button onClick={() => handleResolveReport(r.id, r.reportedId)} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold">Ban User</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0b1120] text-gray-400 text-sm">
                <th className="p-4 border-b border-slate-700">User</th>
                <th className="p-4 border-b border-slate-700">Status</th>
                <th className="p-4 border-b border-slate-700">Strikes</th>
                <th className="p-4 border-b border-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => (
                <tr key={u.id} className="border-b border-slate-700 hover:bg-[#0f172a]/50 transition">
                  <td className="p-4">
                    <p className="font-bold text-white">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.status === 'active' || !u.status ? 'bg-green-500/20 text-green-400' : u.status === 'muted' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                      {u.status || 'active'}
                    </span>
                  </td>
                  <td className="p-4 text-white font-bold">{u.strikes?.length || 0}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => handleClearStrikes(u.id)} className="bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded text-xs font-medium">Forgive / Unmute</button>
                    {u.status !== 'banned' && (
                      <button onClick={() => handleBanUser(u.id)} className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded text-xs font-medium">Ban</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}