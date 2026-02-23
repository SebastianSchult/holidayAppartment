import { useCallback, useEffect, useMemo, useState } from "react";
import { listTaxBands, deleteTaxBand } from "../../lib/db";
import type { TouristTaxBand } from "../../lib/schemas";
import TaxForm from "./TaxForm";

export default function TaxesTable({ propertyId }: { propertyId: string }) {
  const [rows, setRows] = useState<(TouristTaxBand & { id: string })[]>([]);
  const [editing, setEditing] = useState<(TouristTaxBand & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await listTaxBands(propertyId);
      // Fallback sort, in case query isn't ordered or index is missing
      r.sort((a, b) => (a.zone || "").localeCompare(b.zone || ""));
      setRows(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kurtaxe konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);

  const currency = useMemo(() => (rows[0]?.currency || "EUR"), [rows]);
  const fmt = useMemo(() => new Intl.NumberFormat("de-DE", { style: "currency", currency }), [currency]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Kurtaxe</h3>
        <button
          className="btn-primary"
          onClick={() => setEditing({
            id: "",
            propertyId,
            zone: "Kurzone 1",
            label: "",
            currency: currency || "EUR",
            rate: 0,
            ranges: [{ startMD: "01-01", endMD: "01-02" }],
            createdAt: new Date(),
            updatedAt: new Date(),
          } as unknown as TouristTaxBand & { id: string })}
        >
          Band hinzufügen
        </button>
      </div>

      {editing && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <TaxForm
            propertyId={propertyId}
            initial={editing.id ? editing : { ...editing, id: undefined }}
            onSaved={() => { setEditing(null); load(); }}
          />
          <div className="mt-2 text-right">
            <button className="rounded-xl px-3 py-2 text-sm" onClick={() => setEditing(null)}>Abbrechen</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <caption className="sr-only">
            Kurtaxe-Bänder mit Zone, Bezeichnung, Betrag, wiederkehrenden Zeiträumen und Aktionen
          </caption>
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <Th>Zone</Th>
              <Th>Bezeichnung</Th>
              <Th className="text-right">Betrag p.P./Nacht</Th>
              <Th>Zeiträume (wiederkehrend)</Th>
              <Th className="text-right">Aktion</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><Td colSpan={5} className="text-center text-slate-600">Laden …</Td></tr>
            ) : error ? (
              <tr><Td colSpan={5} className="text-center text-red-700">{error}</Td></tr>
            ) : rows.length === 0 ? (
              <tr><Td colSpan={5} className="text-center text-slate-500">Noch keine Kurtaxe-Bänder erfasst.</Td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <Td>{r.zone}</Td>
                  <Td>{r.label}</Td>
                  <Td className="text-right">{fmt.format(r.rate)}</Td>
                  <Td>
                    <ul className="list-disc pl-5 text-slate-700">
                      {r.ranges.map((rg, i) => (
                        <li key={i}>
                          {rg.startMD} – {rg.endMD} <span className="text-xs text-slate-500">(Ende exkl.)</span>
                        </li>
                      ))}
                    </ul>
                  </Td>
                  <Td className="text-right">
                    <button className="rounded-lg px-2 py-1 text-slate-700 hover:bg-slate-100" onClick={() => setEditing(r)}>Bearbeiten</button>
                    <button
                      className="rounded-lg px-2 py-1 text-red-600 hover:bg-red-50"
                      onClick={async () => { await deleteTaxBand(r.id); load(); }}
                    >
                      Löschen
                    </button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
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
function Td({ children, className, colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return <td className={["px-3 py-2", className].filter(Boolean).join(" ") } colSpan={colSpan}>{children}</td>;
}
