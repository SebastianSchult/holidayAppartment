import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import PropertyForm from "../components/admin/PropertyForm";
import SeasonsTable from "../components/admin/SeasonsTable";
import TaxesTable from "../components/admin/TaxesTable";
import { getFirstProperty } from "../lib/db";
import BookingsTable from "../components/admin/BookingsTable";
import { cancelBooking } from "../lib/db";
import OccupancyCalendar from "../components/admin/OccupancyCalendar";

type TabKey = "property" | "seasons" | "taxes" | "bookings" | "calendar";

const ADMIN_TABS: ReadonlyArray<{ key: TabKey; label: string }> = [
  { key: "property", label: "Stammdaten" },
  { key: "seasons", label: "Saisonpreise" },
  { key: "taxes", label: "Kurtaxe" },
  { key: "bookings", label: "Anfragen" },
  { key: "calendar", label: "Kalender" },
];

function tabId(key: TabKey): string {
  return `admin-tab-${key}`;
}

function panelId(key: TabKey): string {
  return `admin-panel-${key}`;
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<TabKey>("property");
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    property: null,
    seasons: null,
    taxes: null,
    bookings: null,
    calendar: null,
  });

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

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, key: TabKey) {
    const currentIndex = ADMIN_TABS.findIndex((tabItem) => tabItem.key === key);
    if (currentIndex < 0) return;

    let nextIndex = currentIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % ADMIN_TABS.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + ADMIN_TABS.length) % ADMIN_TABS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = ADMIN_TABS.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextTab = ADMIN_TABS[nextIndex].key;
    setTab(nextTab);
    requestAnimationFrame(() => {
      tabRefs.current[nextTab]?.focus();
    });
  }

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
      <div role="tablist" aria-label="Admin Bereiche" className="flex flex-wrap gap-2">
        {ADMIN_TABS.map((tabItem) => {
          const isActive = tab === tabItem.key;
          return (
            <button
              key={tabItem.key}
              ref={(element) => {
                tabRefs.current[tabItem.key] = element;
              }}
              id={tabId(tabItem.key)}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={panelId(tabItem.key)}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setTab(tabItem.key)}
              onKeyDown={(event) => handleTabKeyDown(event, tabItem.key)}
              className={[
                "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
                isActive
                  ? "bg-[color:var(--ocean,#0e7490)] text-white"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
              ].join(" ")}
            >
              {tabItem.label}
            </button>
          );
        })}
      </div>

      {/* Panels */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <section
          id={panelId("property")}
          role="tabpanel"
          aria-labelledby={tabId("property")}
          hidden={tab !== "property"}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold">Stammdaten der Ferienwohnung</h2>
          <PropertyForm />
        </section>

        <section
          id={panelId("seasons")}
          role="tabpanel"
          aria-labelledby={tabId("seasons")}
          hidden={tab !== "seasons"}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold">Saisonpreise verwalten</h2>
          {loading ? (
            <p className="text-slate-600">Laden…</p>
          ) : propertyId ? (
            <SeasonsTable propertyId={propertyId} />
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
              Bitte lege zuerst unter <strong>Stammdaten</strong> eine Unterkunft
              an. Danach kannst du hier Saisonpreise erfassen.
            </div>
          )}
        </section>

        <section
          id={panelId("taxes")}
          role="tabpanel"
          aria-labelledby={tabId("taxes")}
          hidden={tab !== "taxes"}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold">Kurtaxe verwalten</h2>
          {loading ? (
            <p className="text-slate-600">Laden…</p>
          ) : propertyId ? (
            <TaxesTable propertyId={propertyId} />
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
              Bitte lege zuerst unter <strong>Stammdaten</strong> eine Unterkunft
              an. Danach kannst du hier Kurtaxe-Bänder erfassen.
            </div>
          )}
        </section>

        <section
          id={panelId("bookings")}
          role="tabpanel"
          aria-labelledby={tabId("bookings")}
          hidden={tab !== "bookings"}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold">Buchungsanfragen</h2>
          {loading ? (
            <p className="text-slate-600">Laden…</p>
          ) : propertyId ? (
            <BookingsTable propertyId={propertyId} onCancel={cancelBooking} />
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
              Bitte lege zuerst unter <strong>Stammdaten</strong> eine Unterkunft
              an. Danach kannst du hier Anfragen verwalten.
            </div>
          )}
        </section>

        <section
          id={panelId("calendar")}
          role="tabpanel"
          aria-labelledby={tabId("calendar")}
          hidden={tab !== "calendar"}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold">Kalender</h2>
          {loading ? (
            <p className="text-slate-600">Laden…</p>
          ) : propertyId ? (
            <OccupancyCalendar propertyId={propertyId} />
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
              Bitte lege zuerst unter <strong>Stammdaten</strong> eine Unterkunft
              an. Danach kannst du hier den Belegungskalender nutzen.
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
