"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth } from '@/lib/firebase/client';
import { signOut } from 'firebase/auth'; 
import { useAuth } from '@/components/auth/AuthProvider';

export default function VerifyEmailPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  
  // We MUST have refreshUser here to update the app when you verify
  const { user, loading, refreshUser } = useAuth();

  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // If they are already verified or logged out, send them away
  useEffect(() => {
    if (!loading) {
      if (!user) router.replace(`/${locale}/account/login`);
      else if (user.emailVerified) router.replace(`/${locale}/rooms`);
    }
  }, [user, loading, router, locale]);

  const handleResend = async () => {
    if (!user) return;
    setResending(true);
    setError('');
    setMessage('');
    
    try {
      const res = await fetch('/api/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: user.email, 
          locale,
          displayName: user.displayName 
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to send verification email. Please try again later.');
      }
      
      setMessage('Verification email sent! Check your inbox and spam folder.');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email.');
    } finally {
      setResending(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!auth.currentUser) return;
    setChecking(true);
    setError('');
    setMessage('');
    try {
      // 1. Fetch the latest user data from Firebase servers
      await auth.currentUser.reload();
      
      if (auth.currentUser.emailVerified) {
        // 2. Update the global AuthProvider so the app knows you are verified
        await refreshUser(); 
        router.replace(`/${locale}/rooms`);
      } else {
        setError('Email not verified yet. Please check your inbox and click the link.');
      }
    } catch (err: any) {
      setError('Failed to check status. Try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  if (loading || !user) {
    return <div className="flex h-screen items-center justify-center bg-[#0f172a] text-white">Loading...</div>;
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#0f172a] text-white p-4">
      <div className="w-full max-w-md bg-[#1e293b] p-8 rounded-2xl shadow-xl border border-slate-700 text-center">
        <div className="text-5xl mb-4 text-teal-400">ⵣ</div>
        <h1 className="text-2xl font-bold text-teal-400 mb-2">Verify your email</h1>
        <p className="text-gray-300 mb-6">
          We sent a verification link to <strong className="text-white">{user.email}</strong>.
          Please click the link to unlock the app.
        </p>

        {message && <div className="bg-green-500/20 text-green-400 p-3 rounded mb-4 text-sm">{message}</div>}
        {error && <div className="bg-red-500/20 text-red-400 p-3 rounded mb-4 text-sm">{error}</div>}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg"
          >
            {checking ? 'Checking...' : 'I have verified my email'}
          </button>
          
          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg"
          >
            {resending ? 'Sending...' : 'Resend verification email'}
          </button>
        </div>

        <button onClick={handleLogout} className="mt-6 text-sm text-gray-400 hover:text-white underline">
          Log out
        </button>
      </div>
    </div>
  );
}