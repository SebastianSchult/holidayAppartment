import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, updateDoc, where, setDoc, runTransaction, Timestamp
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Property, Season, TouristTaxBand, Booking, Role } from "./schemas";
import { COL } from "./schemas";

const MAIL_API = (import.meta as unknown as { env: Record<string, string | undefined> }).env.VITE_MAIL_API_URL;
const MAIL_API_KEY = (import.meta as unknown as { env: Record<string, string | undefined> }).env.VITE_MAIL_API_KEY;
const OWNER_EMAIL = (import.meta as unknown as { env: Record<string, string | undefined> }).env.VITE_OWNER_EMAIL;

async function sendAdminActionMail(
  action: "approved" | "declined" | "cancelled",
  booking: (Booking & { id: string }),
  propertyName?: string
): Promise<{ ok: boolean; detail?: string }> {
  if (!MAIL_API || !MAIL_API_KEY) {
    console.warn("[mail] skipped – MAIL_API or API_KEY missing");
    return { ok: false, detail: "mail_api_missing" };
  }
  try {
    const payload = {
      type: "admin_action",
      action,
      bookingId: booking.id,
      propertyId: booking.propertyId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      adults: booking.adults,
      children: booking.children,
      contact: booking.contact,
      message: booking.message ?? "",
      status: booking.status,
      notify: { guest: booking.contact?.email, owner: OWNER_EMAIL },
      propertyName,
    };
    const resp = await fetch(MAIL_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": MAIL_API_KEY,
      },
      body: JSON.stringify(payload),
    });
    const text = await resp.text();
    interface MailApiResponse {
      ok?: boolean;
      detail?: string;
    }
    let json: MailApiResponse | null = null;
    try { json = text ? JSON.parse(text) : null; } catch {
      // ignore JSON parse errors
    }
    if (!resp.ok) {
      const detail = json?.detail ? JSON.stringify(json.detail) : text || String(resp.status);
      console.warn("[mail] admin action failed:", resp.status, detail);
      return { ok: false, detail };
    }
    return { ok: json?.ok ?? true, detail: json?.detail ? JSON.stringify(json.detail) : undefined };
  } catch (e) {
    console.warn("[mail] admin action error:", e);
    return { ok: false, detail: e instanceof Error ? e.message : "fetch_failed" };
  }
}

/** Properties */
export async function getFirstProperty(): Promise<{ id: string; data: Property } | null> {
  const snap = await getDocs(query(collection(db, COL.properties)));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, data: d.data() as Property };
}

export async function getProperty(id: string): Promise<Property | null> {
  const ref = doc(db, COL.properties, id);
  const s = await getDoc(ref);
  return s.exists() ? (s.data() as Property) : null;
}

export async function createProperty(p: Omit<Property, "id"|"createdAt"|"updatedAt">) {
  return addDoc(collection(db, COL.properties), {
    ...p, createdAt: new Date(), updatedAt: new Date(),
  });
}

export async function updateProperty(id: string, patch: Partial<Property>) {
  return updateDoc(doc(db, COL.properties, id), { ...patch, updatedAt: new Date() });
}

/** Seasons */
export async function listSeasons(propertyId: string): Promise<(Season & { id: string })[]> {
  const q = query(
    collection(db, COL.seasons),
    where("propertyId", "==", propertyId),
    orderBy("startDate", "asc")
  );
  const s = await getDocs(q);
  return s.docs.map(d => ({ id: d.id, ...(d.data() as Season) }));
}

export async function createSeason(s: Omit<Season, "id"|"createdAt"|"updatedAt">) {
  return addDoc(collection(db, COL.seasons), { ...s, createdAt: new Date(), updatedAt: new Date() });
}

export async function updateSeason(id: string, patch: Partial<Season>) {
  return updateDoc(doc(db, COL.seasons, id), { ...patch, updatedAt: new Date() });
}

export async function deleteSeason(id: string) {
  return deleteDoc(doc(db, COL.seasons, id));
}

/** Tourist Tax Bands (Kurtaxe) */
export async function listTaxBands(propertyId: string): Promise<(TouristTaxBand & { id: string })[]> {
  const q = query(
    collection(db, COL.taxBands),
    where("propertyId", "==", propertyId),
    orderBy("zone", "asc")
  );
  const s = await getDocs(q);
  return s.docs.map(d => ({ id: d.id, ...(d.data() as TouristTaxBand) }));
}

export async function createTaxBand(band: Omit<TouristTaxBand, "id"|"createdAt"|"updatedAt">) {
  return addDoc(collection(db, COL.taxBands), { ...band, createdAt: new Date(), updatedAt: new Date() });
}

export async function updateTaxBand(id: string, patch: Partial<TouristTaxBand>) {
  return updateDoc(doc(db, COL.taxBands, id), { ...patch, updatedAt: new Date() });
}

export async function deleteTaxBand(id: string) {
  return deleteDoc(doc(db, COL.taxBands, id));
}

/** Bookings */
export async function createBookingRequest(
  data: Omit<Booking, "id" | "createdAt" | "updatedAt">
) {
  // 1) Holds für den Zeitraum anlegen (fail-fast, wenn bereits belegt/angefragt)
  await createHoldsForRange(data.propertyId, data.startDate, data.endDate);

  // 2) Buchung anlegen
  return addDoc(collection(db, COL.bookings), {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function listBookings(propertyId: string) {
  const q = query(collection(db, COL.bookings), where("propertyId", "==", propertyId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Booking) }));
}

export async function updateBookingStatus(id: string, status: "approved" | "declined") {
  const ref = doc(db, COL.bookings, id);
  await updateDoc(ref, { status, updatedAt: new Date() });
}

// --- Roles ---
export async function getRole(uid: string): Promise<Role | null> {
  const ref = doc(db, COL.roles, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Role) };
}

export async function isAdmin(uid: string): Promise<boolean> {
  const role = await getRole(uid);
  return !!role?.admin;
}

/** ---------------------------
 *  Inventory & Approval Flow
 *  --------------------------- */

function fmtLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function eachNight(startISO: string, endISO: string): string[] {
  const start = new Date(startISO + "T00:00:00");
  const end = new Date(endISO + "T00:00:00");
  const out: string[] = [];
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    out.push(fmtLocalISO(d));
  }
  return out;
}

/** ---------------------------
 *  Public Holds (temporäre Reservierungen)
 *  --------------------------- */

type HoldDoc = {
  propertyId: string;
  date: string;       // YYYY-MM-DD
  status: 'requested' | 'approved';
  expiresAt: Timestamp;
  bookingRef?: string;
  createdAt: Date;
};

const HOLDS_TTL_HOURS = 72;

/** Legt pro Nacht einen Hold an. Transaktional: schlägt fehl, wenn eine der Nächte bereits belegt/gehould ist (nicht abgelaufen). */
export async function createHoldsForRange(propertyId: string, startISO: string, endISO: string, bookingRef?: string) {
  const days = eachNight(startISO, endISO);
  if (days.length === 0) throw new Error('Ungültiger Zeitraum.');
  const now = new Date();
  const expires = new Date(now.getTime() + HOLDS_TTL_HOURS * 3600 * 1000);

  await runTransaction(db, async (tx) => {
    // Referenzen vorbereiten
    const refs = days.map((day) => ({ day, ref: doc(db, 'publicHolds', `${propertyId}_${day}`) }));

    // --- READ PHASE: alle relevanten Doks lesen & prüfen
    for (const { ref } of refs) {
      const snap = await tx.get(ref);
      if (snap.exists()) {
        const data = snap.data() as Partial<HoldDoc>;
        const exp = (data.expiresAt && data.expiresAt instanceof Timestamp) ? data.expiresAt.toDate() : null;
        // Wenn Hold noch gültig ist -> blockiert
        if (!exp || exp > now) {
          throw new Error('Zeitraum bereits angefragt.');
        }
      }
    }

    // --- WRITE PHASE: wenn frei, alle Holds setzen
    for (const { ref, day } of refs) {
      tx.set(ref, {
        propertyId,
        date: day,
        status: 'requested',
        expiresAt: Timestamp.fromDate(expires),
        bookingRef: bookingRef || '',
        createdAt: now,
      } as HoldDoc);
    }
  });
}

/** Listet aktive Holds im Bereich [fromISO, toISO). */
export async function listPublicHolds(propertyId: string, fromISO: string, toISO: string): Promise<string[]> {
  const holdsCol = collection(db, 'publicHolds');
  const qy = query(
    holdsCol,
    where('propertyId', '==', propertyId),
    where('date', '>=', fromISO),
    where('date', '<', toISO),
    where('expiresAt', '>', new Date())
  );
  const snap = await getDocs(qy);
  return snap.docs.map(d => (d.data() as { date: string }).date);
}

/** Optional: löscht Holds für einen Bereich (nur Admin-Tools). */
export async function releaseHoldsForRange(propertyId: string, startISO: string, endISO: string) {
  const days = eachNight(startISO, endISO);
  await Promise.all(days.map(day => deleteDoc(doc(db, 'publicHolds', `${propertyId}_${day}`))));
}

/** Prüft, ob für alle Nächte im Bereich noch kein Hold existiert. */
export async function isRangeAvailable(propertyId: string, startISO: string, endISO: string): Promise<boolean> {
  const days = eachNight(startISO, endISO);
  if (days.length === 0) return false;

  // 1) Inventar (bestätigte Buchungen)
  const invChecks = await Promise.all(
    days.map((day) => getDoc(doc(db, COL.inventory, propertyId, 'nights', day)))
  );
  const invFree = invChecks.every((snap) => !snap.exists());
  if (!invFree) return false;

  // 2) Aktive Holds
  const fromISO = startISO;
  const toISO = endISO;
  const holds = await listPublicHolds(propertyId, fromISO, toISO);
  return holds.length === 0;
}

/** Blockiert alle Nächte für eine bestätigte Buchung. */
export async function blockNightsForBooking(
  bookingId: string,
  propertyId: string,
  startISO: string,
  endISO: string
) {
  const days = eachNight(startISO, endISO);
  await Promise.all(
    days.map((day) =>
      setDoc(
        doc(db, COL.inventory, propertyId, "nights", day),
        { bookingId, propertyId, date: day, createdAt: new Date() },
        { merge: true }
      )
    )
  );
}

/** Prüft nur das Inventar (bestätigte Nächte), ignoriert Holds. */
export async function isInventoryFreeRange(propertyId: string, startISO: string, endISO: string): Promise<boolean> {
  const days = eachNight(startISO, endISO);
  if (days.length === 0) return false;
  const checks = await Promise.all(
    days.map((day) => getDoc(doc(db, COL.inventory, propertyId, 'nights', day)))
  );
  return checks.every((snap) => !snap.exists());
}

/** Komfortfunktion: prüft, blockiert und setzt Status auf approved. */
export async function approveBooking(booking: Booking & { id: string }) {
  // Für die Freigabe zählt nur das Inventar. Holds (angefragte Reservierungen) blockieren die Freigabe nicht.
  const invFree = await isInventoryFreeRange(booking.propertyId, booking.startDate, booking.endDate);
  if (!invFree) {
    throw new Error('Zeitraum ist bereits bestätigt belegt.');
  }

  await blockNightsForBooking(booking.id, booking.propertyId, booking.startDate, booking.endDate);
  await updateDoc(doc(db, COL.bookings, booking.id), { status: 'approved', updatedAt: new Date() });

  // Holds für diesen Bereich bereinigen (alle angefragten Reservierungen für die betroffenen Nächte entfernen)
  await releaseHoldsForRange(booking.propertyId, booking.startDate, booking.endDate);

  const prop = await getProperty(booking.propertyId);
  const pname = prop?.name || 'Antjes Ankerplatz';
  return await sendAdminActionMail('approved', booking, pname);
}

/** Setzt Status auf declined (ohne Inventaränderung). */
export async function declineBooking(id: string) {
  const ref = doc(db, COL.bookings, id);
  const snap = await getDoc(ref);
  await updateDoc(ref, { status: "declined", updatedAt: new Date() });
  if (snap.exists()) {
    const b = { id: snap.id, ...(snap.data() as Booking) } as Booking & { id: string };
    // Vormerkungen (Holds) für den Zeitraum freigeben
    await releaseHoldsForRange(b.propertyId, b.startDate, b.endDate);
    const prop = await getProperty(b.propertyId);
    const pname = prop?.name || "Antjes Ankerplatz";
    return await sendAdminActionMail("declined", b, pname);
  }
  return { ok: true };
}

/**
 * Liefert belegte Nächte im Bereich [fromISO, toISO) als ISO-Strings (YYYY-MM-DD).
 * Erwartet, dass jedes Night-Dokument ein Feld `date` (YYYY-MM-DD) enthält.
 */
export async function listBlockedNights(
  propertyId: string,
  fromISO: string,
  toISO: string
): Promise<string[]> {
  if (!fromISO || !toISO) return [];
  const nightsCol = collection(db, COL.inventory, propertyId, "nights");
  const qy = query(
    nightsCol,
    where("date", ">=", fromISO),
    where("date", "<", toISO)
  );
  const snap = await getDocs(qy);
  return snap.docs
    .map((d) => (d.data() as { date?: string }).date || d.id)
    .filter(Boolean) as string[];
}

/** Belegte Nächte = Inventory (approved) + aktive Holds */
export async function listUnavailableNights(propertyId: string, fromISO: string, toISO: string): Promise<string[]> {
  const [inv, holds] = await Promise.all([
    listBlockedNights(propertyId, fromISO, toISO),
    listPublicHolds(propertyId, fromISO, toISO),
  ]);
  const set = new Set([...inv, ...holds]);
  return Array.from(set).sort();
}

/**
 * Liefert bestätigte Buchungen (clientseitig nach Zeitraum gefiltert).
 * Hinweis: Wir nutzen listBookings() und filtern, um Index-Anforderungen zu sparen.
 */
export async function listApprovedBookings(
  propertyId: string,
  fromISO?: string,
  toISO?: string
): Promise<(Booking & { id: string })[]> {
  const all = await listBookings(propertyId);
  const approved = all.filter((b) => b.status === "approved");
  if (!fromISO || !toISO) return approved;
  // Überschneidung: (b.startDate < toISO) && (b.endDate > fromISO)
  return approved.filter((b) => b.startDate < toISO && b.endDate > fromISO);
}

/** Liefert Buchungen (approved ODER requested), die sich mit einem Zeitraum überschneiden. */
export async function listOverlapBookings(
  propertyId: string,
  fromISO: string,
  toISO: string
): Promise<(Booking & { id: string })[]> {
  const all = await listBookings(propertyId);
  return all.filter(
    (b) =>
      (b.status === "approved" || b.status === "requested") &&
      b.startDate < toISO &&
      b.endDate > fromISO
  );
}

/** Gibt für eine Buchung alle geblockten Nächte frei (sicherheitsbewusst). */
export async function freeNightsForBooking(booking: Booking & { id: string }) {
  const days = eachNight(booking.startDate, booking.endDate);
  await Promise.all(
    days.map(async (day) => {
      const ref = doc(db, COL.inventory, booking.propertyId, "nights", day);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as { bookingId?: string };
        if (!data.bookingId || data.bookingId === booking.id) {
          await deleteDoc(ref);
        }
      }
    })
  );
}

/** Storniert eine bestätigte Buchung: Nächte freigeben + Status auf "cancelled". */
export async function cancelBooking(booking: Booking & { id: string }) {
  // Inventar freigeben
  await freeNightsForBooking(booking);
  await updateDoc(doc(db, COL.bookings, booking.id), {
    status: "cancelled",
    updatedAt: new Date(),
  });
  // Etwaige Holds im Zeitraum ebenfalls freigeben (robust, auch wenn idR nach Approval bereits entfernt)
  await releaseHoldsForRange(booking.propertyId, booking.startDate, booking.endDate);

  const prop = await getProperty(booking.propertyId);
  const pname = prop?.name || "Antjes Ankerplatz";
  return await sendAdminActionMail("cancelled", booking, pname);
}

/** Löscht eine Buchung vollständig (nur für Admin gedacht). */
export async function deleteBooking(id: string) {
  const ref = doc(db, COL.bookings, id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const b = { id: snap.id, ...(snap.data() as Booking) } as Booking & { id: string };
    await releaseHoldsForRange(b.propertyId, b.startDate, b.endDate);
  }
  await deleteDoc(ref);
}

/** ---------------------------
 *  Inventory Maintenance
 *  --------------------------- */

/** Löscht alle Inventory-Nächte im Bereich [fromISO, toISO). */
export async function clearInventoryRange(propertyId: string, fromISO: string, toISO: string) {
  const nightsCol = collection(db, COL.inventory, propertyId, "nights");
  const qy = query(nightsCol, where("date", ">=", fromISO), where("date", "<", toISO));
  const snap = await getDocs(qy);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

/** Bereinigt und baut die Nächte aus bestätigten Buchungen neu auf. */
export async function rebuildInventoryFromApproved(propertyId: string, fromISO: string, toISO: string) {
  await clearInventoryRange(propertyId, fromISO, toISO);
  const approved = await listApprovedBookings(propertyId, fromISO, toISO);
  for (const b of approved) {
    await blockNightsForBooking(b.id, b.propertyId, b.startDate, b.endDate);
  }
}