import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { useT } from "../i18n/useLanguage";

const Home = lazy(() => import("../pages/Home"));
const Gallery = lazy(() => import("../pages/Gallery"));
const Prices = lazy(() => import("../pages/Prices"));
const Booking = lazy(() => import("../pages/Booking"));
const AdminDashboard = lazy(() => import("../pages/AdminDashboard"));
const Login = lazy(() => import("../pages/Login"));
const AuthProviderGate = lazy(() => import("../components/admin/auth/AuthProviderGate"));
const RequireAdmin = lazy(() => import("../components/admin/auth/RequireAdmin"));
const Imprint = lazy(() => import("../pages/Imprint"));
const Privacy = lazy(() => import("../pages/Privacy"));

function RouteLoading() {
  const t = useT();
  return <div className="p-4 text-slate-600">{t("routes.loading")}</div>;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/prices" element={<Prices />} />
        <Route path="/book" element={<Booking />} />
        <Route path="/impressum" element={<Imprint />} />
        <Route path="/datenschutz" element={<Privacy />} />
        <Route element={<AuthProviderGate />}>
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<Login />} />
          {/* Admin guard wrapper */}
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
export default AppRoutes;
