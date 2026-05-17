import type { BookingRow } from "./types";

export const STATUS_ORDER: Readonly<Record<string, number>> = {
  requested: 0,
  approved: 1,
  declined: 2,
  cancelled: 3,
};

export function normalizeStatus(status?: string): string {
  return (status || "").toLowerCase();
}

export function isApproved(status: string): boolean {
  return ["approved", "confirmed"].includes(normalizeStatus(status));
}

export function isDeclined(status: string): boolean {
  return ["declined", "rejected", "abgelehnt"].includes(normalizeStatus(status));
}

export function isCancelled(status: string): boolean {
  return ["cancelled", "canceled", "storniert"].includes(normalizeStatus(status));
}

export function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency || "EUR",
  }).format(value || 0);
}

export function filterRows(rows: BookingRow[], searchTerm: string): BookingRow[] {
  const needle = searchTerm.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) => {
    const hay = `${row.contact?.name || ""} ${row.contact?.email || ""}`.toLowerCase();
    return hay.includes(needle);
  });
}

export function sortRows(
  rows: BookingRow[],
  sortBy: "startDate" | "status",
  sortDir: "asc" | "desc",
): BookingRow[] {
  const copy = [...rows];
  copy.sort((a, b) => {
    let comparison = 0;
    if (sortBy === "startDate") {
      comparison = a.startDate.localeCompare(b.startDate);
    } else {
      const statusA = STATUS_ORDER[normalizeStatus(a.status)] ?? 99;
      const statusB = STATUS_ORDER[normalizeStatus(b.status)] ?? 99;
      comparison = statusA - statusB;
    }
    return sortDir === "asc" ? comparison : -comparison;
  });
  return copy;
}
