import { connectFirestoreEmulator, getFirestore } from "firebase/firestore/lite";
import { app } from "./firebaseApp";

export const dbLite = getFirestore(app);

if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === "1") {
  try {
    connectFirestoreEmulator(dbLite, "127.0.0.1", 8080);
    console.info("[EMU] Firestore Lite → 127.0.0.1:8080");
  } catch (e) {
    console.warn("[EMU] Firestore Lite emulator connect failed:", e);
  }
}
