// src/components/StripeConnectButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase/client';
import { doc, onSnapshot } from 'firebase/firestore';
import { useTranslations } from 'next-intl';

export default function StripeConnectButton() {
  const t = useTranslations('Settings'); // Or a new translation key
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setStripeAccountId(data.stripeAccountId || null);
        // Note: To be 100% accurate, we should also check `payouts_enabled` via the Stripe API, 
        // but for now, if they have an ID, we assume they are connected.
        setIsConnected(!!data.stripeAccountId);
      }
    });
    return () => unsub();
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe Onboarding
      } else {
        alert(data.error || 'Failed to start Stripe Connect');
      }
    } catch (err: any) {
      alert(err.message);
    }
    setLoading(false);
  };

  if (isConnected) {
    return (
      <div className="bg-emerald-900/30 border border-emerald-500/50 p-4 rounded-xl flex items-center justify-between">
        <div>
          <h4 className="text-emerald-400 font-bold">Stripe Connected ✅</h4>
          <p className="text-xs text-gray-400">You can receive payouts directly to your bank.</p>
        </div>
        <button 
          onClick={handleConnect} 
          className="text-xs text-emerald-400 hover:underline"
        >
          Update Bank Info
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="w-full bg-[#635BFF] hover:bg-[#5249df] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {loading ? 'Connecting...' : '💳 Link Bank Account (Stripe)'}
    </button>
  );
}