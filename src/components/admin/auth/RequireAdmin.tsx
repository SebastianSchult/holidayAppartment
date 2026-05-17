import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { hasAdminOrManagerAccess } from "../../../lib/authz";

export default function RequireAdmin() {
  const { user, loading } = useAuth();
  const location = useLocation();

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

      try {
        const allowed = await hasAdminOrManagerAccess(user);
        if (!cancelled) {
          setHasAccess(allowed);
          setChecking(false);
        }
      } catch {
        if (!cancelled) {
          setHasAccess(false);
          setChecking(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading || checking) {
    return <div style={{ padding: 16 }}>Lade...</div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  if (!hasAccess) {
    return (
      <div style={{ padding: 24, maxWidth: 720, margin: "40px auto", textAlign: "center" }}>
        <h2 style={{ marginBottom: 12 }}>Zugriff verweigert</h2>
        <p>Fur diesen Bereich benotigst du Administrator- oder Manager-Rechte.</p>
      </div>
    );
  }

  return <Outlet />;
}
