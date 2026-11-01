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
    // Strip any invisible characters Vercel might have added
    const cleanBase64 = base64Key.replace(/[^A-Za-z0-9+/=]/g, '');
    
    // Decode
    let decoded = Buffer.from(cleanBase64, 'base64').toString('utf8');
    decoded = decoded.replace(/^\uFEFF/, ''); // Remove BOM
    
    console.log(`🔍 [Debug] Decoded String Start: [${decoded.substring(0, 10)}]`);

    // Parse the minified JSON
    const serviceAccount = JSON.parse(decoded);

    // Fix private key newlines
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    console.log(`✅ [Firebase Admin] Initializing with Minified Base64 JSON. Project: ${serviceAccount.project_id}`);

    return initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error: any) {
    console.error('❌ [Firebase Admin] Failed to parse:', error.message);
    throw new Error('Failed to parse credentials');
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