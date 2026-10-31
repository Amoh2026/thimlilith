"use client";

import { useEffect } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

export function RequireVerified({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const locale = (params?.locale as string) || 'en';

  useEffect(() => {
    if (loading) return;

    // 1. If not logged in, go to login
    if (!user) {
      router.replace(`/${locale}/account/login`);
      return;
    }

    // 2. TEMPORARY BYPASS: We commented out the email verification check
    // so you can get into the app while we fix the Resend email issue.
    /*
    if (!user.emailVerified) {
      router.replace(`/${locale}/account/verify-email`);
      return;
    }
    */
  }, [user, loading, router, locale, pathname]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-[#0f172a] text-white">Loading...</div>;
  }

  // TEMPORARY BYPASS: Only checking if the user exists now, not if they are verified
  if (!user) {
    return <div className="flex h-screen items-center justify-center bg-[#0f172a] text-white">Checking verification...</div>;
  }

  return <>{children}</>;
}