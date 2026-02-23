import { useEffect, useMemo, useState, useCallback, useRef, useId } from "react";
import { listBookings, approveBooking, declineBooking, deleteBooking, cancelBooking } from "../../lib/db";
import type { Booking } from "../../lib/schemas";

type OnCancelResult = void | { ok: boolean; detail?: string };
type OnCancelFn = (b: Booking & { id: string }) => Promise<OnCancelResult>;

const STATUS_ORDER: Readonly<Record<string, number>> = {
  requested: 0,
  approved: 1,
  declined: 2,
  cancelled: 3,
};

export default function BookingsTable(
  { propertyId, onCancel }: { propertyId: string; onCancel?: OnCancelFn }
) {
  const [rows, setRows] = useState<(Booking & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<(Booking & { id: string }) | null>(
    null
  );
  const [busy, setBusy] = useState<false | "approve" | "decline">(false);

  const [notice, setNotice] = useState<null | { type: "success" | "error"; text: string; actionText?: string; onAction?: () => void }>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function flash(type: "success" | "error", text: string, actionText?: string, onAction?: () => void) {
    setNotice({ type, text, actionText, onAction });
    if (noticeTimer.current) {
      clearTimeout(noticeTimer.current);
    }
    noticeTimer.current = setTimeout(() => {
      setNotice(null);
      noticeTimer.current = null;
    }, 3000);
  }
  const [confirmState, setConfirmState] = useState<null | { kind: "cancel" | "delete"; booking: Booking & { id: string } }>(null);

  // Local state for search, sort, pagination
  const [q, setQ] = useState<string>("");
  const [sortBy, setSortBy] = useState<"startDate" | "status">("startDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(0);

  useEffect(() => { setPage(0); }, [q, sortBy, sortDir, pageSize, rows]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const all = await listBookings(propertyId);
        all.sort((a, b) => a.startDate.localeCompare(b.startDate));
        setRows(all);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Konnte Anfragen nicht laden."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [propertyId]);

  const fmtDate = useMemo(
    () => (iso: string) =>
      new Date(iso + "T00:00:00").toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    []
  );
  const money = useCallback(
    (val: number, currency: string) =>
      new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: currency || "EUR",
      }).format(val || 0),
    []
  );

  function mailSuffix(res?: { ok: boolean; detail?: string } | null) {
    if (!res) return "";
    return res.ok ? " (Mail ok)" : ` (Mail-Problem: ${res.detail ?? "unbekannt"})`;
  }

  async function changeStatusInline(
    id: string,
    status: "approved" | "declined"
  ) {
    try {
      let mailRes: { ok: boolean; detail?: string } | null = null;
      if (status === "approved") {
        const b = rows.find((x) => x.id === id);
        if (!b) throw new Error("Anfrage nicht gefunden.");
        mailRes = await approveBooking(b);
      } else {
        mailRes = await declineBooking(id);
      }
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      flash(
        "success",
        (status === "approved" ? "Anfrage bestätigt." : "Anfrage abgelehnt.") + mailSuffix(mailRes)
      );
    } catch (e) {
      flash("error", e instanceof Error ? e.message : "Aktion fehlgeschlagen.");
    }
  }

  async function changeStatusInModal(
    id: string,
    status: "approved" | "declined"
  ) {
    try {
      setBusy(status === "approved" ? "approve" : "decline");
      let mailRes: { ok: boolean; detail?: string } | null = null;
      if (status === "approved") {
        const b = rows.find((x) => x.id === id);
        if (!b) throw new Error("Anfrage nicht gefunden.");
        mailRes = await approveBooking(b);
      } else {
        mailRes = await declineBooking(id);
      }
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      setSelected((s) => (s ? { ...s, status } : s));
      flash(
        "success",
        (status === "approved" ? "Anfrage bestätigt." : "Anfrage abgelehnt.") + mailSuffix(mailRes)
      );
    } catch (e) {
      flash("error", e instanceof Error ? e.message : "Aktion fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel(b: Booking & { id: string }) {
    // This will be executed after user confirms
    try {
      let mailRes: { ok: boolean; detail?: string } | null = null;
      if (onCancel) {
        await onCancel(b); // external handler decides what to show
      } else {
        mailRes = await cancelBooking(b);
      }
      setRows(prev => prev.map(x => x.id === b.id ? { ...x, status: "cancelled" } : x));
      setSelected(s => (s && s.id === b.id ? { ...s, status: "cancelled" } : s));
      flash("success", "Buchung storniert." + mailSuffix(mailRes), "Rückgängig", async () => {
        try {
          const res = await approveBooking(b);
          setRows(prev => prev.map(x => x.id === b.id ? { ...x, status: "approved" } : x));
          setSelected(s => (s && s.id === b.id ? { ...s, status: "approved" } : s));
          if (res && !res.ok) {
            flash("error", `Rückgängig: Mail-Problem: ${res.detail ?? "unbekannt"}`);
          }
        } catch (e) {
          flash("error", e instanceof Error ? e.message : "Rückgängig fehlgeschlagen.");
        }
      });
    } catch (e) {
      flash("error", e instanceof Error ? e.message : "Stornierung fehlgeschlagen.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteBooking(id);
      setRows(prev => prev.filter(x => x.id !== id));
      setSelected(s => (s && s.id === id ? null : s));
      flash("success", "Eintrag gelöscht.");
    } catch (e) {
      flash("error", e instanceof Error ? e.message : "Löschen fehlgeschlagen.");
    }
  }

  // ESC schließt offene Modals konsistent
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (confirmState) {
        setConfirmState(null);
        return;
      }
      if (selected) {
        setSelected(null);
      }
    }
    if (selected || confirmState) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, confirmState]);

  const norm = (s?: string) => (s || "").toLowerCase();
  const isApproved = (s: string) => ["approved", "confirmed"].includes(norm(s));
  const isDeclined = (s: string) => ["declined", "rejected", "abgelehnt"].includes(norm(s));
  const isCancelled = (s: string) => ["cancelled", "canceled", "storniert"].includes(norm(s));

  // Derived data for filtering, sorting, pagination

  const filteredRows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(b => {
      const hay = `${b.contact?.name || ""} ${b.contact?.email || ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [rows, q]);

  const sortedRows = useMemo(() => {
    const out = [...filteredRows];
    out.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "startDate") {
        cmp = a.startDate.localeCompare(b.startDate);
      } else {
        const sa = STATUS_ORDER[(a.status || "").toLowerCase()] ?? 99;
        const sb = STATUS_ORDER[(b.status || "").toLowerCase()] ?? 99;
        cmp = sa - sb;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return out;
  }, [filteredRows, sortBy, sortDir]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(sortedRows.length / pageSize)), [sortedRows.length, pageSize]);
  const pageRows = useMemo(() => {
    const start = Math.min(page, totalPages - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize, totalPages]);

  if (loading) return <p className="text-slate-600">Laden …</p>;
  if (error) return <p className="text-red-700">{error}</p>;
  if (rows.length === 0)
    return <p className="text-slate-600">Noch keine Anfragen.</p>;

  return (
    <>
      {/* Toolbar for search/sort/pagination */}
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Suche (Name, E‑Mail)…"
            className="input w-64"
            aria-label="Suche"
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            Sortieren nach
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "startDate" | "status")}
              className="rounded border border-slate-300 bg-white px-2 py-1"
            >
              <option value="startDate">Startdatum</option>
              <option value="status">Status</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50"
            aria-label="Sortierrichtung wechseln"
            title="Sortierrichtung wechseln"
          >
            {sortDir === "asc" ? "↑" : "↓"}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            Einträge pro Seite
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded border border-slate-300 bg-white px-2 py-1"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <Th>Kontakt</Th>
              <Th>Zeitraum</Th>
              <Th>Gäste</Th>
              <Th>Status</Th>
              <Th className="text-right">Aktion</Th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((b) => (
              <tr key={b.id} className="border-t">
                <Td>
                  <div className="font-medium">{b.contact?.name || "-"}</div>
                  <div className="text-xs text-slate-600">
                    {b.contact?.email || ""}
                  </div>
                  {b.contact?.phone && (
                    <div className="text-xs text-slate-600">
                      {b.contact.phone}
                    </div>
                  )}
                </Td>
                <Td>
                  {fmtDate(b.startDate)} – {fmtDate(b.endDate)}
                  {b.summary && (
                    <div className="text-xs text-slate-600">
                      {b.summary.nights} Nächte, Gesamt:{" "}
                      {money(b.summary.grandTotal, b.summary.currency || "EUR")}
                    </div>
                  )}
                </Td>
                <Td>
                  {b.adults} Erw., {b.children} Ki.
                </Td>
                <Td>{b.status}</Td>
                <Td className="text-right">
                  <div className="flex justify-end items-center gap-2">
                    <button
                      onClick={() => setSelected(b)}
                      className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Details
                    </button>
                    {norm(b.status) === "requested" ? (
                      <>
                        <button
                          onClick={() => changeStatusInline(b.id, "approved")}
                          className="rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:opacity-90"
                        >
                          Bestätigen
                        </button>
                        <button
                          onClick={() => changeStatusInline(b.id, "declined")}
                          className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:opacity-90"
                        >
                          Ablehnen
                        </button>
                      </>
                    ) : isApproved(b.status) ? (
                      <>
                        <button
                          onClick={() => setConfirmState({ kind: "cancel", booking: b })}
                          className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:opacity-90"
                        >
                          Stornieren
                        </button>
                      </>
                    ) : (isDeclined(b.status) || isCancelled(b.status)) ? (
                      <>
                        <button
                          onClick={() => setConfirmState({ kind: "delete", booking: b })}
                          className="rounded bg-slate-700 px-3 py-1.5 text-sm text-white hover:opacity-90"
                        >
                          Löschen
                        </button>
                      </>
                    ) : (
                      <span className="text-slate-500">–</span>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="mt-3 flex items-center justify-between text-sm">
        <div className="text-slate-600">
          {sortedRows.length} Einträge · Seite {Math.min(page + 1, totalPages)} / {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page <= 0}
            className="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-50 hover:bg-slate-50"
          >
            Zurück
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-50 hover:bg-slate-50"
          >
            Weiter
          </button>
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <LightModal onClose={() => setSelected(null)} title="Anfrage-Details">
          <div className="space-y-3 text-sm">
            <Section title="Kontakt">
              <Row label="Name" value={selected.contact?.name || "-"} />
              <Row label="E-Mail" value={selected.contact?.email || "-"} />
              {selected.contact?.phone ? (
                <Row label="Telefon" value={selected.contact.phone} />
              ) : null}
            </Section>

            <Section title="Reise">
              <Row
                label="Zeitraum"
                value={`${fmtDate(selected.startDate)} – ${fmtDate(
                  selected.endDate
                )}`}
              />
              <Row
                label="Gäste"
                value={`${selected.adults} Erwachsene, ${selected.children} Kinder`}
              />
            </Section>

            {selected.summary && (
              <Section title="Preis (Zusammenfassung)">
                <Row label="Nächte" value={String(selected.summary.nights)} />
                <Row
                  label="Übernachtungen"
                  value={money(
                    selected.summary.nightlyTotal,
                    selected.summary.currency
                  )}
                />
                <Row
                  label="Endreinigung"
                  value={money(
                    selected.summary.cleaningFee,
                    selected.summary.currency
                  )}
                />
                <Row
                  label="Kurtaxe"
                  value={money(
                    selected.summary.touristTax,
                    selected.summary.currency
                  )}
                />
                <div className="h-px bg-slate-200 my-1" />
                <Row
                  bold
                  label="Gesamt"
                  value={money(
                    selected.summary.grandTotal,
                    selected.summary.currency
                  )}
                />
              </Section>
            )}

            {selected.message ? (
              <Section title="Nachricht">
                <p className="whitespace-pre-wrap text-slate-700">
                  {selected.message}
                </p>
              </Section>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              {norm(selected.status) === "requested" ? (
                <>
                  <button
                    disabled={!!busy}
                    onClick={() => changeStatusInModal(selected.id, "declined")}
                    className="rounded bg-red-600 px-3 py-1.5 text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {busy === "decline" ? "…" : "Ablehnen"}
                  </button>
                  <button
                    disabled={!!busy}
                    onClick={() => changeStatusInModal(selected.id, "approved")}
                    className="rounded bg-green-600 px-3 py-1.5 text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {busy === "approve" ? "…" : "Bestätigen"}
                  </button>
                </>
              ) : isApproved(selected.status) ? (
                <button
                  onClick={() => setConfirmState({ kind: "cancel", booking: selected })}
                  className="rounded bg-red-600 px-3 py-1.5 text-white hover:opacity-90"
                >
                  Stornieren
                </button>
              ) : isDeclined(selected.status) || isCancelled(selected.status) ? (
                <button
                  onClick={() => setConfirmState({ kind: "delete", booking: selected })}
                  className="rounded bg-slate-700 px-3 py-1.5 text-white hover:opacity-90"
                >
                  Löschen
                </button>
              ) : (
                <span className="text-slate-500 self-center">{selected.status}</span>
              )}
            </div>
          </div>
        </LightModal>
      )}
      {confirmState && (
        <LightModal
          onClose={() => setConfirmState(null)}
          title={confirmState.kind === "cancel" ? "Buchung stornieren" : "Eintrag löschen"}
        >
          <p className="text-sm text-slate-700">
            {confirmState.kind === "cancel"
              ? "Möchtest du diese Buchung wirklich stornieren?"
              : "Möchtest du diesen Eintrag endgültig löschen? Dies kann nicht rückgängig gemacht werden."}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setConfirmState(null)}
              className="rounded border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
            >
              Abbrechen
            </button>
            {confirmState.kind === "cancel" ? (
              <button
                onClick={() => {
                  const b = confirmState.booking;
                  setConfirmState(null);
                  handleCancel(b);
                }}
                className="rounded bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
              >
                Ja, stornieren
              </button>
            ) : (
              <button
                onClick={() => {
                  const id = confirmState.booking.id;
                  setConfirmState(null);
                  handleDelete(id);
                }}
                className="rounded bg-slate-700 px-3 py-1.5 text-white hover:bg-slate-800"
              >
                Ja, löschen
              </button>
            )}
          </div>
        </LightModal>
      )}
      {notice && (
        <div
          className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg px-4 py-2 shadow-lg text-white ${notice.type === "success" ? "bg-green-600" : "bg-red-600"}`}
          role="status"
          aria-live="polite"
        >
          <span>{notice.text}</span>
          {notice.actionText && notice.onAction && (
            <button
              onClick={() => {
                if (notice.onAction) {
                  const fn = notice.onAction;
                  setNotice(null);
                  fn();
                }
              }}
              className="rounded bg-white/20 px-2 py-1 text-sm hover:bg-white/30"
            >
              {notice.actionText}
            </button>
          )}
          <button
            onClick={() => setNotice(null)}
            aria-label="Schließen"
            className="rounded bg-white/20 px-2 py-1 text-sm hover:bg-white/30"
            type="button"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={["px-3 py-2 text-left font-medium", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </th>
  );
}
function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={["px-3 py-2", className].filter(Boolean).join(" ")}>
      {children}
    </td>
  );
}

/** Kleines eigenes Modal (ohne Lib) */
function LightModal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  return (
    <div
      aria-modal="true"
      role="dialog"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      {/* Backdrop */}
      <div ref={backdropRef} className="absolute inset-0 bg-black/40" />

      {/* Panel */}
      <div className="relative z-10 w-full md:max-w-2xl rounded-t-2xl md:rounded-2xl bg-white shadow-xl p-4 md:p-5">
        <div className="flex items-center justify-between">
          <h3 id={titleId} className="text-lg font-semibold">{title}</h3>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Schließen"
            onClick={onClose}
            className="rounded-full p-2 text-slate-600 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h4 className="font-medium text-slate-800">{title}</h4>
      <div className="mt-1 space-y-1">{children}</div>
    </section>
  );
}
function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={["flex justify-between gap-4", bold ? "font-semibold" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="text-slate-600">{label}</span>
      <span className="text-slate-900">{value}</span>
    </div>
  );
}
