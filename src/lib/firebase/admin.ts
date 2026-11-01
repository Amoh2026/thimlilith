import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

function initApp(): App {
  const existingApps = getApps();
  if (existingApps.length > 0) return existingApps[0];

  const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
  
  if (!base64Key) {
    console.error('❌ [Firebase Admin] FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 is missing!');
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY_BASE64');
  }

  try {
    // 🚨 THE ULTIMATE CLEANER: Strip everything that isn't a valid Base64 character
    const cleanBase64 = base64Key.replace(/[^A-Za-z0-9+/=]/g, '');
    
    let decoded = Buffer.from(cleanBase64, 'base64').toString('utf8');
    decoded = decoded.replace(/^\uFEFF/, ''); // Remove BOM if present
    
    const serviceAccount = JSON.parse(decoded);

    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n').trim();
    }

    console.log(`✅ [Firebase Admin] Initializing. Project: ${serviceAccount.project_id}`);
    console.log(`🔑 Key Length: ${serviceAccount.private_key?.length} chars`);

    return initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error: any) {
    console.error('❌ [Firebase Admin] Failed to parse Base64 JSON:', error.message);
    throw new Error('Failed to parse Base64 JSON');
  }
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