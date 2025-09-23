import { useEffect, useMemo, useState } from "react";
import { getFirstProperty, listSeasons, listTaxBands, createBookingRequest, isRangeAvailable } from "../lib/db";
import type { Property, Season, TouristTaxBand } from "../lib/schemas";
import { priceForStay, touristTaxForStay } from "../lib/pricing";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import { de } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import { listBlockedNights, listOverlapBookings } from "../lib/db";

export default function Booking() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [propertyName, setPropertyName] = useState<string>("Ferienwohnung");
  const [currency, setCurrency] = useState<string>("EUR");
  const [defaultRate, setDefaultRate] = useState<number>(0);
  const [cleaningFee, setCleaningFee] = useState<number>(0);

  const [seasons, setSeasons] = useState<(Season & { id: string })[]>([]);
  const [taxBands, setTaxBands] = useState<(TouristTaxBand & { id: string })[]>([]);

  // Form-States
  const today = new Date();
  const plus3 = new Date(today.getTime() + 3 * 86400000);
  const [start, setStart] = useState<string>(today.toISOString().slice(0, 10));
  const [end, setEnd] = useState<string>(plus3.toISOString().slice(0, 10));
  const [adults, setAdults] = useState<number>(2); // Kurtaxe-pflichtig (>=16)
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

  // Submit-Status
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  // Verfügbarkeits-Prüfung
  const [avail, setAvail] = useState<"idle" | "checking" | "available" | "unavailable">("idle");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const p = await getFirstProperty();
        if (!p) throw new Error("Es ist noch keine Unterkunft angelegt.");
        setPropertyId(p.id);
        setPropertyName(p.data.name || "Ferienwohnung");
        setCurrency(p.data.currency || "EUR");
        setDefaultRate(p.data.defaultNightlyRate || 0);
        setCleaningFee(p.data.cleaningFee || 0);

        const s = await listSeasons(p.id);
        s.sort((a, b) => a.startDate.localeCompare(b.startDate));
        setSeasons(s);

        const t = await listTaxBands(p.id);
        t.sort((a, b) => (a.zone || "").localeCompare(b.zone || ""));
        setTaxBands(t);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Daten konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (range?.from) setStart(range.from.toISOString().slice(0, 10));
    if (range?.to) setEnd(range.to.toISOString().slice(0, 10));
  }, [range]);

  useEffect(() => {
    (async () => {
      if (!propertyId) return;
      const fromISO = new Date().toISOString().slice(0, 10);
      const toISO = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10);
      const dates = await listBlockedNights(propertyId, fromISO, toISO);
      setBlocked(dates.map(d => new Date(d + "T00:00:00")));

      const overlaps = await listOverlapBookings(propertyId, fromISO, toISO);
      const tmp: Date[] = [];
      overlaps.forEach(b => {
        const s = new Date(b.startDate + "T00:00:00");
        const e = new Date(b.endDate + "T00:00:00");
        for (let d = new Date(s); d < e; d.setDate(d.getDate() + 1)) {
          tmp.push(new Date(d));
        }
      });
      setRequestedDisabled(tmp);
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
    const a = new Date(start);
    const b = new Date(end);
    const diff = Math.round((b.getTime() - a.getTime()) / 86400000);
    return Math.max(0, diff);
  }, [start, end]);

  useEffect(() => {
    let alive = true;
    async function run() {
      if (!propertyId || nights <= 0 || nights < MIN_NIGHTS) { setAvail("idle"); return; }
      setAvail("checking");
      try {
        const [overlaps, ok] = await Promise.all([
          listOverlapBookings(propertyId, start, end),
          isRangeAvailable(propertyId, start, end),
        ]);
        if (!alive) return;
        // Wenn es Überschneidungen (requested/approved) gibt ODER Inventory blockiert ist → nicht verfügbar
        if (overlaps.length > 0 || !ok) {
          setAvail("unavailable");
        } else {
          setAvail("available");
        }
      } catch {
        if (!alive) return;
        setAvail("unavailable");
      }
    }
    const t = setTimeout(run, 300);
    return () => { alive = false; clearTimeout(t); };
  }, [propertyId, start, end, nights]);

  async function submitRequest(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (!propertyId || !calc) return;
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      if (!name.trim() || !email.trim()) {
        setSubmitMsg("Bitte Name und E-Mail angeben.");
        return;
      }
      await createBookingRequest({
        propertyId,
        startDate: start,
        endDate: end,
        adults,
        children,
        status: "requested",
        contact: { name: name.trim(), email: email.trim(), phone: phone.trim() },
        message: message.trim(),
        summary: {
          nights,
          nightlyTotal: calc.base.nightsTotal,
          cleaningFee: calc.base.cleaningFee,
          touristTax: calc.tax.total,
          grandTotal: calc.grandTotal,
          currency,
        },
      });
      setSubmitMsg("Vielen Dank! Deine Anfrage wurde übermittelt. Wir melden uns zeitnah.");
    } catch (err) {
      setSubmitMsg(err instanceof Error ? err.message : "Anfrage konnte nicht gesendet werden.");
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
      <form className="grid gap-4 md:grid-cols-4">
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
          <div className="md:col-span-3">
            <Field label="Nachricht (optional)">
              <textarea className="input" rows={3} value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="z.B. Ankunftszeit, Fragen …" />
            </Field>
          </div>
        </div>
      </form>

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
          onClick={submitRequest}
          className="rounded-xl bg-[color:var(--ocean,#0e7490)] px-5 py-2 font-semibold text-white hover:opacity-90 disabled:opacity-60"
          disabled={!calc || nights <= 0 || nights < MIN_NIGHTS || submitting || avail !== "available"}
        >
          {submitting ? "Sende …" : "Anfrage senden"}
        </button>
        {submitMsg && <p className="text-sm text-slate-600">{submitMsg}</p>}
      </div>
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