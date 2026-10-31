'use client';
import { useParams } from 'next/navigation';
import { resolveVideoCall, openVideoCall } from '@/lib/video';

export default function VideoCallCenter() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const startInstant = () => {
    const res = resolveVideoCall({ locale, isPremiumUser: false });
    openVideoCall(res);
  };

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-200 pt-16 pb-24 px-4">
      <div className="max-w-lg mx-auto mt-8">
        <h1 className="text-xl font-semibold mb-1">Video Call</h1>
        <p className="text-slate-400 text-sm mb-6">Free calls open in Jitsi. Premium calls run natively on LiveKit.</p>
        <button onClick={startInstant} className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#1e293b] border border-white/10 active:scale-[0.98] transition-transform">
          <span className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden>⚡</span>
            <span className="text-left">
              <span className="block text-slate-100 font-medium text-sm">Instant Call</span>
              <span className="block text-slate-400 text-[11px] mt-0.5">Start a free Jitsi room now</span>
            </span>
          </span>
          <span className="text-teal-400 text-lg" aria-hidden>→</span>
        </button>
      </div>
    </main>
  );
}