import { NextResponse } from 'next/server';
import { checkAndConsumeQuota, getAuthedUid } from '@/lib/quota';
import { adminDb } from '@/lib/firebase/admin';

// ─── In-memory dictionary cache ───
let _dictCache: { words: string[]; loadedAt: number } | null = null;
const DICT_TTL = 5 * 60 * 1000;
const DICT_LIMIT = 5000; // raise once we need more coverage
const MAX_TYPO_DISTANCE = 1; // strict for translate (transcribe uses 2)

async function getDictionary(): Promise<string[]> {
  const now = Date.now();
  if (_dictCache && now - _dictCache.loadedAt < DICT_TTL) return _dictCache.words;
  const snap = await adminDb().collection('db2_words').limit(DICT_LIMIT).get();
  const words = snap.docs.map(d => d.data().kab_latin).filter(Boolean);
  _dictCache = { words, loadedAt: now };
  return words;
}

function levenshtein(a: string, b: string): number {
  const m = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      m[i][j] = b[i-1] === a[j-1]
        ? m[i-1][j-1]
        : Math.min(m[i-1][j-1] + 1, m[i][j-1] + 1, m[i-1][j] + 1);
    }
  }
  return m[b.length][a.length];
}

function correctWord(word: string, dict: string[]): string {
  let best = word, bestDist = MAX_TYPO_DISTANCE + 1;
  for (const d of dict) {
    const dist = levenshtein(word.toLowerCase(), d.toLowerCase());
    if (dist < bestDist) { bestDist = dist; best = d; }
    if (bestDist === 0) break;
  }
  return bestDist <= MAX_TYPO_DISTANCE ? best : word;
}

function correctKabyleText(text: string, dict: string[]): string {
  // Preserve punctuation & spacing; only correct word cores
  return text.replace(/[\p{L}'-]+/gu, (w) => correctWord(w, dict));
}

export async function POST(req: Request) {
  try {
    // 🛡️ Gatekeeper (unchanged)
    const uid = await getAuthedUid(req);
    if (!uid) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', code: 'AUTH_REQUIRED', message: 'Sign in to use AI translation.' },
        { status: 401 }
      );
    }
    const quota = await checkAndConsumeQuota(uid, 'translate');
    if (!quota.allowed) {
      return NextResponse.json(
        { error: 'LIMIT_REACHED', code: 'FREE_LIMIT', limit: quota.limit, remaining: 0,
          message: "You've reached your free daily translation limit. Upgrade to Premium for unlimited translations. 💎" },
        { status: 403 }
      );
    }

    const { text, targetLang = 'en' } = await req.json();
    if (!text) return NextResponse.json({ error: "No text provided" }, { status: 400 });

    const API_KEY = process.env.GOOGLE_AI_API_KEY;
    if (!API_KEY) return NextResponse.json({ error: "Missing Google AI API Key" }, { status: 500 });

    const langNames: Record<string, string> = { en: 'English', fr: 'French', ar: 'Arabic', kab: 'Kabyle' };
    const targetLanguage = langNames[targetLang] || 'English';

    // 🎯 NEW STEP 1 — pre-correct source (when target ≠ Kabyle, source is likely Kabyle)
    let sourceText = text;
    try {
      const dict = await getDictionary();
      if (targetLang !== 'kab') {
        sourceText = correctKabyleText(text, dict);
      }
    } catch (e) { /* cache miss / DB down — fall back to raw */ }

    const MODELS = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-flash-latest"];
    const prompt = `You are an expert translator for the Kabyle language...
Translate the text to ${targetLanguage}. Output ONLY the translation and nothing else.

Text: "${sourceText}"`;

    let lastError: any = null;

    for (const model of MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const response = await fetch(`${url}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      const data = await response.json();
      if (response.ok) {
        let translated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (translated) {
          // 🎯 NEW STEP 2 — post-correct when output is Kabyle
          if (targetLang === 'kab') {
            try {
              const dict = await getDictionary();
              translated = correctKabyleText(translated, dict);
            } catch { /* keep raw */ }
          }
          return NextResponse.json({ translation: translated });
        }
      } else {
        lastError = data;
        if (response.status === 503 || response.status === 404) continue;
        return NextResponse.json({ error: "Google AI API Error", details: data }, { status: response.status });
      }
    }
    return NextResponse.json({ error: "All models failed.", details: lastError }, { status: 503 });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}