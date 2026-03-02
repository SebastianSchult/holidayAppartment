import { connectAuthEmulator, getAuth } from "firebase/auth";
import { app } from "./firebaseApp";

export const auth = getAuth(app);

if (
  import.meta.env.DEV &&
  import.meta.env.VITE_USE_EMULATORS === "1" &&
  import.meta.env.VITE_AUTH_EMULATOR === "1"
) {
  try {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    console.info("[EMU] Auth → 127.0.0.1:9099");
  } catch (e) {
    console.warn("[EMU] Auth emulator connect failed:", e);
  }
}
