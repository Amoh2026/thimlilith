import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

function initApp(): App {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0];
  }

  // Attempt to load credentials from the single JSON string variable first
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  let credential;

  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      credential = cert(serviceAccount);
      console.log('✅ [Firebase Admin] Initializing with JSON string credentials.');
    } catch (e) {
      console.error('❌ [Firebase Admin] Failed to parse JSON string credentials:', e);
      throw new Error('Could not parse FIREBASE_SERVICE_ACCOUNT_JSON');
    }
  } else {
    // Fallback to separate variables (less reliable on Vercel)
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKeyRaw) {
      console.error('❌ [Firebase Admin] Missing credentials environment variables.');
      throw new Error('Missing Firebase Admin env vars');
    }

    // Correctly format the private key from a string
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
    credential = cert({ projectId, clientEmail, privateKey });
    console.log('✅ [Firebase Admin] Initializing with separate env variable credentials.');
  }

  return initializeApp({ credential });
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