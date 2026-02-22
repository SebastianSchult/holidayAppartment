// src/pages/Booking.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { listSeasons, listTaxBands, createBookingRequest, isRangeAvailable, listUnavailableNights } from "../lib/db";
import type { Property, Season, TouristTaxBand } from "../lib/schemas";
import { priceForStay, touristTaxForStay } from "../lib/pricing";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import { de } from "date-fns/locale";
import "react-day-picker/dist/style.css";

// Format a JS Date to YYYY-MM-DD in **local** time (no UTC shift)
function formatLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function Booking() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [propertyName, setPropertyName] = useState<string>("Ferienwohnung");
  const currency = "EUR" as const;
  const defaultRate = 0;
  const cleaningFee = 0;

  const [seasons, setSeasons] = useState<(Season & { id: string })[]>([]);
  const [taxBands, setTaxBands] = useState<(TouristTaxBand & { id: string })[]>([]);

  // Form-States
  const today = new Date();
  const plus3 = new Date(today.getTime() + 3 * 86400000);
  const [start, setStart] = useState<string>(formatLocalISO(today));
  const [end, setEnd] = useState<string>(formatLocalISO(plus3));
  const [adults, setAdults] = useState<number>(2); // Kurtaxe-pflichtig (≥16)
  const [children, setChildren] = useState<number>(0); // 0–15 Jahre, keine Kurtaxe

  const [range, setRange] = useState<DateRange | undefined>({
    from: today,
    to: plus3,
  });
  const [blocked, setBlocked] = useState<Date[]>([]);
  const [requestedDisabled, setRequestedDisabled] = useState<Date[]>([]);
  const MIN_NIGHTS = 2;

  // Kontaktfelder
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  // NEU: Anschrift
  const [street, setStreet] = useState<string>("");
  const [zip, setZip] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [country, setCountry] = useState<string>("Deutschland");

  // Submit-Status
  const [submitting, setSubmitting] = useState(false);

  // Toast notice state and timer
  type Notice = { type: "success" | "error"; text: string };
  const [notice, setNotice] = useState<Notice | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  function flash(n: Notice) {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setNotice(n);
    toastTimer.current = window.setTimeout(() => setNotice(null), 8000);
  }

  // Verfügbarkeits-Prüfung
  const [avail, setAvail] = useState<"idle" | "checking" | "available" | "unavailable">("idle");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        console.debug("[booking] init – start");
        const envId = (import.meta as unknown as { env: Record<string, string | undefined> }).env.VITE_DEFAULT_PROPERTY_ID;
        if (!envId) throw new Error("Konfiguration fehlt: VITE_DEFAULT_PROPERTY_ID.");

        setPropertyId(envId);
        setPropertyName("Antjes Ankerplatz");

        console.debug("[booking] listSeasons →", envId);
        const s = await listSeasons(envId);
        console.debug("[booking] listSeasons ✓", s.length);
        s.sort((a, b) => a.startDate.localeCompare(b.startDate));
        setSeasons(s);

        console.debug("[booking] listTaxBands →", envId);
        const t = await listTaxBands(envId);
        console.debug("[booking] listTaxBands ✓", t.length);
        t.sort((a, b) => (a.zone || "").localeCompare(b.zone || ""));
        setTaxBands(t);

        console.debug("[booking] init – done]");
      } catch (e) {
        console.error("[booking] init FAILED", e);
        setError(e instanceof Error ? e.message : "Daten konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (range?.from) setStart(formatLocalISO(range.from));
    if (range?.to) setEnd(formatLocalISO(range.to));
  }, [range]);

  useEffect(() => {
    (async () => {
      if (!propertyId) return;
      try {
        console.debug("[booking] listUnavailableNights →", propertyId);
        const fromISO = new Date().toISOString().slice(0, 10);
        const toISO = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10);
        const dates = await listUnavailableNights(propertyId, fromISO, toISO);
        console.debug("[booking] listUnavailableNights ✓", dates.length);
        // IMPORTANT: use local noon to avoid DST/UTC edge cases where the day shifts
        setBlocked(dates.map(d => new Date(d + "T12:00:00")));

        // Öffentliche Nutzer: keine zusätzlichen deaktivierten Tage (bereits in listUnavailableNights enthalten)
        setRequestedDisabled([]);
      } catch (e) {
        console.error("[booking] listUnavailableNights FAILED", e);
        setRequestedDisabled([]);
      }
    })();
  }, [propertyId]);

  const fmt = useMemo(() => new Intl.NumberFormat("de-DE", { style: "currency", currency }), [currency]);

  const calc = useMemo(() => {
    try {
      if (!propertyId) return null;
      const property: Property = {
        id: propertyId,
        name: propertyName,
        slug: "",
        address: {},
        maxGuests: 6,
        checkInHour: 15,
        checkOutHour: 10,
        currency,
        defaultNightlyRate: defaultRate,
        cleaningFee,
        createdAt: new Date(),
        updatedAt: new Date(),
        images: [],
        description: "",
      };

      const base = priceForStay(property, seasons, start, end);
      const tax = touristTaxForStay(taxBands, start, end, adults);
      const grandTotal = base.total + tax.total;
      return { base, tax, grandTotal };
    } catch {
      return null;
    }
  }, [propertyId, propertyName, currency, defaultRate, cleaningFee, seasons, taxBands, start, end, adults]);

  const nights = useMemo(() => {
    const a = new Date(start + "T12:00:00");
    const b = new Date(end + "T12:00:00");
    const diff = Math.round((b.getTime() - a.getTime()) / 86400000);
    return Math.max(0, diff);
  }, [start, end]);

  useEffect(() => {
    let alive = true;
    async function run() {
      if (!propertyId || nights <= 0 || nights < MIN_NIGHTS) { setAvail("idle"); return; }
      setAvail("checking");
      try {
        console.debug("[booking] isRangeAvailable →", { propertyId, start, end, nights });
        const ok = await isRangeAvailable(propertyId, start, end);
        if (!alive) return;
        console.debug("[booking] isRangeAvailable ✓", ok);
        setAvail(ok ? "available" : "unavailable");
      } catch (e) {
        if (!alive) return;
        console.error("[booking] isRangeAvailable FAILED", e);
        setAvail("unavailable");
      }
    }
    const t = setTimeout(run, 300);
    return () => { alive = false; clearTimeout(t); };
  }, [propertyId, start, end, nights]);

  async function submitRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!propertyId || !calc) {
      flash({ type: "error", text: "Bitte zuerst einen gültigen Zeitraum auswählen." });
      return;
    }
    if (avail !== "available") {
      flash({ type: "error", text: "Der gewählte Zeitraum ist aktuell nicht verfügbar." });
      return;
    }
    setSubmitting(true);
    console.log("[booking] submit →", { propertyId, start, end, adults, children, name, email });
    try {
      if (!name.trim() || !email.trim()) {
        flash({ type: "error", text: "Bitte Name und E-Mail angeben." });
        return;
      }
      if (!street.trim() || !zip.trim() || !city.trim()) {
        flash({ type: "error", text: "Bitte Straße, PLZ und Ort angeben." });
        return;
      }

      // --- Werte strikt normalisieren, damit Firestore-Rules (Typen) sicher passen
      const startISO = start; // bereits YYYY-MM-DD
      const endISO = end;     // bereits YYYY-MM-DD
      const adultsNum = Number(adults);
      const childrenNum = Number(children);
      const nameClean = name.trim();
      const emailClean = email.trim();
      const phoneClean = phone.trim();
      const messageClean = message.trim();

      if (!emailClean) {
        flash({ type: "error", text: "Bitte eine gültige E-Mail angeben." });
        return;
      }

      await createBookingRequest({
        propertyId: String(propertyId),
        startDate: startISO,
        endDate: endISO,
        adults: adultsNum,
        children: childrenNum,
        status: "requested",
        contact: {
          name: nameClean,
          email: emailClean,
          phone: phoneClean,
          address: { street, zip, city, country },
        },
        message: messageClean,
        summary: {
          nights,
          nightlyTotal: calc.base.nightsTotal,
          cleaningFee: calc.base.cleaningFee,
          touristTax: calc.tax.total,
          grandTotal: calc.grandTotal,
          currency,
        },
      });
      console.log("[booking] submit – createBookingRequest ✓");

      let mailSent = false;
      let mailErrorText = "";

      // Ohne Blaze: Mailversand direkt über den PHP-Endpoint (ohne Frontend-API-Key).
      try {
        const mailUrl = import.meta.env.VITE_MAIL_API_URL as string | undefined;
        if (!mailUrl) {
          mailErrorText = "VITE_MAIL_API_URL ist nicht gesetzt.";
          console.warn("[mail] skipped – VITE_MAIL_API_URL not set");
        } else {
          console.log("[mail] POST →", mailUrl);
          const resp = await fetch(mailUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "booking_request",
              propertyId: String(propertyId),
              propertyName,
              startDate: startISO,
              endDate: endISO,
              adults: adultsNum,
              children: childrenNum,
              contact: {
                name: nameClean,
                email: emailClean,
                phone: phoneClean,
                address: { street, zip, city, country },
              },
              message: messageClean,
            }),
          });

          const payload = await resp.json().catch(() => null) as
            | { ok?: boolean; error?: string; status?: { owner?: string; guest?: string } }
            | null;

          mailSent = resp.ok && payload?.ok !== false;
          if (!mailSent) {
            const ownerStatus = payload?.status?.owner;
            const guestStatus = payload?.status?.guest;
            const serverError = payload?.error;
            mailErrorText = [serverError, ownerStatus, guestStatus].filter(Boolean).join(" | ");
            if (!mailErrorText) mailErrorText = `HTTP ${resp.status}`;
            console.warn("[mail] send failed", resp.status, payload);
          } else {
            console.log("[mail] send ok", payload);
          }
        }
      } catch (err) {
        mailErrorText = err instanceof Error ? err.message : "fetch_failed";
        console.warn("[mail] fetch error", err);
      }

      if (mailSent) {
        flash({ type: "success", text: "Vielen Dank! Deine Anfrage wurde übermittelt und die Bestätigungsmail wurde versendet." });
      } else {
        flash({ type: "error", text: `Anfrage gespeichert, aber Mailversand fehlgeschlagen (${mailErrorText || "unbekannter Fehler"}).` });
      }
    } catch (err) {
      console.error("[booking] submit FAILED", err);
      flash({ type: "error", text: err instanceof Error ? err.message : "Anfrage konnte nicht gesendet werden." });
    } finally {
      setSubmitting(false);
    }
  }

  const nightlyBreakdown = useMemo(() => {
    if (!propertyId) return [] as { date: string; label: string; rate: number; tax: number; subtotal: number }[];
    const out: { date: string; label: string; rate: number; tax: number; subtotal: number }[] = [];
    const startDate = new Date(start + "T00:00:00");
    const endDate = new Date(end + "T00:00:00");
    for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().slice(0, 10);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const nextIso = next.toISOString().slice(0, 10);
      const season = seasons.find((s) => iso >= s.startDate && iso <= s.endDate);
      const label = season?.name || "Standard";
      const rate = season?.nightlyRate ?? defaultRate;
      // Kurtaxe für genau diese eine Nacht berechnen (nur Erwachsene)
      const taxObj = touristTaxForStay(taxBands, iso, nextIso, adults);
      const tax = taxObj.total;
      const subtotal = rate + tax;
      out.push({ date: iso, label, rate, tax, subtotal });
    }
    return out;
  }, [propertyId, start, end, seasons, defaultRate, taxBands, adults]);

  return (
    <section className="space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Buchen – {propertyName}</h1>
        <p className="mt-2 text-slate-600">
          Wähle Zeitraum &amp; Gäste. Der Preis wird live berechnet (inkl. Endreinigung &amp; Kurtaxe ab 16 Jahren).
        </p>
      </header>

      {/* Formular */}
      <form id="booking-form" className="grid gap-4 md:grid-cols-4" onSubmit={submitRequest}>
        <div className="md:col-span-4">
          <Field label="Zeitraum wählen">
            <DayPicker
              mode="range"
              locale={de}
              numberOfMonths={2}
              fromDate={new Date()}
              selected={range}
              onSelect={setRange}
              disabled={[{ before: new Date() }, ...blocked, ...requestedDisabled]}
            />
          </Field>
        </div>
        <Field label="Erwachsene (≥16)">
          <input className="input" type="number" min={0} value={adults} onChange={(e)=>setAdults(Number(e.target.value))} />
        </Field>
        <Field label="Kinder (0–15)">
          <input className="input" type="number" min={0} value={children} onChange={(e)=>setChildren(Number(e.target.value))} />
        </Field>

        {/* Kontakt */}
        <div className="md:col-span-4 grid gap-4 md:grid-cols-3">
          <Field label="Name">
            <input className="input" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Vor- und Nachname" />
          </Field>
          <Field label="E-Mail">
            <input className="input" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="name@example.com" />
          </Field>
          <Field label="Telefon (optional)">
            <input className="input" value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="+49 …" />
          </Field>

          {/* NEU: Anschrift */}
          <div className="md:col-span-3 grid gap-4 md:grid-cols-3">
            <Field label="Straße & Nr.">
              <input
                className="input"
                value={street}
                onChange={(e)=>setStreet(e.target.value)}
                placeholder="z. B. Spangerstraße 9"
              />
            </Field>
            <Field label="PLZ">
              <input
                className="input"
                value={zip}
                onChange={(e)=>setZip(e.target.value)}
                placeholder="27476"
              />
            </Field>
            <Field label="Ort">
              <input
                className="input"
                value={city}
                onChange={(e)=>setCity(e.target.value)}
                placeholder="Cuxhaven"
              />
            </Field>
            <Field label="Land">
              <input
                className="input"
                value={country}
                onChange={(e)=>setCountry(e.target.value)}
                placeholder="Deutschland"
              />
            </Field>
          </div>

          <div className="md:col-span-3">
            <Field label="Nachricht (optional)">
              <textarea className="input" rows={3} value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="z.B. Ankunftszeit, Fragen …" />
            </Field>
          </div>
        </div>
      {/* Ergebnis */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {loading ? (
          <p className="text-slate-600">Laden …</p>
        ) : error ? (
          <p className="text-red-700">{error}</p>
        ) : nights <= 0 ? (
          <p className="text-slate-600">Bitte ein gültiges Datum wählen (mindestens eine Nacht).</p>
        ) : calc ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Zusammenfassung</h3>
              <Row label="Nächte" value={String(nights)} />
              <Row label="Übernachtungen" value={fmt.format(calc.base.nightsTotal)} />
              <Row label="Endreinigung" value={fmt.format(calc.base.cleaningFee)} />
              <Row label="Kurtaxe (Erwachsene)" value={fmt.format(calc.tax.total)} />
              <div className="mt-2 h-px bg-slate-200" />
              <Row label="Gesamt" value={fmt.format(calc.grandTotal)} bold />
              <p className="mt-2 text-xs text-slate-500">Kurtaxe ab 16 Jahren. Saisonpreise inkl. USt., Kurtaxe nach Ortsrecht.</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Hinweise</h4>
              <ul className="list-disc pl-5 text-sm text-slate-700">
                <li><strong>Ende exkl.:</strong> Die Abreise-Nacht ist nicht berechnet.</li>
                <li>In definierten Saisons gilt der jeweilige Nachtpreis. Außerhalb gilt der Standardpreis.</li>
                <li>Kurtaxe je Nacht pro zahlender Person (≥16) gemäß Kurtaxe-Band.</li>
              </ul>
            </div>
            <div className="md:col-span-2">
              <details className="rounded-lg border border-slate-200 bg-slate-50 p-3 open:bg-white">
                <summary className="cursor-pointer select-none font-medium">Preis je Nacht anzeigen</summary>
                <div className="mt-2 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-600">
                        <th className="py-1 pr-3">Datum</th>
                        <th className="py-1 pr-3">Tarif</th>
                        <th className="py-1 pr-3 text-right">Preis / Nacht</th>
                        <th className="py-1 pr-3 text-right">Kurtaxe / Nacht</th>
                        <th className="py-1 pr-3 text-right">Summe / Nacht</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nightlyBreakdown.map((n) => (
                        <tr key={n.date} className="border-t border-slate-200">
                          <td className="py-1 pr-3">{new Date(n.date+"T00:00:00").toLocaleDateString("de-DE")}</td>
                          <td className="py-1 pr-3">{n.label}</td>
                          <td className="py-1 pr-3 text-right">{fmt.format(n.rate)}</td>
                          <td className="py-1 pr-3 text-right">{fmt.format(n.tax)}</td>
                          <td className="py-1 pr-3 text-right">{fmt.format(n.subtotal)}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-slate-300 font-semibold">
                        <td className="py-1 pr-3" colSpan={2}>Summe Übernachtungen</td>
                        <td className="py-1 pr-3 text-right">{fmt.format(calc.base.nightsTotal)}</td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-3" colSpan={2}>Endreinigung</td>
                        <td className="py-1 pr-3 text-right">{fmt.format(calc.base.cleaningFee)}</td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-3" colSpan={2}>Kurtaxe (gesamt)</td>
                        <td className="py-1 pr-3 text-right">{fmt.format(calc.tax.total)}</td>
                      </tr>
                      <tr className="border-t-2 border-slate-300 font-semibold">
                        <td className="py-1 pr-3" colSpan={2}>Gesamt</td>
                        <td className="py-1 pr-3 text-right">{fmt.format(calc.grandTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          </div>
        ) : (
          <p className="text-slate-600">Preis konnte nicht berechnet werden.</p>
        )}
      </div>
      {avail === "checking" && (
        <p className="text-sm text-slate-500">Verfügbarkeit wird geprüft …</p>
      )}
      {avail === "available" && (
        <p className="text-sm text-green-700">Zeitraum ist aktuell verfügbar.</p>
      )}
      {avail === "unavailable" && (
        <p className="text-sm text-red-700">Zeitraum ist leider bereits belegt.</p>
      )}
      {nights > 0 && nights < MIN_NIGHTS && (
        <p className="text-sm text-amber-700">Mindestaufenthalt: {MIN_NIGHTS} Nächte.</p>
      )}

      <div className="text-right space-y-2">
        <button
          type="submit"
          className="rounded-xl bg-[color:var(--ocean,#0e7490)] px-5 py-2 font-semibold text-white hover:opacity-90 disabled:opacity-60"
          disabled={!calc || nights <= 0 || nights < MIN_NIGHTS || submitting}
        >
          {submitting ? "Sende …" : "Anfrage senden"}
        </button>
      </div>
      </form>
      {notice && (
        <div
          role="status"
          aria-live="polite"
          className={[
            "fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-2 shadow-lg ring-1 ring-black/10 text-white flex items-center gap-3",
            notice.type === "success" ? "bg-green-600" : "bg-red-600",
          ].join(" ")}
        >
          <span>{notice.text}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="rounded bg-white/20 px-2 py-1 text-sm hover:bg-white/30"
            aria-label="Hinweis schließen"
            title="Hinweis schließen"
          >
            ✕
          </button>
        </div>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={["flex justify-between", bold ? "font-semibold" : ""].filter(Boolean).join(" ") }>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
