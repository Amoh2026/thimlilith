// src/app/api/transcribe/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { checkAndConsumeQuota, getAuthedUid } from '@/lib/quota';

function levenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function findClosestWord(inputWord: string, dictionary: string[]): string {
  let closest = inputWord;
  let minDistance = 2;
  for (const dictWord of dictionary) {
    if (!dictWord) continue;
    const distance = levenshteinDistance(inputWord.toLowerCase(), dictWord.toLowerCase());
    if (distance < minDistance) {
      minDistance = distance;
      closest = dictWord;
    }
  }
  return closest;
}

export async function POST(req: Request) {
  try {
    const uid = await getAuthedUid(req);
    if (!uid) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', code: 'AUTH_REQUIRED', message: 'Sign in to use voice transcription.' },
        { status: 401 }
      );
    }
    const quota = await checkAndConsumeQuota(uid, 'transcribe');
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: 'LIMIT_REACHED',
          code: 'FREE_LIMIT',
          limit: quota.limit,
          remaining: 0,
          message: "You've reached your free daily voice-note limit. Upgrade to Premium for unlimited transcriptions. 💎",
        },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;
    const hfKey = process.env.HUGGINGFACE_API_TOKEN;

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    let rawText = "";
    let providerUsed = "";

    if (!rawText && groqKey) {
      try {
        const apiFormData = new FormData();
        apiFormData.append("file", new File([fileBuffer], file.name, { type: file.type }));
        apiFormData.append("model", "whisper-large-v3");
        apiFormData.append("prompt", "Transcribe this Kabyle (Amazigh) audio into the Latin alphabet (Kabyle Latin). Do NOT use Arabic script. Example output: Azul fell-awen, amek tettilim?");
        const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${groqKey}` },
          body: apiFormData,
        });
        const data = await res.json();
        if (res.ok && data.text) {
          rawText = data.text;
          providerUsed = "groq";
        } else {
          throw new Error(data.error?.message || "Groq failed");
        }
      } catch (err: any) {
        console.warn("Groq failed:", err.message);
      }
    }

    if (!rawText && openAiKey) {
      try {
        const apiFormData = new FormData();
        apiFormData.append("file", new File([fileBuffer], file.name, { type: file.type }));
        apiFormData.append("model", "whisper-1");
        apiFormData.append("prompt", "Transcribe this Kabyle (Amazigh) audio into the Latin alphabet (Kabyle Latin). Do NOT use Arabic script. Example output: Azul fell-awen, amek tettilim?");
        const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${openAiKey}` },
          body: apiFormData,
        });
        const data = await res.json();
        if (res.ok && data.text) {
          rawText = data.text;
          providerUsed = "openai";
        } else {
          throw new Error(data.error?.message || "OpenAI failed");
        }
      } catch (err: any) {
        console.warn("OpenAI failed:", err.message);
      }
    }

    if (!rawText && hfKey) {
      try {
        const res = await fetch("https://api-inference.huggingface.co/models/openai/whisper-large-v3", {
          method: "POST",
          headers: { Authorization: `Bearer ${hfKey}`, "Content-Type": file.type || "audio/webm" },
          body: fileBuffer,
        });
        const data = await res.json();
        if (res.ok && data.text) {
          rawText = data.text;
          providerUsed = "huggingface";
        } else {
          throw new Error(data.error || "HuggingFace failed");
        }
      } catch (err: any) {
        console.warn("HuggingFace failed:", err.message);
      }
    }

    if (!rawText) {
      return NextResponse.json({ error: "All transcription providers failed. Please check your API keys or try again later." }, { status: 500 });
    }

    let correctedText = rawText;
    try {
      const wordsSnapshot = await adminDb().collection("db2_words").limit(2000).get();
      if (!wordsSnapshot.empty) {
        const dictionary = wordsSnapshot.docs.map(doc => doc.data().kab_latin).filter(Boolean);
        const words = rawText.split(" ");
        const correctedWords = words.map((word: string) => {
          const cleanWord = word.replace(/[.,?!]/g, "");
          if (!cleanWord) return word;
          const closestMatch = findClosestWord(cleanWord, dictionary);
          if (closestMatch !== cleanWord) {
            return word.replace(cleanWord, closestMatch);
          }
          return word;
        });
        correctedText = correctedWords.join(" ");
      }
    } catch (dbError: any) {
      console.error("Dictionary correction failed (Returning raw text):", dbError.message);
    }

    return NextResponse.json({ text: correctedText, raw_text: rawText, provider: providerUsed });

  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
