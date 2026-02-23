import { useEffect, useMemo, useState } from "react";
import { getFirstProperty, listSeasons } from "../lib/db";

type Row = {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD (exklusiv)
  nightlyRate: number;
  minNights?: number;
};

export default function Prices() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [propertyName, setPropertyName] = useState<string>("Ferienwohnung");
  const [currency, setCurrency] = useState<string>("EUR");
  const [defaultNightlyRate, setDefaultNightlyRate] = useState<number>(0);
  const [cleaningFee, setCleaningFee] = useState<number>(0);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const prop = await getFirstProperty();
        if (prop?.data) {
          setPropertyName(prop.data.name || "Ferienwohnung");
          setCurrency(prop.data.currency || "EUR");
          setDefaultNightlyRate(prop.data.defaultNightlyRate || 0);
          setCleaningFee(prop.data.cleaningFee || 0);

          const seasons = await listSeasons(prop.id);
          // Falls listSeasons (temporär) nicht sortiert: hier nochmals absichern
          seasons.sort((a, b) => a.startDate.localeCompare(b.startDate));
          setRows(
            seasons.map((s) => ({
              id: s.id || `${s.propertyId}-${s.startDate}`,
              name: s.name,
              startDate: s.startDate,
              endDate: s.endDate,
              nightlyRate: s.nightlyRate,
              minNights: s.minNights,
            }))
          );
        } else {
          setRows([]);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Preise konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatter = useMemo(
    () => new Intl.NumberFormat("de-DE", { style: "currency", currency }),
    [currency]
  );
  const fmtDate = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <section className="space-y-8">
      <header className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">{propertyName} – Preise</h1>
        <p className="mt-2 text-slate-600">
          Transparente Saisonpreise &amp; Standardpreis. Endreinigung und Kurtaxe separat wie angegeben.
        </p>
      </header>

      {/* Standardpreis & Endreinigung */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Standardpreis außerhalb von Saisons</h2>
          <p className="mt-1 text-2xl font-bold">{formatter.format(defaultNightlyRate)} <span className="text-base font-normal text-slate-600">/ Nacht</span></p>
          <p className="mt-2 text-sm text-slate-600">
            Gilt für Nächte, die in keine definierte Saison fallen.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Endreinigung</h2>
          <p className="mt-1 text-2xl font-bold">{formatter.format(cleaningFee)}</p>
          <p className="mt-2 text-sm text-slate-600">
            Einmalig pro Aufenthalt. Kurtaxe nach lokaler Satzung ggf. zusätzlich.
          </p>
        </div>
      </div>

      {/* Saisonpreise */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-lg font-semibold">Saisonpreise</h2>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-slate-600">Laden …</div>
        ) : error ? (
          <div className="px-4 py-6 text-red-700">
            {error}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-6 text-slate-600">Noch keine Saisons erfasst.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <caption className="sr-only">
                Saisonpreise für {propertyName} mit Zeitraum, Tarifname, Preis pro
                Nacht und Mindestnächten
              </caption>
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <Th>Zeitraum</Th>
                  <Th>Name</Th>
                  <Th className="text-right">Preis/Nacht</Th>
                  <Th className="text-right">Min. Nächte</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <Td>
                      {fmtDate(r.startDate)} – {fmtDate(r.endDate)}
                      <span className="ml-1 text-xs text-slate-500">(Ende exkl.)</span>
                    </Td>
                    <Td>{r.name}</Td>
                    <Td className="text-right">{formatter.format(r.nightlyRate)}</Td>
                    <Td className="text-right">{r.minNights ?? "-"}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="rounded-2xl bg-[color:var(--seafoam,#e0f2f1)] px-6 py-6 text-center md:py-8">
        <h3 className="text-xl font-semibold">Fragen zum Zeitraum oder Preis?</h3>
        <p className="mt-1 text-slate-700">
          Prüfe die Verfügbarkeit und erhalte den Gesamtpreis direkt im nächsten Schritt.
        </p>
        <a
          href="/book"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-[color:var(--ocean,#0e7490)] px-5 py-2 text-white hover:opacity-90"
        >
          Jetzt Verfügbarkeit prüfen
        </a>
      </div>
    </section>
  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={["px-3 py-2 text-left font-medium", className].filter(Boolean).join(" ")}
    >
      {children}
    </th>
  );
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={["px-3 py-2", className].filter(Boolean).join(" ")}>{children}</td>;
}
