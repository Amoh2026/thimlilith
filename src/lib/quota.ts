import { adminAuth, adminDb } from '@/lib/firebase/admin';

export type QuotaType = 'translate' | 'transcribe';

const FREE_LIMITS: Record<QuotaType, number> = {
  translate: 5,
  transcribe: 5,
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Confirmed from stripe/webhook/route.ts
const PREMIUM_FIELD = 'isPremium';
const PREMIUM_EXPIRY_FIELD = 'premiumExpiresAt';

const COUNTER_FIELD: Record<QuotaType, string> = {
  translate: 'dailyTranslations',
  transcribe: 'dailyTranscriptions',
};

const RESET_FIELD: Record<QuotaType, string> = {
  translate: 'lastTranslationReset',
  transcribe: 'lastTranscriptionReset',
};

export interface QuotaResult {
  allowed: boolean;
  remaining: number;   // -1 = unlimited
  isPremium: boolean;
  limit: number;       // -1 = unlimited
}

/** Verifies Authorization: Bearer <firebaseIdToken>. Returns uid or null. */
export async function getAuthedUid(req: Request): Promise<string | null> {
  const header =
    req.headers.get('authorization') || req.headers.get('Authorization');
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  if (!token) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

/**
 * Returns true only if the user is flagged premium AND their
 * premiumExpiresAt hasn't passed. Missing expiry = legacy premium
 * (treat as still premium — Stripe will overwrite it on next purchase).
 */
function isPremiumActive(data: Record<string, any>): boolean {
  if (data[PREMIUM_FIELD] !== true) return false;
  const expires = data[PREMIUM_EXPIRY_FIELD];
  if (typeof expires !== 'number') return true; // legacy premium user
  return expires > Date.now();
}

/** Atomically checks and increments quota. */
export async function checkAndConsumeQuota(
  uid: string,
  type: QuotaType
): Promise<QuotaResult> {
  const db = adminDb();
  const userRef = db.collection('users').doc(uid);
  const counterKey = COUNTER_FIELD[type];
  const resetKey = RESET_FIELD[type];
  const limit = FREE_LIMITS[type];

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) {
      return { allowed: false, remaining: 0, isPremium: false, limit };
    }
    const data = (snap.data() || {}) as Record<string, any>;

    if (isPremiumActive(data)) {
      return { allowed: true, remaining: -1, isPremium: true, limit: -1 };
    }

    const now = Date.now();
    const lastReset = typeof data[resetKey] === 'number' ? data[resetKey] : 0;
    const isNewDay = now - lastReset >= DAY_MS;
    const currentCount = isNewDay
      ? 0
      : typeof data[counterKey] === 'number'
      ? data[counterKey]
      : 0;

    if (currentCount >= limit) {
      return { allowed: false, remaining: 0, isPremium: false, limit };
    }

    tx.update(userRef, {
      [counterKey]: currentCount + 1,
      ...(isNewDay ? { [resetKey]: now } : {}),
    });

    return {
      allowed: true,
      remaining: limit - (currentCount + 1),
      isPremium: false,
      limit,
    };
  });
}

/** Safe to call repeatedly — ensures quota fields exist on the user doc. */
export async function ensureQuotaFields(uid: string): Promise<void> {
  const userRef = adminDb().collection('users').doc(uid);
  await userRef.set(
    {
      dailyTranslations: 0,
      lastTranslationReset: 0,
      dailyTranscriptions: 0,
      lastTranscriptionReset: 0,
    },
    { merge: true }
  );
}