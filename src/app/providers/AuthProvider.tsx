import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import React from "react";
import { auth } from "../../lib/firebaseAuth";
import { getIsAdminRole } from "../../lib/authz";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = React.createContext<AuthCtx>({
  user: null,
  loading: true,
  isAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    if (!user) {
      setIsAdmin(false);
      return;
    }

    (async () => {
      try {
        const admin = await getIsAdminRole(user.uid);
        if (!cancelled) {
          setIsAdmin(admin);
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const value = React.useMemo(
    () => ({ user, loading, isAdmin }),
    [user, loading, isAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return React.useContext(AuthContext);
}
