import { Navigate, useLocation } from "react-router-dom";
import React from "react";
import { useAuth } from "../../../app/providers/AuthProvider";

interface Props {
  children: React.ReactNode;
}

/**
 * Wrapper für Admin-Routen.
 * Zeigt während Laden einen Spinner, ansonsten entweder die Kinder oder „Access denied“.
 */
export default function RequireAdmin({ children }: Props) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-600">
        <svg
          className="animate-spin h-6 w-6 mr-2 text-[color:var(--ocean,#0e7490)]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          ></path>
        </svg>
        <span>Laden …</span>
      </div>
    );
  }

  // Nicht eingeloggt → Login mit Rücksprungziel
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Eingeloggt, aber kein Admin → Access denied
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64 text-red-700">
        Zugriff verweigert – keine Admin-Berechtigung
      </div>
    );
  }

  return <>{children}</>;
}