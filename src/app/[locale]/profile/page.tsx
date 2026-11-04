"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";

export default function MyProfileRedirect() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        // If logged in, redirect to their actual profile page
        router.replace(`/${locale}/profile/${user.uid}`);
      } else {
        // If not logged in, go to login
        router.replace(`/${locale}/account/login`);
      }
    });
    return () => unsub();
  }, [router, locale]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">
      Loading your profile...
    </div>
  );
}