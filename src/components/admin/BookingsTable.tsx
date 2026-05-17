import { useEffect, useMemo, useRef, useState } from "react";
import {
  approveBooking,
  cancelBooking,
  declineBooking,
  deleteBooking,
  listBookings,
} from "../../lib/db";
import type { Booking } from "../../lib/schemas";
import { BookingConfirmModal } from "./bookings/BookingConfirmModal";
import { BookingDetailsModal } from "./bookings/BookingDetailsModal";
import { BookingsListPanel } from "./bookings/BookingsListPanel";
import { BookingNoticeToast } from "./bookings/BookingNoticeToast";
import type { BookingRow, BusyState, ConfirmState } from "./bookings/types";
import { filterRows, formatDate, formatMoney, sortRows } from "./bookings/utils";

type OnCancelResult = void | { ok: boolean; detail?: string };
type OnCancelFn = (booking: Booking & { id: string }) => Promise<OnCancelResult>;

export default function BookingsTable({
  propertyId,
  onCancel,
}: {
  propertyId: string;
  onCancel?: OnCancelFn;
}) {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<BookingRow | null>(null);
  const [busy, setBusy] = useState<BusyState>(false);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  const [search, setSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<"startDate" | "status">("startDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(0);

  const [notice, setNotice] = useState<null | {
    type: "success" | "error";
    text: string;
    actionText?: string;
    onAction?: () => void;
  }>(null);

  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flash(
    type: "success" | "error",
    text: string,
    actionText?: string,
    onAction?: () => void,
  ) {
    setNotice({ type, text, actionText, onAction });
    if (noticeTimer.current) {
      clearTimeout(noticeTimer.current);
    }
    noticeTimer.current = setTimeout(() => {
      setNotice(null);
      noticeTimer.current = null;
    }, 3000);
  }

  function mailSuffix(result?: { ok: boolean; detail?: string } | null): string {
    if (!result) return "";
    return result.ok ? " (Mail ok)" : ` (Mail-Problem: ${result.detail ?? "unbekannt"})`;
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const allRows = await listBookings(propertyId);
        allRows.sort((a, b) => a.startDate.localeCompare(b.startDate));
        setRows(allRows);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Konnte Anfragen nicht laden.");
      } finally {
        setLoading(false);
      }
    })();
  }, [propertyId]);

  useEffect(() => {
    setPage(0);
  }, [search, sortBy, sortDir, pageSize, rows]);

  useEffect(() => {
    function onKeydown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (confirmState) {
        setConfirmState(null);
        return;
      }
      if (selected) {
        setSelected(null);
      }
    }

    if (selected || confirmState) {
      window.addEventListener("keydown", onKeydown);
    }

    return () => {
      window.removeEventListener("keydown", onKeydown);
    };
  }, [selected, confirmState]);

  const filteredRows = useMemo(() => filterRows(rows, search), [rows, search]);
  const sortedRows = useMemo(() => sortRows(filteredRows, sortBy, sortDir), [filteredRows, sortBy, sortDir]);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(sortedRows.length / pageSize)),
    [sortedRows.length, pageSize],
  );
  const pageRows = useMemo(() => {
    const start = Math.min(page, totalPages - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize, totalPages]);

  async function changeStatus(booking: BookingRow, status: "approved" | "declined") {
    try {
      let mailResult: { ok: boolean; detail?: string } | null = null;
      if (status === "approved") {
        mailResult = await approveBooking(booking);
      } else {
        mailResult = await declineBooking(booking.id);
      }

      setRows((previous) => previous.map((row) => (row.id === booking.id ? { ...row, status } : row)));
      setSelected((previous) => (previous && previous.id === booking.id ? { ...previous, status } : previous));

      flash(
        "success",
        (status === "approved" ? "Anfrage bestatigt." : "Anfrage abgelehnt.") + mailSuffix(mailResult),
      );
    } catch (changeError) {
      flash("error", changeError instanceof Error ? changeError.message : "Aktion fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel(booking: BookingRow) {
    try {
      let mailResult: { ok: boolean; detail?: string } | null = null;
      if (onCancel) {
        await onCancel(booking);
      } else {
        mailResult = await cancelBooking(booking);
      }

      setRows((previous) =>
        previous.map((row) => (row.id === booking.id ? { ...row, status: "cancelled" } : row)),
      );
      setSelected((previous) =>
        previous && previous.id === booking.id ? { ...previous, status: "cancelled" } : previous,
      );

      flash("success", "Buchung storniert." + mailSuffix(mailResult), "Ruckgangig", async () => {
        try {
          const revert = await approveBooking(booking);
          setRows((previous) =>
            previous.map((row) => (row.id === booking.id ? { ...row, status: "approved" } : row)),
          );
          setSelected((previous) =>
            previous && previous.id === booking.id ? { ...previous, status: "approved" } : previous,
          );
          if (revert && !revert.ok) {
            flash("error", `Ruckgangig: Mail-Problem: ${revert.detail ?? "unbekannt"}`);
          }
        } catch (revertError) {
          flash("error", revertError instanceof Error ? revertError.message : "Ruckgangig fehlgeschlagen.");
        }
      });
    } catch (cancelError) {
      flash("error", cancelError instanceof Error ? cancelError.message : "Stornierung fehlgeschlagen.");
    }
  }

  async function handleDelete(bookingId: string) {
    try {
      await deleteBooking(bookingId);
      setRows((previous) => previous.filter((row) => row.id !== bookingId));
      setSelected((previous) => (previous && previous.id === bookingId ? null : previous));
      flash("success", "Eintrag geloscht.");
    } catch (deleteError) {
      flash("error", deleteError instanceof Error ? deleteError.message : "Loschen fehlgeschlagen.");
    }
  }

  if (loading) return <p className="text-slate-600">Laden ...</p>;
  if (error) return <p className="text-red-700">{error}</p>;
  if (rows.length === 0) return <p className="text-slate-600">Noch keine Anfragen.</p>;

  return (
    <>
      <BookingsListPanel
        rows={pageRows}
        search={search}
        sortBy={sortBy}
        sortDir={sortDir}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onSearch={setSearch}
        onSortBy={setSortBy}
        onToggleSortDir={() => setSortDir((current) => (current === "asc" ? "desc" : "asc"))}
        onPageSize={setPageSize}
        onPrevPage={() => setPage((current) => Math.max(0, current - 1))}
        onNextPage={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
        onSelect={setSelected}
        onApprove={(booking) => changeStatus(booking, "approved")}
        onDecline={(booking) => changeStatus(booking, "declined")}
        onAskCancel={(booking) => setConfirmState({ kind: "cancel", booking })}
        onAskDelete={(booking) => setConfirmState({ kind: "delete", booking })}
        formatDate={formatDate}
        formatMoney={formatMoney}
        totalItems={sortedRows.length}
      />

      {selected && (
        <BookingDetailsModal
          selected={selected}
          busy={busy}
          onClose={() => setSelected(null)}
          onApprove={(booking) => {
            setBusy("approve");
            void changeStatus(booking, "approved");
          }}
          onDecline={(booking) => {
            setBusy("decline");
            void changeStatus(booking, "declined");
          }}
          onAskCancel={(booking) => setConfirmState({ kind: "cancel", booking })}
          onAskDelete={(booking) => setConfirmState({ kind: "delete", booking })}
          formatDate={formatDate}
          formatMoney={formatMoney}
        />
      )}

      <BookingConfirmModal
        confirmState={confirmState}
        onClose={() => setConfirmState(null)}
        onConfirmCancel={() => {
          const booking = confirmState?.booking;
          setConfirmState(null);
          if (booking) {
            void handleCancel(booking);
          }
        }}
        onConfirmDelete={() => {
          const bookingId = confirmState?.booking.id;
          setConfirmState(null);
          if (bookingId) {
            void handleDelete(bookingId);
          }
        }}
      />

      <BookingNoticeToast
        notice={notice}
        onClose={() => setNotice(null)}
      />
    </>
  );
}
