import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import PropertyForm from "../components/admin/PropertyForm";
import SeasonsTable from "../components/admin/SeasonsTable";
import TaxesTable from "../components/admin/TaxesTable";
import { getFirstProperty } from "../lib/db";
import BookingsTable from "../components/admin/BookingsTable";
import { cancelBooking } from "../lib/db";
import OccupancyCalendar from "../components/admin/OccupancyCalendar";

export default function AdminDashboard() {
  const [tab, setTab] = useState<"property" | "seasons" | "taxes" | "bookings" | "calendar">(
    "property"
  );
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function handleLogout() {
    await signOut(auth);
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      const p = await getFirstProperty();
      setPropertyId(p?.id ?? null);
      setLoading(false);
    })();
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <button
          onClick={handleLogout}
          className="rounded-lg bg-gray-800 px-3 py-2 text-white hover:bg-gray-700"
        >
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          className={[
            "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium",
            tab === "property"
              ? "bg-[color:var(--ocean,#0e7490)] text-white"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
          ].join(" ")}
          onClick={() => setTab("property")}
        >
          Stammdaten
        </button>
        <button
          className={[
            "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium",
            tab === "seasons"
              ? "bg-[color:var(--ocean,#0e7490)] text-white"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
          ].join(" ")}
          onClick={() => setTab("seasons")}
        >
          Saisonpreise
        </button>
        <button
          className={[
            "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium",
            tab === "taxes"
              ? "bg-[color:var(--ocean,#0e7490)] text-white"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
          ].join(" ")}
          onClick={() => setTab("taxes")}
        >
          Kurtaxe
        </button>
        <button
          className={[
            "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium",
            tab === "bookings"
              ? "bg-[color:var(--ocean,#0e7490)] text-white"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
          ].join(" ")}
          onClick={() => setTab("bookings")}
        >
          Anfragen
        </button>
        <button
          className={[
            "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium",
            tab === "calendar"
              ? "bg-[color:var(--ocean,#0e7490)] text-white"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
          ].join(" ")}
          onClick={() => setTab("calendar")}
        >
          Kalender
        </button>
      </div>

      {/* Panels */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {tab === "property" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              Stammdaten der Ferienwohnung
            </h2>
            <PropertyForm />
          </div>
        )}

        {tab === "seasons" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Saisonpreise verwalten</h2>
            {loading ? (
              <p className="text-slate-600">Laden…</p>
            ) : propertyId ? (
              <SeasonsTable propertyId={propertyId} />
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                Bitte lege zuerst unter <strong>Stammdaten</strong> eine
                Unterkunft an. Danach kannst du hier Saisonpreise erfassen.
              </div>
            )}
          </div>
        )}
        {tab === "taxes" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Kurtaxe verwalten</h2>
            {loading ? (
              <p className="text-slate-600">Laden…</p>
            ) : propertyId ? (
              <TaxesTable propertyId={propertyId} />
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                Bitte lege zuerst unter <strong>Stammdaten</strong> eine
                Unterkunft an. Danach kannst du hier Kurtaxe-Bänder erfassen.
              </div>
            )}
          </div>
        )}
        {tab === "bookings" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Buchungsanfragen</h2>
            {loading ? (
              <p className="text-slate-600">Laden…</p>
            ) : propertyId ? (
              <BookingsTable propertyId={propertyId} onCancel={cancelBooking} />
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                Bitte lege zuerst unter <strong>Stammdaten</strong> eine
                Unterkunft an. Danach kannst du hier Anfragen verwalten.
              </div>
            )}
          </div>
        )}
        {tab === "calendar" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Kalender</h2>
            {loading ? (
              <p className="text-slate-600">Laden…</p>
            ) : propertyId ? (
              <OccupancyCalendar propertyId={propertyId} />
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                Bitte lege zuerst unter <strong>Stammdaten</strong> eine Unterkunft an. Danach kannst du hier den Belegungskalender nutzen.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
