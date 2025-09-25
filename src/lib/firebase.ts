import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { initializeFirestore, connectFirestoreEmulator, setLogLevel, type FirestoreSettings } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

if (!firebaseConfig.apiKey) {
  console.error('Firebase ENV Variablen fehlen. Prüfe .env.local (VITE_ Prefix) und starte den Dev-Server neu.');
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Force long polling everywhere to avoid WebChannel/CORS hiccups (esp. Safari)
const firestoreSettings: FirestoreSettings = {
  ignoreUndefinedProperties: true,
  experimentalForceLongPolling: true,
};

// Optional verbose Firestore logging for diagnosing permission issues
if (import.meta.env.VITE_FIRESTORE_DEBUG === '1') {
  try {
    setLogLevel('debug');
    console.info('[FS DEBUG] Firestore log level: debug');
  } catch (e) {
    console.warn('[FS DEBUG] setLogLevel failed:', e);
  }
}

export const db = initializeFirestore(app, firestoreSettings);

// Connect to emulators only in dev when explicitly enabled
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === '1') {
  try {
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    console.info('[EMU] Firestore → 127.0.0.1:8080');
  } catch (e) {
    console.warn('[EMU] Firestore emulator connect failed:', e);
  }
  // Optional: Auth emulator (enable via VITE_AUTH_EMULATOR=1)
  if (import.meta.env.VITE_AUTH_EMULATOR === '1') {
    try {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      console.info('[EMU] Auth → 127.0.0.1:9099');
    } catch (e) {
      console.warn('[EMU] Auth emulator connect failed:', e);
    }
  }
}

export const storage = getStorage(app);