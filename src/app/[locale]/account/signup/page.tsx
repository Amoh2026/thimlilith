"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  // sendEmailVerification, // <-- REMOVED: We use our custom API route instead
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuth } from '@/components/auth/AuthProvider';

export default function SignupPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { user, loading, refreshUser } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);

  // Redirect logic handles unverified users properly
  useEffect(() => {
    if (!loading && user) {
      if (!user.emailVerified) {
        router.replace(`/${locale}/account/verify-email`);
      } else {
        router.replace(`/${locale}/rooms`);
      }
    }
  }, [user, loading, router, locale]);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const displayName = name.trim() || email.split('@')[0];
      await updateProfile(res.user, { displayName });
      
      // NEW: Call our custom API route to send the email via Resend
      await fetch('/api/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale, displayName }),
      });
      
      await refreshUser();
      
      // Send them to the verify page instead of rooms
      router.replace(`/${locale}/account/verify-email`);
    } catch (err: any) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    try {
      // Google accounts are inherently verified, so this goes straight to rooms
      await signInWithPopup(auth, new GoogleAuthProvider());
      router.replace(`/${locale}/rooms`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading || user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f172a] text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#0f172a] text-white p-4">
      <div className="w-full max-w-md bg-[#1e293b] p-8 rounded-2xl shadow-xl border border-slate-700">
        <h1 className="text-3xl font-bold text-teal-400 mb-2 text-center">Thimlilith</h1>
        <p className="text-center text-gray-400 mb-8">ⵜⵉⵎⵍⵉⵍⵉⵜ — Join the Thajmaath</p>

        {error && (
          <div className="bg-red-500/20 text-red-400 p-3 rounded mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleEmailSignup} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Display Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-[#0f172a] border border-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-teal-500"
            autoComplete="name"
          />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-[#0f172a] border border-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-teal-500"
            required
            autoComplete="email"
          />
          
          {/* Password input with toggle */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-700 text-white pl-4 pr-12 py-3 rounded-lg focus:outline-none focus:border-teal-500"
              required
              minLength={6}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg mt-2"
          >
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-slate-700"></div>
          <span className="px-4 text-sm text-gray-500">OR</span>
          <div className="flex-1 border-t border-slate-700"></div>
        </div>

        <button
          onClick={handleGoogleSignup}
          className="w-full bg-white text-gray-900 font-bold py-3 rounded-lg"
        >
          Continue with Google
        </button>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{' '}
          <Link
            href={`/${locale}/account/login`}
            className="text-teal-400 hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}