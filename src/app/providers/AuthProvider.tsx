import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import React from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

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
      setLoading(false);
    });
    return () => unsub();
  }, []);

  React.useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    const ref = doc(db, 'roles', user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data() as RoleDoc | undefined;
      setIsAdmin(!!(data && data.admin === true));
    }, () => setIsAdmin(false));
    return () => unsub();
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return React.useContext(AuthContext);
}