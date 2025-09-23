import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Gallery from "../pages/Gallery";
import Prices from "../pages/Prices";
import Booking from "../pages/Booking";
import AdminDashboard from "../pages/AdminDashboard";
import Login from "../pages/Login";
import RequireAdmin from "../components/admin/auth/RequireAdmin";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/prices" element={<Prices />} />
      <Route path="/book" element={<Booking />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminDashboard />
          </RequireAdmin>
        }
      />
    </Routes>
  );
}
