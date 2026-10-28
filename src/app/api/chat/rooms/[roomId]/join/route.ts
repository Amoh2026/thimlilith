// ============================================================
// /api/chat/rooms/[roomId]/join  (POST)
// ============================================================
// B+ — collection: rooms (not chatRooms), members: string[]
// Security gates preserved: requiresApproval + isLocked
// Next.js 16: params is a Promise — must be awaited.
// ============================================================

import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyChatUser, unauthorized, serverError } from '@/lib/chat/auth-server';
import { MAX_ROOM_MEMBERS } from '@/types/chat';

type Params = { params: Promise<{ roomId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await verifyChatUser(req);
  if (!user) return unauthorized();

  try {
    const { roomId } = await params;

    const db = adminDb();
    const roomRef = db.collection('rooms').doc(roomId);   // ← was 'chatRooms'
    const displayName = user.name || user.email?.split('@')[0] || 'Member';

    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(roomRef);
      if (!snap.exists) throw new Error('not_found');

      const data = snap.data()!;
      const members: string[] = data.members ?? [];        // ← was any[] with objects

      // 1. Already a member?
      if (members.includes(user.uid)) {                     // ← was members.some(m => m.id === ...)
        return { alreadyMember: true };
      }

      // 2. Hard cap
      if (members.length >= MAX_ROOM_MEMBERS) {
        throw new Error('room_full');
      }

      // 3. SECURITY: private rooms cannot be joined directly
      if (data.requiresApproval === true) {
        throw new Error('requires_approval');
      }

      // 4. SECURITY: locked rooms are frozen
      if (data.isLocked === true) {
        throw new Error('room_locked');
      }

      // 5. Append UID + name-map update
      const newMembers = [...members, user.uid];            // ← was object push

      tx.update(roomRef, {
        members: newMembers,
        [`memberNames.${user.uid}`]: displayName,           // ← new field
        memberCount: newMembers.length,
      });

      return { joined: true };
    });

    return Response.json({ ok: true, ...result });
  } catch (err: any) {
    const msg = String(err?.message ?? '');
    if (msg === 'not_found') return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404 });
    if (msg === 'room_full') return new Response(JSON.stringify({ error: `Room is full (max ${MAX_ROOM_MEMBERS})` }), { status: 409 });
    if (msg === 'requires_approval') return new Response(JSON.stringify({ error: 'This room requires approval. Use /request.', code: 'requires_approval' }), { status: 403 });
    if (msg === 'room_locked') return new Response(JSON.stringify({ error: 'Room is currently locked.', code: 'room_locked' }), { status: 403 });
    console.error('POST /api/chat/rooms/[roomId]/join error:', err);
    return serverError(err?.message || 'Failed to join');
  }
}