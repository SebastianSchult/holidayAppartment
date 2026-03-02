import { Outlet } from "react-router-dom";
import { AuthProvider } from "../../../app/providers/AuthProvider";

export default function AuthProviderGate() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
