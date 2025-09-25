import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";// Pfad ggf. anpassen, falls anders
import { db } from "../../../lib/firebase"; // Pfad ggf. anpassen
import {
  collectionGroup,
  getDocs,
  limit,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";

/**
 * Lässt rein, wenn:
 *  - isAdmin == true   ODER
 *  - es ein Member-Dokument unter properties members/{uid} gibt (role = owner/manager)*/
export default function RequireAdmin() {
  const { user, loading } = useAuth();
  const loc = useLocation();

  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!user) {
        setHasAccess(false);
        setChecking(false);
        return;
      }

      // Token einmal hart refreshen, damit neue Claims (isAdmin) sicher drin sind
      try {
        await user.getIdToken(true);
      } catch {
        // ignore
      }

      // 1) Admin-Claim schnell prüfen
      const token = await user.getIdTokenResult();
      if (token.claims?.isAdmin === true) {
        if (!cancelled) {
          setHasAccess(true);
          setChecking(false);
        }
        return;
      }

      // 2a) Schneller Fallback zuerst: direkter Doc-Read unter properties/{DEFAULT_PROP}/members/{uid}
      try {
        const defaultPropId = (import.meta as unknown as { env: Record<string, string | undefined> }).env.VITE_DEFAULT_PROPERTY_ID;
        if (defaultPropId) {
          const ref = doc(db, "properties", defaultPropId, "members", user.uid);
          const ds = await getDoc(ref);
          if (!cancelled && ds.exists()) {
            console.debug("[RequireAdmin] direct member doc ✓ (uid under default property)");
            setHasAccess(true);
            setChecking(false);
            return;
          }
        }
      } catch (e) {
        console.warn("[RequireAdmin] direct member doc read failed", e);
      }

      // 2b) Fallback: members (collection group) per E-Mail
      try {
        const email = user.email ?? "";
        if (!email) {
          if (!cancelled) {
            setHasAccess(false);
            setChecking(false);
          }
          return;
        }
        console.debug("[RequireAdmin] cg members by email →", email);
        const q = query(
          collectionGroup(db, "members"),
          where("email", "==", email),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!cancelled && !snap.empty) {
          console.debug("[RequireAdmin] cg members by email ✓");
          setHasAccess(true); // mind. 1 Mitgliedschaft gefunden
          setChecking(false);
          return;
        }
        if (!cancelled) {
          console.debug("[RequireAdmin] cg members by email: none");
          setHasAccess(false);
          setChecking(false);
        }
      } catch (e) {
        console.warn("[RequireAdmin] membership check failed:", e);
        if (!cancelled) {
          setHasAccess(false);
          setChecking(false);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Auth noch nicht geladen
  if (loading || checking) {
    return <div style={{ padding: 16 }}>Lade…</div>;
  }

  // nicht eingeloggt → zum Login
  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: loc }} />;
  }

  // Kein Admin & keine Mitgliedschaft → Zugriff verweigert
  if (!hasAccess) {
    return (
      <div style={{ padding: 24, maxWidth: 720, margin: "40px auto", textAlign: "center" }}>
        <h2 style={{ marginBottom: 12 }}>Zugriff verweigert</h2>
        <p>Für diesen Bereich benötigst du Administrator- oder Manager-Rechte.</p>
      </div>
    );
  }

  // Zugriff ok → geschützte Inhalte rendern
  return <Outlet />;
}