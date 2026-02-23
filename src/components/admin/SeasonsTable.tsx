import { useEffect, useState, useCallback } from "react";
import { listSeasons, deleteSeason } from "../../lib/db";
import type { Season } from "../../lib/schemas";
import SeasonForm from "./SeasonForm";

export default function SeasonsTable({ propertyId }: { propertyId: string }) {
  const [rows, setRows] = useState<(Season & { id: string })[]>([]);
  const [editing, setEditing] = useState<Season & { id: string } | null>(null);

  const load = useCallback(async () => {
    const r = await listSeasons(propertyId);
    setRows(r);
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Saisonpreise</h3>
        <button className="btn-primary" onClick={()=>setEditing({ id:"", propertyId, name:"", startDate:"", endDate:"", nightlyRate:0, minNights:1, createdAt:new Date(), updatedAt:new Date() })}>
          Saison hinzufügen
        </button>
      </div>

      {editing && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <SeasonForm
            propertyId={propertyId}
            initial={editing.id ? editing : { ...editing, id: undefined }}
            onSaved={() => { setEditing(null); load(); }}
          />
          <div className="mt-2 text-right">
            <button className="rounded-xl px-3 py-2 text-sm" onClick={()=>setEditing(null)}>Abbrechen</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <caption className="sr-only">
            Saisonpreise mit Zeitraum, Nachtpreis, Mindestnächten und Aktionen
          </caption>
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <Th>Name</Th><Th>Start</Th><Th>Ende</Th><Th>Preis/Nacht</Th><Th>Min. Nächte</Th><Th>Aktionen</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id} className="border-t">
                <Td>{r.name}</Td>
                <Td>{r.startDate}</Td>
                <Td>{r.endDate}</Td>
                <Td>{r.nightlyRate.toFixed(2)} €</Td>
                <Td>{r.minNights ?? "-"}</Td>
                <Td className="text-right">
                  <button className="rounded-lg px-2 py-1 text-slate-700 hover:bg-slate-100" onClick={()=>setEditing(r)}>Bearbeiten</button>
                  <button className="rounded-lg px-2 py-1 text-red-600 hover:bg-red-50" onClick={async()=>{ await deleteSeason(r.id); load(); }}>Löschen</button>
                </Td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><Td colSpan={6} className="text-center text-slate-500">Noch keine Saisons angelegt.</Td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th scope="col" className="px-3 py-2 text-left font-medium">{children}</th>;
}
function Td({ children, colSpan, className }: { children: React.ReactNode; colSpan?: number; className?: string }) {
  const cls = className ? `px-3 py-2 ${className}` : 'px-3 py-2';
  return (
    <td className={cls} colSpan={colSpan}>
      {children}
    </td>
  );
}
