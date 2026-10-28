export const MAX_ROOM_MEMBERS = 15;
export const ALLOWED_MAX_MEMBERS = [5, 10, 15, 20, 50];
export const MAX_REQUEST_MESSAGE_LENGTH = 200;
export const SESSION_STALE_MS = 5 * 60 * 1000;
export const MAX_SHARED_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_MESSAGE_LENGTH = 2000;
export const SESSION_HEARTBEAT_MS = 30000;

export type SharedDocKind = 'pdf' | 'image' | 'video' | 'embed' | 'download';
export type SharedDocSource = 'upload' | 'drive' | 'dropbox' | 'youtube' | 'link';
export type PresenceState = 'online' | 'offline' | 'away';

export interface ChatMessage { id: string; roomId: string; text: string; [key: string]: any; }
export interface ChatRoom { id: string; name: string; members: string[]; [key: string]: any; }
export interface ChatMessageInput { text: string; type?: string; [key: string]: any; }
export interface ChatPresence { docId: string; userId: string; userName: string; roomId: string; state: PresenceState; lastSeen: any; }

export const presenceDocId = (roomId: string, userId: string) => `${roomId}_${userId}`;
export const normalizeRoom = (room: any): ChatRoom => ({ ...room, members: room.members || [] });