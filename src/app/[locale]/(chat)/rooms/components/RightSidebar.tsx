"use client";

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface Member {
  id: string;
  name: string;
  email?: string;
  photoURL?: string | null;
  isOnline: boolean;
  status?: string;
}

interface Props {
  activeRoom: any;
  user: User;
  userDoc: any;
  onKick?: (uid: string, name: string) => void;
  onPromote?: (uid: string) => void;
  onDemote?: (uid: string) => void;
  onClose?: () => void;
}

export function RightSidebar({
  activeRoom,
  user,
  userDoc,
  onKick,
  onPromote,
  onDemote,
  onClose,
}: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMenuFor, setActionMenuFor] = useState<string | null>(null);

  const isOwner = activeRoom?.createdBy === user?.uid;
  const isMod =
    isOwner ||
    (activeRoom?.moderators || []).includes(user?.uid);

  useEffect(() => {
    if (!activeRoom) {
      setMembers([]);
      return;
    }
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const memberUids: string[] = activeRoom.members || [];
      const names: Record<string, string> = activeRoom.memberNames || {};

      const results = await Promise.all(
        memberUids.map(async (uid): Promise<Member> => {
          try {
            const snap = await getDoc(doc(db, "users", uid));
            if (snap.exists()) {
              const d = snap.data();
              return {
                id: uid,
                name: names[uid] || d.name || "Member",
                email: d.email,
                photoURL: d.photoURL,
                isOnline: d.isOnline === true,
                status: d.status || "active",
              };
            }
          } catch {}
          return {
            id: uid,
            name: names[uid] || "Member",
            isOnline: false,
            status: "active",
          };
        })
      );

      if (!cancelled) {
        // Sort: online first, then owner, then alphabetical
        results.sort((a, b) => {
          if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
          if (a.id === activeRoom.createdBy) return -1;
          if (b.id === activeRoom.createdBy) return 1;
          return a.name.localeCompare(b.name);
        });
        setMembers(results);
        setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [activeRoom?.id, activeRoom?.members, activeRoom?.memberNames, activeRoom?.createdBy]);

  if (!activeRoom) return null;

  const onlineMembers = members.filter((m) => m.isOnline);
  const offlineMembers = members.filter((m) => !m.isOnline);

  const initials = (name: string) =>
    name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const renderMember = (m: Member) => {
    const isMemberOwner = m.id === activeRoom.createdBy;
    const isMemberMod = (activeRoom.moderators || []).includes(m.id);
    const isSelf = m.id === user.uid;
    const canKick = isOwner && !isSelf && !isMemberOwner;
    const canPromote = isOwner && !isSelf && !isMemberOwner && !isMemberMod;
    const canDemote = isOwner && isMemberMod;
    const hasActions = canKick || canPromote || canDemote;

    return (
      <div
        key={m.id}
        className="relative flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/40 transition group"
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {m.photoURL ? (
            <img
              src={m.photoURL}
              alt={m.name}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">
              {initials(m.name)}
            </div>
          )}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0f172a] ${
              m.isOnline ? "bg-green-500" : "bg-gray-500"
            }`}
          />
        </div>

        {/* Name + role */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-white truncate">{m.name}</span>
            {isMemberOwner && (
              <span title="Owner" className="text-yellow-400 text-xs">👑</span>
            )}
            {isMemberMod && !isMemberOwner && (
              <span title="Moderator" className="text-teal-400 text-xs">🛡️</span>
            )}
            {isSelf && (
              <span className="text-[10px] text-gray-500 uppercase">(you)</span>
            )}
          </div>
          {m.status === "muted" && (
            <span className="text-[10px] text-yellow-500">muted</span>
          )}
          {m.status === "banned" && (
            <span className="text-[10px] text-red-500">banned</span>
          )}
        </div>

        {/* Actions menu */}
        {hasActions && (
          <div className="relative">
            <button
              onClick={() =>
                setActionMenuFor(actionMenuFor === m.id ? null : m.id)
              }
              className="opacity-0 group-hover:opacity-100 transition text-gray-400 hover:text-white px-1"
              aria-label="Member actions"
            >
              ⋯
            </button>
            {actionMenuFor === m.id && (
              <div className="absolute right-0 top-full mt-1 bg-[#1e293b] border border-slate-700 rounded-lg shadow-xl z-20 min-w-[140px] py-1">
                {canPromote && onPromote && (
                  <button
                    onClick={() => {
                      onPromote(m.id);
                      setActionMenuFor(null);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-slate-700"
                  >
                    🛡️ Promote to Mod
                  </button>
                )}
                {canDemote && onDemote && (
                  <button
                    onClick={() => {
                      onDemote(m.id);
                      setActionMenuFor(null);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-slate-700"
                  >
                    Remove Mod
                  </button>
                )}
                {canKick && onKick && (
                  <button
                    onClick={() => {
                      onKick(m.id, m.name);
                      setActionMenuFor(null);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-slate-700"
                  >
                    🚫 Kick
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="hidden md:flex w-64 bg-[#0f172a] border-l border-slate-800 flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <h3 className="text-sm font-bold text-white">
          Members{" "}
          <span className="text-gray-400 font-normal">
            ({members.length})
          </span>
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg leading-none"
            aria-label="Close members"
          >
            ×
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading && members.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            Loading members...
          </div>
        ) : members.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            No members yet
          </div>
        ) : (
          <>
            {onlineMembers.length > 0 && (
              <>
                <div className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase text-gray-500 tracking-wide">
                  Online — {onlineMembers.length}
                </div>
                {onlineMembers.map(renderMember)}
              </>
            )}
            {offlineMembers.length > 0 && (
              <>
                <div className="px-4 pt-4 pb-1 text-[10px] font-bold uppercase text-gray-500 tracking-wide">
                  Offline — {offlineMembers.length}
                </div>
                {offlineMembers.map(renderMember)}
              </>
            )}
          </>
        )}
      </div>

      {/* Footer — quick actions for owner */}
      {isOwner && activeRoom.inviteCode && (
        <div className="px-3 py-2 border-t border-slate-800">
          <button
            onClick={() => {
              const url = `${window.location.origin}/en/join/${activeRoom.inviteCode}`;
              navigator.clipboard.writeText(url);
              alert(`Invite link copied:\n\n${url}`);
            }}
            className="w-full text-xs bg-slate-800 hover:bg-slate-700 text-teal-400 py-1.5 rounded-lg"
          >
            📎 Copy invite link
          </button>
        </div>
      )}
    </div>
  );
}