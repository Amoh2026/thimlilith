"use client";

import { useState } from 'react';
import { auth } from '@/lib/firebase/client';

interface SSOButtonProps {
  target?: string;
  label?: string;
  icon?: string;
  className?: string;
}

export function SSOButton({ target = 'atk', label = 'Go to ATK', icon, className }: SSOButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSSO = async () => {
    console.log("🚀 [SSO] Button clicked!");
    
    if (!auth.currentUser) {
      console.error("❌ [SSO] No current user found.");
      alert("You must be logged in to use the SSO bridge.");
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      console.log("⏳ [SSO] Getting ID Token for user:", auth.currentUser.uid);
      const idToken = await auth.currentUser.getIdToken();
      console.log("✅ [SSO] ID Token retrieved.");

      console.log("📡 [SSO] Fetching /api/auth/bridge...");
      const res = await fetch(`/api/auth/bridge?target=${target}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      console.log("📥 [SSO] Response status:", res.status);
      const data = await res.json();
      console.log("📦 [SSO] Response data:", data);
      
      if (!res.ok) {
        throw new Error(data.error || `Server returned ${res.status}`);
      }

      if (data.url) {
        console.log("✅ [SSO] Redirecting to:", data.url);
        window.location.href = data.url;
      } else {
        throw new Error('No redirect URL returned from server');
      }
      
    } catch (err: any) {
      console.error("❌ [SSO] Error:", err);
      setError(err.message);
      setLoading(false);
      alert(`SSO Error: ${err.message}`);
    }
  };

  // Icon Mode (for desktop sidebar)
  if (icon) {
    return (
      <button
        type="button"
        onClick={handleSSO}
        disabled={loading}
        className={`hover:text-teal-400 text-xl font-bold transition-colors disabled:opacity-50 cursor-pointer ${className}`}
        title={label}
      >
        {loading ? '⏳' : icon}
      </button>
    );
  }

  // Button Mode (for mobile or floating)
  return (
    <div className="flex flex-col gap-1 w-full">
      <button
        type="button"
        onClick={handleSSO}
        disabled={loading}
        className={`bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 cursor-pointer ${className}`}
      >
        {loading ? 'Bridging...' : label}
      </button>
      {error && <span className="text-xs text-red-400 text-center">{error}</span>}
    </div>
  );
}