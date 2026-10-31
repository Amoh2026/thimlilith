"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const oobCode = searchParams.get('oobCode');

  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'success'>('loading');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  
  // NEW: Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!oobCode) {
      setErrorMsg('This reset link is missing a verification code. Please request a new one.');
      setState('error');
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then((userEmail) => {
        setEmail(userEmail);
        setState('ready');
      })
      .catch((err: any) => {
        const code = err?.code || '';
        if (code === 'auth/expired-action-code') {
          setErrorMsg('This link has expired. Please request a new password reset.');
        } else if (code === 'auth/invalid-action-code') {
          setErrorMsg('This link is invalid or has already been used. Please request a new one.');
        } else if (code === 'auth/user-disabled') {
          setErrorMsg('This account has been disabled. Please contact support.');
        } else if (code === 'auth/user-not-found') {
          setErrorMsg('This account no longer exists.');
        } else {
          setErrorMsg('Unable to verify this reset link. Please request a new one.');
        }
        setState('error');
      });
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setFormError('Passwords do not match.');
      return;
    }
    if (!oobCode) {
      setFormError('Missing verification code.');
      return;
    }

    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setState('success');
      setTimeout(() => {
        router.replace(`/${locale}/account/login`);
      }, 2500);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/expired-action-code') {
        setFormError('This link has expired. Please request a new reset.');
      } else if (code === 'auth/weak-password') {
        setFormError('Password is too weak. Use a stronger password.');
      } else if (code === 'auth/invalid-action-code') {
        setFormError('This link is invalid or has already been used.');
      } else {
        setFormError(err.message?.replace('Firebase: ', '') || 'Failed to reset password.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (state === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f172a] text-white">
        Verifying your reset link...
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0f172a] text-white p-4">
        <div className="w-full max-w-md bg-[#1e293b] p-8 rounded-2xl shadow-xl border border-slate-700">
          <h1 className="text-2xl font-bold text-red-400 mb-4 text-center">Link problem</h1>
          <p className="text-center text-gray-300 mb-6">{errorMsg}</p>
          <Link
            href={`/${locale}/account/forgot-password`}
            className="block text-center w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-lg"
          >
            Request a new reset link
          </Link>
          <p className="text-center text-sm text-gray-400 mt-4">
            <Link href={`/${locale}/account/login`} className="text-teal-400 hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0f172a] text-white p-4">
        <div className="w-full max-w-md bg-[#1e293b] p-8 rounded-2xl shadow-xl border border-teal-500/50">
          <div className="text-center text-5xl mb-4 text-teal-400">ⵣ</div>
          <h1 className="text-2xl font-bold text-teal-400 mb-2 text-center">Password updated</h1>
          <p className="text-center text-gray-300 mb-6">
            Your password has been reset. Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#0f172a] text-white p-4">
      <div className="w-full max-w-md bg-[#1e293b] p-8 rounded-2xl shadow-xl border border-slate-700">
        <h1 className="text-2xl font-bold text-teal-400 mb-2 text-center">Choose a new password</h1>
        <p className="text-center text-gray-400 mb-6">
          For <strong className="text-white">{email}</strong>
        </p>

        {formError && (
          <div className="bg-red-500/20 text-red-400 p-3 rounded mb-4 text-sm">{formError}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* NEW: New Password Toggle */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-700 text-white pl-4 pr-12 py-3 rounded-lg focus:outline-none focus:border-teal-500"
              required
              minLength={6}
              autoComplete="new-password"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>

          {/* NEW: Confirm Password Toggle */}
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-700 text-white pl-4 pr-12 py-3 rounded-lg focus:outline-none focus:border-teal-500"
              required
              minLength={6}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
            >
              {showConfirm ? (
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
            {submitting ? 'Updating...' : 'Set new password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0f172a] text-white">Loading...</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}