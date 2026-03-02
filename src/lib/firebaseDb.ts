import {
  connectFirestoreEmulator,
  initializeFirestore,
  setLogLevel,
  type FirestoreSettings,
} from "firebase/firestore";
import { app } from "./firebaseApp";

// Long polling can be significantly slower. Keep it opt-in via ENV for edge networks only.
const forceLongPolling = import.meta.env.VITE_FIRESTORE_FORCE_LONG_POLLING === "1";
const firestoreSettings: FirestoreSettings = {
  ignoreUndefinedProperties: true,
  ...(forceLongPolling ? { experimentalForceLongPolling: true } : {}),
};

// Optional verbose Firestore logging for diagnosing permission issues
if (import.meta.env.VITE_FIRESTORE_DEBUG === "1") {
  try {
    setLogLevel("debug");
    console.info("[FS DEBUG] Firestore log level: debug");
  } catch (e) {
    console.warn("[FS DEBUG] setLogLevel failed:", e);
  }
}

export const db = initializeFirestore(app, firestoreSettings);

// Connect to emulator only in dev when explicitly enabled
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === "1") {
  try {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    console.info("[EMU] Firestore → 127.0.0.1:8080");
  } catch (e) {
    console.warn("[EMU] Firestore emulator connect failed:", e);
  }
}
