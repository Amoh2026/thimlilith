// src/lib/atk.ts
import { addDoc, collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export type ATKSaveResult = { ok: true; id: string } | { ok: false; error: string };

export async function saveToATK(opts: {
  text: string;
  uid: string;
  messageId: string;
  roomId: string;
  roomName?: string;
  senderName?: string;
  source?: string; // 👈 1. ADDED THIS LINE
}): Promise<ATKSaveResult> {
  // 👈 2. ADDED source = "thimlilith_chat" to the destructuring
  const { text, uid, messageId, roomId, roomName, senderName, source = "thimlilith_chat" } = opts;

  const trimmed = (text || "").trim();
  if (!trimmed) return { ok: false, error: "Message is empty" };
  if (trimmed.length > 500) return { ok: false, error: "Message too long (500 char max)" };
  if (!uid) return { ok: false, error: "Not signed in" };

  try {
    // 1. WRITE TO PERSONAL VOCABULARY (Instant for the user)
    // Uses a generated ID. If you want to prevent duplicates, we can hash the word later.
    const vocabRef = doc(collection(db, "users", uid, "vocabulary"));
    await setDoc(vocabRef, {
      kab_latin: trimmed,
      added_from: source, // 👈 3. CHANGED "thimlilith_chat" TO source
      added_at: serverTimestamp(),
      source_room: roomName || roomId,
    });

    // 2. WRITE TO GLOBAL INBOX (For admin review)
    const ref = await addDoc(collection(db, "db_all_submissions"), {
      data: {
        kab_latin: trimmed,
        raw_chat_text: trimmed,
        room_name: roomName ?? null,
      },
      db1_id: null,
      file_name: null,
      row_number: null,
      region: [],
      filter_result: null,
      source: source, // 👈 4. CHANGED "thimlilith_chat" TO source
      submitted_at: Date.now(),
      submitted_by: uid,
      created_at_server: serverTimestamp(),
      chat_context: {
        message_id: messageId,
        room_id: roomId,
        saved_by: uid,
        sender_name: senderName ?? null,
      },
    });

    return { ok: true, id: ref.id };
  } catch (e: any) {
    console.error("ATK Save Error:", e);
    return { ok: false, error: e?.message ?? "Write failed" };
  }
}