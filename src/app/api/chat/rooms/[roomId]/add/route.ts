// ============================================================
// /api/chat/rooms/[roomId]/add  (POST)
// ============================================================
// Owner-only. Adds a user directly to members[] (skips pendingRequests).
// Used by the "Add Member" modal — replaces the direct Firestore write.
//
// Body: { userId: string }
// ============================================================

import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import {
  verifyChatUser,
  unauthorized,
  badRequest,
  serverError,
} from '@/lib/chat/auth-server';
import { MAX_ROOM_MEMBERS } from '@/types/chat';

type Params = { params: Promise<{ roomId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await verifyChatUser(req);
  if (!user) return unauthorized();

  try {
    const { roomId } = await params;
    const body = await req.json();
    const targetUserId = String(body?.userId ?? '').trim();
    if (!targetUserId) return badRequest('userId required');
    if (targetUserId === user.uid) return badRequest('Cannot add yourself');

    const db = adminDb();
    const roomRef = db.collection('rooms').doc(roomId);
    const targetUserRef = db.collection('users').doc(targetUserId);

    const result = await db.runTransaction(async (tx) => {
      const [roomSnap, userSnap] = await Promise.all([
        tx.get(roomRef),
        tx.get(targetUserRef),
      ]);

      if (!roomSnap.exists) throw new Error('room_not_found');
      if (!userSnap.exists) throw new Error('user_not_found');

      const room = roomSnap.data()!;
      const targetData = userSnap.data()!;

      // Only owner can add members (future: allow admins too)
      if (room.createdBy !== user.uid) throw new Error('not_owner');

      const members: string[] = room.members ?? [];

      if (members.includes(targetUserId)) {
        return { alreadyMember: true };
      }

      const max = Number(room.maxMembers ?? MAX_ROOM_MEMBERS);
      if (members.length >= max) throw new Error('room_full');

      const targetName =
        targetData.name || targetData.email?.split('@')[0] || 'Member';

      tx.update(roomRef, {
        members: [...members, targetUserId],
        [`memberNames.${targetUserId}`]: targetName,
        memberCount: members.length + 1,
      });

      return { added: true, name: targetName };
    });

    return Response.json({ ok: true, ...result });
  } catch (err: any) {
    const msg = String(err?.message ?? '');
    if (msg === 'room_not_found') return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404 });
    if (msg === 'user_not_found') return new Response(JSON.stringify({ error: 'Target user not found' }), { status: 404 });
    if (msg === 'not_owner') return new Response(JSON.stringify({ error: 'Only owner can add members' }), { status: 403 });
    if (msg === 'room_full') return new Response(JSON.stringify({ error: 'Room is full' }), { status: 409 });
    console.error('POST /api/chat/rooms/[roomId]/add error:', err);
    return serverError(err?.message || 'Failed to add member');
  }
}