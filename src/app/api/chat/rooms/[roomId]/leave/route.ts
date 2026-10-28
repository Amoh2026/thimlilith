// ============================================================
// /api/chat/rooms/[roomId]/leave  (POST)
// ============================================================
// B+ — collection: rooms, members: string[]
// Transactional (fixes race), owner cannot leave (orphan guard)
// ============================================================

import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyChatUser, unauthorized, serverError } from '@/lib/chat/auth-server';

type Params = { params: Promise<{ roomId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await verifyChatUser(req);
  if (!user) return unauthorized();

  try {
    const { roomId } = await params;

    const db = adminDb();
    const roomRef = db.collection('rooms').doc(roomId);   // ← was 'chatRooms'

    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(roomRef);
      if (!snap.exists) throw new Error('not_found');

      const data = snap.data()!;

      // Owner cannot orphan their own room
      if (data.createdBy === user.uid) {
        throw new Error('owner_cannot_leave');
      }

      const members: string[] = data.members ?? [];
      const remaining = members.filter((uid) => uid !== user.uid);  // ← was m.id

      if (remaining.length === members.length) {
        return { notMember: true };
      }

      tx.update(roomRef, {
        members: remaining,
        memberCount: remaining.length,
      });

      return { left: true };
    });

    return Response.json({ ok: true, ...result });
  } catch (err: any) {
    const msg = String(err?.message ?? '');
    if (msg === 'not_found') return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404 });
    if (msg === 'owner_cannot_leave') return new Response(JSON.stringify({ error: 'Owner cannot leave. Delete the room or transfer ownership first.', code: 'owner_cannot_leave' }), { status: 403 });
    console.error('POST /api/chat/rooms/[roomId]/leave error:', err);
    return serverError(err?.message || 'Failed to leave');
  }
}