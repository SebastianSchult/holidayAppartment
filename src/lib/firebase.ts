import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import type { FirestoreSettings } from 'firebase/firestore';
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

export const db = initializeFirestore(app, firestoreSettings);

export const storage = getStorage(app);