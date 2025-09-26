import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import type { Matcher } from "react-day-picker";
import { de } from "date-fns/locale";
import { listBlockedNights, listApprovedBookings, cancelBooking, approveBooking, clearInventoryRange, rebuildInventoryFromApproved } from "../../lib/db";
import type { Booking } from "../../lib/schemas";

interface Props {
  propertyId: string;
}

// Hilfsfunktionen
function firstDayOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}
function toISO(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function inRange(iso: string, startISO: string, endISO: string) {
  return iso >= startISO && iso < endISO; // Nacht gehört zur Anreisetag 00:00 bis Abreisetag 00:00
}

export default function OccupancyCalendar({ propertyId }: Props) {
  const [month, setMonth] = useState<Date>(firstDayOfMonth(new Date()));
  const [blocked, setBlocked] = useState<Date[]>([]);
  const [bookings, setBookings] = useState<(Booking & { id: string })[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Toast/Notice
  const [notice, setNotice] = useState<null | { type: "success" | "error"; text: string; actionText?: string; onAction?: () => void }>(null);
  function flash(type: "success" | "error", text: string, actionText?: string, onAction?: () => void) {
    setNotice({ type, text, actionText, onAction });
    setTimeout(() => setNotice(null), 3000);
  }

  function mailSuffix(res?: { ok: boolean; detail?: string } | null) {
    if (!res) return "";
    return res.ok ? " (Mail ok)" : ` (Mail-Problem: ${res.detail ?? "unbekannt"})`;
  }

  // Confirm modal
  const [confirmState, setConfirmState] = useState<null | { booking: Booking & { id: string } }>(null);

  // Sichtbereich: aktueller Monat + nächster Monat (2 Monate Ansicht)
  const range = useMemo(() => {
    const from = firstDayOfMonth(month);
    const to = addMonths(from, 2);
    return { fromISO: toISO(from), toISO: toISO(to) };
  }, [month]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        // Blockierte Nächte laden
        const nights = await listBlockedNights(propertyId, range.fromISO, range.toISO);
        if (!alive) return;
        setBlocked(nights.map((d) => new Date(d + "T00:00:00")));
        // Nur bestätigte Buchungen laden
        const approved = await listApprovedBookings(propertyId, range.fromISO, range.toISO);
        if (!alive) return;
        setBookings(approved);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Kalenderdaten konnten nicht geladen werden.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [propertyId, range.fromISO, range.toISO]);

  async function handleCancel(b: Booking & { id: string }) {
    try {
      const mailRes = await cancelBooking(b);
      const approved = await listApprovedBookings(propertyId, range.fromISO, range.toISO);
      setBookings(approved);
      const nights = await listBlockedNights(propertyId, range.fromISO, range.toISO);
      setBlocked(nights.map((d) => new Date(d + "T00:00:00")));
      flash("success", "Buchung storniert." + mailSuffix(mailRes), "Rückgängig", async () => {
        try {
          const res = await approveBooking(b);
          const approved2 = await listApprovedBookings(propertyId, range.fromISO, range.toISO);
          setBookings(approved2);
          const nights2 = await listBlockedNights(propertyId, range.fromISO, range.toISO);
          setBlocked(nights2.map((d) => new Date(d + "T00:00:00")));
          if (res && !res.ok) {
            flash("error", `Rückgängig: Mail-Problem: ${res.detail ?? "unbekannt"}`);
          }
        } catch (e) {
          flash("error", e instanceof Error ? e.message : "Rückgängig fehlgeschlagen.");
        }
      });
    } catch (e) {
      flash("error", e instanceof Error ? e.message : "Fehler beim Stornieren");
    }
  }

  // Markierungen für DayPicker
  const disabled: Matcher[] = []; // nichts deaktivieren – Admin soll alles sehen/anklicken können
  const modifiers = {
    occupied: blocked,
  } as const;

  // Buchungen für ausgewählten Tag
  const dayISO = selectedDay ? toISO(selectedDay) : null;
  const dayBookings = useMemo(() => {
    if (!dayISO) return [] as (Booking & { id: string })[];
    return bookings.filter((b) => inRange(dayISO, b.startDate, b.endDate));
  }, [bookings, dayISO]);

  async function refreshBlocked() {
    const nights = await listBlockedNights(propertyId, range.fromISO, range.toISO);
    setBlocked(nights.map((d) => new Date(d + "T00:00:00")));
  }

  async function onClearMonth() {
    try {
      const from = firstDayOfMonth(month);
      const to = firstDayOfMonth(addMonths(month, 1));
      await clearInventoryRange(propertyId, toISO(from), toISO(to));
      await refreshBlocked();
      flash("success", "Inventar bereinigt (aktueller Monat).");
    } catch (e) {
      flash("error", e instanceof Error ? e.message : "Bereinigung fehlgeschlagen.");
    }
  }

  async function onRebuildMonth() {
    try {
      const from = firstDayOfMonth(month);
      const to = firstDayOfMonth(addMonths(month, 1));
      await rebuildInventoryFromApproved(propertyId, toISO(from), toISO(to));
      await refreshBlocked();
      flash("success", "Inventar neu aufgebaut (aus bestätigten Buchungen).");
    } catch (e) {
      flash("error", e instanceof Error ? e.message : "Neuaufbau fehlgeschlagen.");
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Belegungskalender</h3>
          <div className="flex items-center gap-2">
            {loading && <span className="text-sm text-slate-500 mr-2">Laden …</span>}
            <button
              onClick={onClearMonth}
              className="rounded border border-slate-300 px-3 py-1.5 text-xs md:text-sm text-slate-700 hover:bg-slate-50"
              title="Löscht alle 'nights' im sichtbaren Monat"
            >
              Inventar: Monat bereinigen
            </button>
            <button
              onClick={onRebuildMonth}
              className="rounded border border-slate-300 px-3 py-1.5 text-xs md:text-sm text-slate-700 hover:bg-slate-50"
              title="Bereinigt und baut die Nächte aus bestätigten Buchungen neu auf"
            >
              Inventar: Monat neu aufbauen
            </button>
          </div>
        </div>
        {error && <p className="mb-2 text-sm text-red-700">{error}</p>}
        <DayPicker
          locale={de}
          month={month}
          onMonthChange={setMonth}
          numberOfMonths={2}
          showOutsideDays
          mode="single"
          selected={selectedDay}
          onSelect={setSelectedDay}
          disabled={disabled}
          modifiers={modifiers}
          modifiersStyles={{
            occupied: {
              backgroundColor: '#BBF7D0', // tailwind bg-green-200
              color: '#14532D',           // tailwind text-green-900
              boxShadow: 'inset 0 0 0 1px #86EFAC', // ring-green-300
            },
          }}
        />
        <div className="mt-2 text-xs text-slate-600">
          <span className="inline-block h-3 w-3 rounded align-middle" style={{ backgroundColor: '#BBF7D0', boxShadow: 'inset 0 0 0 1px #86EFAC' }}></span>
          <span className="ml-2 align-middle">belegt</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold">{selectedDay ? new Date(selectedDay).toLocaleDateString("de-DE") : "Details"}</h3>
        {!selectedDay ? (
          <p className="mt-2 text-slate-600">Bitte klicke einen Tag im Kalender an.</p>
        ) : dayBookings.length === 0 ? (
          <p className="mt-2 text-green-700">Keine bestätigte Buchung an diesem Tag.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {dayBookings.map((b) => (
              <li key={b.id} className="rounded border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">{b.contact?.name || "Gast"}</div>
                    <div className="text-xs text-slate-600">{b.contact?.email}</div>
                  </div>
                  <div className="text-sm text-slate-700">
                    {new Date(b.startDate + "T00:00:00").toLocaleDateString("de-DE")} – {new Date(b.endDate + "T00:00:00").toLocaleDateString("de-DE")}
                  </div>
                </div>
                {b.message && (
                  <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{b.message}</p>
                )}
                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setConfirmState({ booking: b })}
                    className="rounded bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
                  >
                    Stornieren
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {confirmState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-lg">
            <h4 className="text-lg font-semibold">Buchung stornieren</h4>
            <p className="mt-2 text-sm text-slate-700">Möchtest du diese Buchung wirklich stornieren?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmState(null)}
                className="rounded border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
              >
                Abbrechen
              </button>
              <button
                onClick={() => { const b = confirmState.booking; setConfirmState(null); handleCancel(b); }}
                className="rounded bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
              >
                Ja, stornieren
              </button>
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div
          className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg px-4 py-2 shadow-lg text-white"
          style={{ backgroundColor: notice.type === 'success' ? '#16a34a' : '#dc2626' }}
        >
          <span>{notice.text}</span>
          {notice.actionText && notice.onAction && (
            <button
              onClick={() => {
                const fn = notice.onAction;
                setNotice(null);
                if (fn) {
                  fn();
                }
              }}
              className="rounded bg-white/20 px-2 py-1 text-sm hover:bg-white/30"
            >
              {notice.actionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
