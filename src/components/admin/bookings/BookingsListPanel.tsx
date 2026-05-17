import { isApproved, isCancelled, isDeclined, normalizeStatus } from "./utils";
import type { BookingRow } from "./types";

export function BookingsListPanel({
  rows,
  search,
  sortBy,
  sortDir,
  page,
  pageSize,
  totalPages,
  onSearch,
  onSortBy,
  onToggleSortDir,
  onPageSize,
  onPrevPage,
  onNextPage,
  onSelect,
  onApprove,
  onDecline,
  onAskCancel,
  onAskDelete,
  formatDate,
  formatMoney,
  totalItems,
}: {
  rows: BookingRow[];
  search: string;
  sortBy: "startDate" | "status";
  sortDir: "asc" | "desc";
  page: number;
  pageSize: number;
  totalPages: number;
  onSearch: (value: string) => void;
  onSortBy: (value: "startDate" | "status") => void;
  onToggleSortDir: () => void;
  onPageSize: (value: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onSelect: (row: BookingRow) => void;
  onApprove: (row: BookingRow) => void;
  onDecline: (row: BookingRow) => void;
  onAskCancel: (row: BookingRow) => void;
  onAskDelete: (row: BookingRow) => void;
  formatDate: (isoDate: string) => string;
  formatMoney: (value: number, currency: string) => string;
  totalItems: number;
}) {
  return (
    <>
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Suche (Name, E-Mail)..."
            className="input w-64"
            aria-label="Suche"
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            Sortieren nach
            <select
              value={sortBy}
              onChange={(event) => onSortBy(event.target.value as "startDate" | "status")}
              className="rounded border border-slate-300 bg-white px-2 py-1"
            >
              <option value="startDate">Startdatum</option>
              <option value="status">Status</option>
            </select>
          </label>
          <button
            type="button"
            onClick={onToggleSortDir}
            className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50"
            aria-label="Sortierrichtung wechseln"
            title="Sortierrichtung wechseln"
          >
            {sortDir === "asc" ? "↑" : "↓"}
          </button>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          Eintrage pro Seite
          <select
            value={pageSize}
            onChange={(event) => onPageSize(Number(event.target.value))}
            className="rounded border border-slate-300 bg-white px-2 py-1"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <caption className="sr-only">
            Buchungsanfragen mit Kontakt, Zeitraum, Gastezahl, Status und Aktionen
          </caption>
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th scope="col" className="px-3 py-2 text-left font-medium">Kontakt</th>
              <th scope="col" className="px-3 py-2 text-left font-medium">Zeitraum</th>
              <th scope="col" className="px-3 py-2 text-left font-medium">Gaste</th>
              <th scope="col" className="px-3 py-2 text-left font-medium">Status</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-3 py-2">
                  <div className="font-medium">{row.contact?.name || "-"}</div>
                  <div className="text-xs text-slate-600">{row.contact?.email || ""}</div>
                  {row.contact?.phone && <div className="text-xs text-slate-600">{row.contact.phone}</div>}
                </td>
                <td className="px-3 py-2">
                  {formatDate(row.startDate)} - {formatDate(row.endDate)}
                  {row.summary && (
                    <div className="text-xs text-slate-600">
                      {row.summary.nights} Nachte, Gesamt: {formatMoney(row.summary.grandTotal, row.summary.currency || "EUR")}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2">{row.adults} Erw., {row.children} Ki.</td>
                <td className="px-3 py-2">{row.status}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onSelect(row)}
                      className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Details
                    </button>

                    {normalizeStatus(row.status) === "requested" ? (
                      <>
                        <button
                          onClick={() => onApprove(row)}
                          className="rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:opacity-90"
                        >
                          Bestatigen
                        </button>
                        <button
                          onClick={() => onDecline(row)}
                          className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:opacity-90"
                        >
                          Ablehnen
                        </button>
                      </>
                    ) : isApproved(row.status) ? (
                      <button
                        onClick={() => onAskCancel(row)}
                        className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:opacity-90"
                      >
                        Stornieren
                      </button>
                    ) : isDeclined(row.status) || isCancelled(row.status) ? (
                      <button
                        onClick={() => onAskDelete(row)}
                        className="rounded bg-slate-700 px-3 py-1.5 text-sm text-white hover:opacity-90"
                      >
                        Loschen
                      </button>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <div className="text-slate-600">
          {totalItems} Eintrage - Seite {Math.min(page + 1, totalPages)} / {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevPage}
            disabled={page <= 0}
            className="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-50 hover:bg-slate-50"
          >
            Zuruck
          </button>
          <button
            type="button"
            onClick={onNextPage}
            disabled={page >= totalPages - 1}
            className="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-50 hover:bg-slate-50"
          >
            Weiter
          </button>
        </div>
      </div>
    </>
  );
}
