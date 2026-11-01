import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

function initApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0];

  // 1. Try using the full JSON string (Recommended for Vercel)
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      console.log(`✅ [Firebase Admin] Initializing with Service Account JSON for project: ${serviceAccount.project_id}`);
      return initializeApp({
        credential: cert(serviceAccount),
      });
    } catch (error) {
      console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error);
    }
  }

  // 2. Fallback to separate variables (for local development)
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawKey) {
    console.error('❌ [Firebase Admin] Missing env vars.');
    throw new Error('Missing Firebase Admin env vars');
  }

  console.log(`✅ [Firebase Admin] Initializing with separate vars for project: ${projectId}`);
  const privateKey = rawKey
    .replace(/^"|"$/g, '')
    .replace(/\\n/g, '\n');

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