"use client";

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase/client';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import Link from 'next/link';

function JoinRoomContent() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const locale = params.locale as string;

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [status, setStatus] = useState("Checking invite link...");
  const [error, setError] = useState("");

  // Approval flow state
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [pendingRoom, setPendingRoom] = useState<{ id: string; name: string } | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!code || authLoading || !user) return;

    const callJoin = async (roomId: string) => {
      const token = await user.getIdToken();
      const res = await fetch(`/api/chat/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return { ok: res.ok, status: res.status, data: await res.json() };
    };

    const run = async () => {
      try {
        setStatus("Finding the community...");
        const q = query(collection(db, "rooms"), where("inviteCode", "==", code));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setError("Invalid or expired invite link.");
          return;
        }

        const roomDoc = snapshot.docs[0];
        const roomData = roomDoc.data();
        const roomName = roomData.name || "this room";

        // Already a member → fast path
        if ((roomData.members || []).includes(user.uid)) {
          sessionStorage.setItem('activeRoomId', roomDoc.id);
          setStatus("You are already a member! Redirecting...");
          setTimeout(() => router.push(`/${locale}/rooms`), 1200);
          return;
        }

        // Private room → show "Request to Join"
        if (roomData.requiresApproval === true) {
          setPendingRoom({ id: roomDoc.id, name: roomName });
          setRequiresApproval(true);
          setStatus("This room requires approval.");
          return;
        }

        // Public room → call join API
        setStatus("Joining the community...");
        const result = await callJoin(roomDoc.id);

        if (!result.ok) {
          if (result.data.code === 'requires_approval') {
            // Room flipped to private between fetch and join — fall back to request UI
            setPendingRoom({ id: roomDoc.id, name: roomName });
            setRequiresApproval(true);
            setStatus("This room requires approval.");
            return;
          }
          if (result.data.code === 'room_locked') {
            setError("This room is currently locked. Try again later.");
            return;
          }
          setError(result.data.error || "Failed to join.");
          return;
        }

        sessionStorage.setItem('activeRoomId', roomDoc.id);
        setStatus("Success! Redirecting to the chat...");
        setTimeout(() => router.push(`/${locale}/rooms`), 1200);

      } catch (err: any) {
        console.error(err);
        setError(`Failed to join: ${err.message}`);
      }
    };

    run();
  }, [user, code, router, locale, authLoading]);

  const handleRequestJoin = async () => {
    if (!pendingRoom || !user) return;
    setIsRequesting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/chat/rooms/${pendingRoom.id}/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (String(data.error || '').toLowerCase().includes('public')) {
          // Room became public — fall back to direct join
          const joinRes = await fetch(`/api/chat/rooms/${pendingRoom.id}/join`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (joinRes.ok) {
            sessionStorage.setItem('activeRoomId', pendingRoom.id);
            setStatus("Success! Redirecting...");
            setTimeout(() => router.push(`/${locale}/rooms`), 1200);
            return;
          }
        }
        setError(data.error || "Failed to send request.");
        return;
      }
      setRequestSent(true);
      setStatus("Request sent! The owner will approve you.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRequesting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f172a] text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#0f172a] text-white p-4">
      <div className="w-full max-w-md bg-[#1e293b] p-8 rounded-2xl shadow-xl border border-slate-700 text-center">
        <h1 className="text-3xl font-bold text-teal-400 mb-4">Thimlilith</h1>

        {error ? (
          <div className="flex flex-col items-center gap-4">
            <span className="text-5xl">⛔</span>
            <p className="text-red-400 font-medium">{error}</p>
            <Link
              href={`/${locale}/rooms`}
              className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg mt-4"
            >
              Go to Home
            </Link>
          </div>
        ) : !user ? (
          <div className="flex flex-col items-center gap-4">
            <span className="text-5xl">🔒</span>
            <p className="text-gray-300 font-medium">
              You need to log in to join this community.
            </p>
            <Link
              href={`/${locale}/rooms`}
              className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-2 rounded-lg mt-4 font-bold"
            >
              Go to Login
            </Link>
          </div>
        ) : requiresApproval && pendingRoom ? (
          <div className="flex flex-col items-center gap-4">
            <span className="text-5xl">🔐</span>
            <p className="text-gray-300 font-medium">
              <strong className="text-white">{pendingRoom.name}</strong> requires owner approval.
            </p>
            {requestSent ? (
              <>
                <p className="text-teal-400 text-sm">
                  ✅ Request sent — the owner will review it.
                </p>
                <Link
                  href={`/${locale}/rooms`}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg mt-2"
                >
                  Back to Chat
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={handleRequestJoin}
                  disabled={isRequesting}
                  className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold"
                >
                  {isRequesting ? "Sending..." : "Request to Join"}
                </button>
                <Link
                  href={`/${locale}/rooms`}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Cancel
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-300 font-medium">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function JoinRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#0f172a] text-white">
          Loading...
        </div>
      }
    >
      <JoinRoomContent />
    </Suspense>
  );
}