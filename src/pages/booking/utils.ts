export type Notice = { type: "success" | "error"; text: string };

export type NightlyBreakdownRow = {
  date: string;
  label: string;
  rate: number;
  tax: number;
  subtotal: number;
};

type SeasonLike = {
  name: string;
  startDate: string;
  endDate: string;
  nightlyRate: number;
};

export function formatLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseIsoAtLocalNoon(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00`);
}

export function parseIsoAtLocalMidnight(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00`);
}

export function calculateNights(start: string, end: string): number {
  const a = parseIsoAtLocalNoon(start);
  const b = parseIsoAtLocalNoon(end);
  const diff = Math.round((b.getTime() - a.getTime()) / 86400000);
  return Math.max(0, diff);
}

export function buildNightlyBreakdown(params: {
  start: string;
  end: string;
  seasons: SeasonLike[];
  defaultRate: number;
  adults: number;
  getTaxForNight: (startDate: string, endDate: string, adults: number) => number;
  fallbackRateLabel: string;
}): NightlyBreakdownRow[] {
  const rows: NightlyBreakdownRow[] = [];
  const startDate = new Date(`${params.start}T00:00:00`);
  const endDate = new Date(`${params.end}T00:00:00`);

  for (let date = new Date(startDate); date < endDate; date.setDate(date.getDate() + 1)) {
    const iso = formatLocalISO(date);
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const nextIso = formatLocalISO(next);
    const season = params.seasons.find((item) => iso >= item.startDate && iso < item.endDate);
    const rate = season?.nightlyRate ?? params.defaultRate;
    const tax = params.getTaxForNight(iso, nextIso, params.adults);
    rows.push({
      date: iso,
      label: season?.name || params.fallbackRateLabel,
      rate,
      tax,
      subtotal: rate + tax,
    });
  }

  return rows;
}
