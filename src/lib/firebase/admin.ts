import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

function initApp(): App {
  const existingApps = getApps();
  if (existingApps.length > 0) return existingApps[0];

  // 1. We are now looking for the Plain JSON variable
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  
  if (!serviceAccountJson) {
    console.error('❌ [Firebase Admin] FIREBASE_SERVICE_ACCOUNT_JSON is missing!');
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON');
  }

  try {
    // 🚨 DEBUG: Print the exact first 10 characters to see hidden spaces/newlines
    console.log(`🔍 [Debug] Raw String Start: [${serviceAccountJson.substring(0, 10)}]`);
    
    // Clean up any hidden newlines at the start/end just in case
    const cleanJson = serviceAccountJson.trim();
    
    const serviceAccount = JSON.parse(cleanJson);

    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    console.log(`✅ [Firebase Admin] Initializing with Plain JSON. Project: ${serviceAccount.project_id}`);

    return initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error: any) {
    console.error('❌ [Firebase Admin] Failed to parse JSON:', error.message);
    throw new Error('Failed to parse JSON');
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