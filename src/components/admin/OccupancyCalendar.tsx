import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import type { Matcher } from "react-day-picker";
import { de } from "date-fns/locale";
import { listBlockedNights, listApprovedBookings, cancelBooking } from "../../lib/db";
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
      await cancelBooking(b);
      // Nach Stornierung Liste aktualisieren
      const approved = await listApprovedBookings(propertyId, range.fromISO, range.toISO);
      setBookings(approved);
      // Blockierte Nächte neu laden
      const nights = await listBlockedNights(propertyId, range.fromISO, range.toISO);
      setBlocked(nights.map((d) => new Date(d + "T00:00:00")));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Fehler beim Stornieren");
    }
  }

  // Markierungen für DayPicker
  const disabled: Matcher[] = blocked; // belegte Nächte nicht anklickbar
  const modifiers = {
    occupied: blocked,
  } as const;

  // Buchungen für ausgewählten Tag
  const dayISO = selectedDay ? toISO(selectedDay) : null;
  const dayBookings = useMemo(() => {
    if (!dayISO) return [] as (Booking & { id: string })[];
    return bookings.filter((b) => inRange(dayISO, b.startDate, b.endDate));
  }, [bookings, dayISO]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Belegungskalender</h3>
          {loading && <span className="text-sm text-slate-500">Laden …</span>}
        </div>
        {error && <p className="mb-2 text-sm text-red-700">{error}</p>}
        <DayPicker
          locale={de}
          month={month}
          onMonthChange={setMonth}
          numberOfMonths={2}
          mode="single"
          selected={selectedDay}
          onSelect={setSelectedDay}
          disabled={disabled}
          modifiers={modifiers}
          modifiersClassNames={{ occupied: "bg-slate-300 text-slate-700" }}
          fromDate={new Date()}
        />
        <div className="mt-2 text-xs text-slate-600">
          <span className="inline-block h-3 w-3 rounded bg-slate-300 align-middle"></span>
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
                    onClick={() => handleCancel(b)}
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
    </div>
  );
}
