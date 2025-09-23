import { useEffect, useMemo, useState } from "react";
import { getFirstProperty, listSeasons, listTaxBands } from "../lib/db";
import type { Property, Season, TouristTaxBand } from "../lib/schemas";
import { priceForStay, touristTaxForStay } from "../lib/pricing";

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
        <Field label="Anreise">
          <input className="input" type="date" value={start} onChange={(e)=>setStart(e.target.value)} />
        </Field>
        <Field label="Abreise">
          <input className="input" type="date" value={end} onChange={(e)=>setEnd(e.target.value)} />
        </Field>
        <Field label="Erwachsene (≥16)">
          <input className="input" type="number" min={0} value={adults} onChange={(e)=>setAdults(Number(e.target.value))} />
        </Field>
        <Field label="Kinder (0–15)">
          <input className="input" type="number" min={0} value={children} onChange={(e)=>setChildren(Number(e.target.value))} />
        </Field>
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
          </div>
        ) : (
          <p className="text-slate-600">Preis konnte nicht berechnet werden.</p>
        )}
      </div>

      <div className="text-right">
        <button className="rounded-xl bg-[color:var(--ocean,#0e7490)] px-5 py-2 font-semibold text-white hover:opacity-90" disabled={!calc || nights <= 0}>
          Weiter zur Anfrage (kommt gleich)
        </button>
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