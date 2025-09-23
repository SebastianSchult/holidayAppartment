import { addDays, differenceInCalendarDays, isBefore, isEqual, parseISO } from "date-fns";
import type { Property, Season, TouristTaxBand } from "./schemas";

/**
 * Returns number of charged nights between start (check-in) and end (check-out) dates.
 * Both dates must be ISO YYYY-MM-DD. End must be after start.
 */
export function nightsBetween(startISO: string, endISO: string): number {
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  const n = differenceInCalendarDays(end, start);
  if (n <= 0) throw new Error("endDate must be after startDate (at least 1 night)");
  return n;
}

/** True if d is in [start, end) with end exclusive */
function dateInRangeInclusiveExclusive(d: Date, startISO: string, endISO: string): boolean {
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  // d >= s && d < e
  return (isEqual(d, s) || isBefore(s, d)) && isBefore(d, e);
}

/** Find the season that applies for a given date, if any. */
export function seasonForDate(d: Date, seasons: Season[]): Season | undefined {
  return seasons.find((s) => dateInRangeInclusiveExclusive(d, s.startDate, s.endDate));
}

export interface PriceBreakdownNight {
  date: string;          // YYYY-MM-DD
  nightlyRate: number;   // rate applied for that night
  seasonId?: string;     // optional season id
}

export interface PriceResult {
  nights: number;
  nightsTotal: number;   // sum of nightly rates
  cleaningFee: number;
  total: number;         // nightsTotal + cleaningFee
  currency: string;
  breakdown: PriceBreakdownNight[];
}

/**
 * Calculate price for a stay using property defaultNightlyRate, optional seasons and cleaningFee.
 * - Seasons override nightly rate for dates within [startDate, endDate) (end exclusive).
 * - cleaningFee is added once per stay.
 * - Throws if endDate <= startDate.
 */
export function priceForStay(
  property: Property,
  seasons: Season[],
  startISO: string,
  endISO: string
): PriceResult {
  const nights = nightsBetween(startISO, endISO);
  const start = parseISO(startISO);
  const breakdown: PriceBreakdownNight[] = [];

  let nightsTotal = 0;
  for (let i = 0; i < nights; i++) {
    const d = addDays(start, i);
    const dISO = d.toISOString().slice(0, 10);
    const season = seasonForDate(d, seasons);
    const rate = season?.nightlyRate ?? property.defaultNightlyRate;
    nightsTotal += rate;
    breakdown.push({ date: dISO, nightlyRate: rate, seasonId: season?.id });
  }

  const cleaningFee = property.cleaningFee ?? 0;
  const total = nightsTotal + cleaningFee;

  return {
    nights,
    nightsTotal,
    cleaningFee,
    total,
    currency: property.currency || "EUR",
    breakdown,
  };
}

/**
 * Optional helper: sanity-check minimum nights for a season window.
 * Returns the minimal nights required for the provided date range based on seasons with minNights.
 */
export function minNightsRequired(seasons: Season[], startISO: string, endISO: string): number {
  const nights = nightsBetween(startISO, endISO);
  const start = parseISO(startISO);
  let required = 1;
  for (let i = 0; i < nights; i++) {
    const d = addDays(start, i);
    const s = seasonForDate(d, seasons);
    if (s?.minNights && s.minNights > required) required = s.minNights;
  }
  return required;
}
// -------------------------------------------------------------
// Tourist Tax (Kurtaxe) helpers
// -------------------------------------------------------------

/** Format Date -> MM-DD (e.g. 04-01) */
function toMonthDay(d: Date): string {
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${m}-${day}`;
}

/** Check if date is within any recurring month-day range (end exclusive). Handles year wrap (e.g. 12-25..01-07). */
function inMonthDayRanges(
  d: Date,
  ranges: { startMD: string; endMD: string }[]
): boolean {
  const md = toMonthDay(d);
  for (const r of ranges) {
    const s = r.startMD;
    const e = r.endMD;
    // Normal case: s <= e (e.g., 04-01..10-31)
    if (s <= e) {
      if (md >= s && md < e) return true;
    } else {
      // Year wrap: s > e (e.g., 12-25..01-07)
      if (md >= s || md < e) return true;
    }
  }
  return false;
}

export interface TouristTaxBreakdownNight {
  date: string;        // YYYY-MM-DD
  perPerson: number;   // rate per adult per night
  persons: number;     // number of chargeable persons (e.g., adults >= 16)
  total: number;       // perPerson * persons
  bandId?: string;
  bandLabel?: string;
}

export interface TouristTaxResult {
  nights: number;
  total: number;
  breakdown: TouristTaxBreakdownNight[];
}

/**
 * Compute tourist tax for a stay based on recurring month-day ranges.
 * - Uses the first matching band per date; if none matches, tax is 0 for that night.
 * - `adults` is the number of chargeable persons (>= 16 years).
 */
export function touristTaxForStay(
  taxBands: TouristTaxBand[],
  startISO: string,
  endISO: string,
  adults: number
): TouristTaxResult {
  const nights = nightsBetween(startISO, endISO);
  const start = parseISO(startISO);
  const breakdown: TouristTaxBreakdownNight[] = [];
  let total = 0;

  const persons = Math.max(0, adults);

  for (let i = 0; i < nights; i++) {
    const d = addDays(start, i);
    const dISO = d.toISOString().slice(0, 10);

    // Find first matching band by ranges
    const band = taxBands.find((b) => inMonthDayRanges(d, b.ranges));
    const perPerson = band?.rate ?? 0;
    const t = perPerson * persons;

    total += t;
    breakdown.push({
      date: dISO,
      perPerson,
      persons,
      total: t,
      bandId: band?.id,
      bandLabel: band?.label,
    });
  }

  return { nights, total, breakdown };
}