"use client";

import { useEffect, useState, Suspense } from "react";
import { auth } from "@/lib/firebase/client";
import { signInWithCustomToken } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";

function SSOContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const next = searchParams.get("next");

    if (token) {
      signInWithCustomToken(auth, token)
        .then(() => {
          if (next) {
            router.replace(decodeURIComponent(next));
          } else {
            router.replace("/en/chats");
          }
        })
        .catch((err) => {
          console.error("SSO failed", err);
          setError("SSO failed. Please log in manually.");
          setTimeout(() => router.push("/en/chats"), 2000);
        });
    } else {
      router.replace("/en/chats");
    }
  }, [router, searchParams]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#0f172a] text-white">
      {error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        <p className="text-teal-400">Syncing your account...</p>
      )}
    </div>
  );
}

export default function SSOPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0f172a] text-white"><p className="text-teal-400">Loading...</p></div>}>
      <SSOContent />
    </Suspense>
  );
}