import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../app/providers/AuthProvider';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <div className="p-4">Laden…</div>;
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />;
  return <>{children}</>;
}