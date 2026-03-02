import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import React from 'react';
import { auth } from '../../lib/firebaseAuth';
import { db } from '../../lib/firebaseDb';
import { doc, getDoc } from 'firebase/firestore';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
}

interface RoleDoc {
  admin?: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = React.createContext<AuthCtx>({ user: null, loading: true, isAdmin: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
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
        const snap = await getDoc(doc(db, 'roles', user.uid));
        if (cancelled) return;
        const data = snap.data() as RoleDoc | undefined;
        setIsAdmin(!!(data && data.admin === true));
      } catch {
        if (cancelled) return;
        setIsAdmin(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const ctxValue = React.useMemo(() => ({
    user,
    loading,
    isAdmin,
  }), [user, loading, isAdmin]);

  return (
    <AuthContext.Provider value={ctxValue}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return React.useContext(AuthContext);
}
