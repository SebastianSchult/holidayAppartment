import { useEffect, useMemo, useState } from "react";
import { getFirstProperty, listSeasons, listTaxBands } from "../lib/db";
import { priceForStay } from "../lib/pricing";
import { touristTaxForStay } from "../lib/pricing";

export default function Booking() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [propertyName, setPropertyName] = useState<string>("Ferienwohnung");
  const [currency, setCurrency] = useState<string>("EUR");
  const [defaultRate, setDefaultRate] = useState<number>(0);
  const [cleaningFee, setCleaningFee] = useState<number>(0);

  const [seasons, setSeasons] = useState<any[]>([]);
  const [taxBands, setTaxBands] = useState<any[]>([]);

  // Form-States
  const today = new Date();
  const plus3 = new Date(today.getTime() + 3 * 86400000);
  const [start, setStart] = useState<string>(today.toISOString().slice(0, 10));
  const [end, setEnd] = useState<string>(plus3.toISOString().slice(0, 10));
  const [adults, setAdults] = useState<number>(2);  // Kurtaxe-pflichtig (>= 16)
  const [children, setChildren] = useState<number>(0); // 0–15 Jahre (keine Kurtaxe)

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
        // falls nicht bestellt: sortiere nach Zone
        t.sort((a: any, b: any) => (a.zone || "").localeCompare(b.zone || ""));
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
      const property = {
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
      };

      const base = priceForStay(property as any, seasons as any, start, end);
      const tax = touristTaxForStay(taxBands as any, start, end, adults);

      const grandTotal = base.total + tax.total;
      return { base, tax, grandTotal };
    } catch {
      return null;
    }
  }, [propertyId, propertyName, currency, defaultRate, cleaningFee, seasons, taxBands, start, end, adults]);

  // einfache Validierungen
  const nights = useMemo(() => {
    const a = new Date(start);
    const b = new Date(end);
    return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
  }, [start, end]);
  const minNights = useMemo(() => {
    // einfache Anzeige (aus pricing.ts gibt es minNightsRequired – optional nutzbar)
    return 1;
  }, []);

  return (
    <section className="space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Buchen – {propertyName}</h1>
        <p className="mt-2 text-slate-600">Wähle Zeitraum &amp; Gäste. Der Preis wird live berechnet (inkl. Endreinigung &amp; Kurtaxe ab 16 Jahren).</p>
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
              <div className="flex justify-between"><span>Nächte</span><span>{nights}</span></div>
              <div className="flex justify-between"><span>Übernachtungen</span><span>{fmt.format(calc.base.nightsTotal)}</span></div>
              <div className="flex justify-between"><span>Endreinigung</span><span>{fmt.format(calc.base.cleaningFee)}</span></div>
              <div className="flex justify-between"><span>Kurtaxe (Erwachsene)</span><span>{fmt.format(calc.tax.total)}</span></div>
              <div className="mt-2 h-px bg-slate-200" />
              <div className="flex justify-between font-semibold"><span>Gesamt</span><span>{fmt.format(calc.grandTotal)}</span></div>
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
        <button className="rounded-xl bg-[color:var(--ocean,#0e7490)] px-5 py-2 font-semibold text-white hover:opacity-90" disabled={!calc || nights < minNights}>
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