import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

function initApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0];

  // Support both naming conventions (with and without _ADMIN)
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawKey) {
    console.error('❌ [Firebase Admin] Missing env vars. Check Vercel settings.');
    throw new Error('Missing Firebase Admin env vars');
  }

  // 🚨 DEBUG LOG: This will show in Vercel Runtime Logs!
  console.log(`✅ [Firebase Admin] Initializing for project: ${projectId}`);

  // Clean up the private key in case Vercel added extra quotes or spaces
  const privateKey = rawKey
    .replace(/^"|"$/g, '') // Remove wrapping quotes
    .replace(/\\n/g, '\n'); // Convert literal \n to actual line breaks

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

let _db: Firestore | null = null;
let _auth: Auth | null = null;

export function adminDb(): Firestore {
  if (!_db) {
    initApp();
    _db = getFirestore();
  }
  return _db;
}

export function adminAuth(): Auth {
  if (!_auth) {
    initApp();
    _auth = getAuth();
  }
  return _auth;
}