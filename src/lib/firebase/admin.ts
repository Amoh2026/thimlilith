import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

function initApp(): App {
  const existingApps = getApps();
  if (existingApps.length > 0) return existingApps[0];

  const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
  
  if (base64Key) {
    try {
      // 1. Strip ALL whitespace, hidden newlines, and quotes from the Base64 string
      const cleanBase64 = base64Key.replace(/["'\s\n\r]/g, '');
      
      // 2. Decode to string and remove any BOM (Byte Order Mark) Windows might have added
      let decoded = Buffer.from(cleanBase64, 'base64').toString('utf8');
      decoded = decoded.replace(/^\uFEFF/, ''); // Remove BOM
      
      // 3. Parse JSON
      const serviceAccount = JSON.parse(decoded);

      // 4. Force perfect PEM formatting for the private key
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n').trim();
      }

      // Debug log to see exactly what we are sending (First 30 and Last 30 chars)
      const pk = serviceAccount.private_key || '';
      console.log(`✅ [Firebase Admin] Project: ${serviceAccount.project_id}`);
      console.log(`🔑 Key Start: ${pk.substring(0, 30)}...`);
      console.log(`🔑 Key End: ...${pk.substring(pk.length - 30)}`);

      return initializeApp({
        credential: cert(serviceAccount),
      });
    } catch (error: any) {
      console.error('❌ [Firebase Admin] Failed to parse Base64 JSON:', error.message);
    }
  }

  // Fallback to separate variables (shouldn't be needed if Base64 is working)
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawKey) {
    throw new Error('Missing Firebase Admin env vars');
  }

  console.log(`✅ [Firebase Admin] Initializing with separate vars.`);
  const privateKey = rawKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');

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