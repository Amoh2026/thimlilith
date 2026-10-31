export type VideoCallResolution =
  | { mode: 'livekit'; href: string }
  | { mode: 'jitsi'; url: string; external: true };

type Args = {
  roomId?: string;
  isPaidRoom?: boolean;
  isPremiumUser?: boolean;
  locale?: string;
};

export function resolveVideoCall({
  roomId,
  isPaidRoom,
  isPremiumUser,
  locale = 'en',
}: Args): VideoCallResolution {
  const premium = Boolean(isPaidRoom || isPremiumUser);
  const id = roomId || `instant-${Math.random().toString(36).slice(2, 10)}`;

  if (premium) {
    return { mode: 'livekit', href: `/${locale}/room/${id}/call` };
  }
  return {
    mode: 'jitsi',
    url: `https://meet.jit.si/thimlilith-${id}`,
    external: true,
  };
}

export function openVideoCall(res: VideoCallResolution, router?: { push: (h: string) => void }) {
  if (res.mode === 'livekit') {
    router?.push(res.href);
  } else {
    window.open(res.url, '_blank', 'noopener,noreferrer');
  }
}