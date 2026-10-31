"use client";

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong');
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Success state — same message whether user exists or not ───
  if (submitted) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0f172a] text-white p-4">
        <div className="w-full max-w-md bg-[#1e293b] p-8 rounded-2xl shadow-xl border border-slate-700">
          <div className="text-center text-5xl mb-4 text-teal-400">ⵣ</div>
          <h1 className="text-2xl font-bold text-teal-400 mb-2 text-center">Check your inbox</h1>
          <p className="text-center text-gray-400 mb-4">
            If an account exists for <strong className="text-white">{email}</strong>, we&apos;ve
            sent a password reset link.
          </p>
          <p className="text-center text-sm text-gray-500 mb-6">
            The link expires in 1 hour. Didn&apos;t receive it? Check spam, or wait a minute and
            try again.
          </p>
          <Link
            href={`/${locale}/account/login`}
            className="block text-center w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-lg"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  // ─── Form state ───
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#0f172a] text-white p-4">
      <div className="w-full max-w-md bg-[#1e293b] p-8 rounded-2xl shadow-xl border border-slate-700">
        <h1 className="text-2xl font-bold text-teal-400 mb-2 text-center">Reset your password</h1>
        <p className="text-center text-gray-400 mb-6">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        {error && (
          <div className="bg-red-500/20 text-red-400 p-3 rounded mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-[#0f172a] border border-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-teal-500"
            required
            autoComplete="email"
            autoFocus
          />
          <button
            type="submit"
            disabled={submitting || !email}
            className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg"
          >
            {submitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Remembered it?{' '}
          <Link href={`/${locale}/account/login`} className="text-teal-400 hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}