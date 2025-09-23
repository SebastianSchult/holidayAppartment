import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, updateDoc, where, setDoc
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Property, Season, TouristTaxBand, Booking, Role } from "./schemas";
import { COL } from "./schemas";

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
  // createdAt/updatedAt werden serverseitig gesetzt
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

function eachNight(startISO: string, endISO: string): string[] {
  const start = new Date(startISO + "T00:00:00");
  const end = new Date(endISO + "T00:00:00");
  const out: string[] = [];
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/** Prüft, ob für alle Nächte im Bereich noch kein Hold existiert. */
export async function isRangeAvailable(propertyId: string, startISO: string, endISO: string): Promise<boolean> {
  const days = eachNight(startISO, endISO);
  if (days.length === 0) return false;
  const checks = await Promise.all(
    days.map((day) => getDoc(doc(db, COL.inventory, propertyId, "nights", day)))
  );
  return checks.every((snap) => !snap.exists());
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

/** Komfortfunktion: prüft, blockiert und setzt Status auf approved. */
export async function approveBooking(booking: Booking & { id: string }) {
  const ok = await isRangeAvailable(booking.propertyId, booking.startDate, booking.endDate);
  if (!ok) {
    throw new Error("Zeitraum ist bereits belegt.");
  }
  await blockNightsForBooking(booking.id, booking.propertyId, booking.startDate, booking.endDate);
  await updateDoc(doc(db, COL.bookings, booking.id), { status: "approved", updatedAt: new Date() });
}

/** Setzt Status auf declined (ohne Inventaränderung). */
export async function declineBooking(id: string) {
  await updateDoc(doc(db, COL.bookings, id), { status: "declined", updatedAt: new Date() });
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
  await freeNightsForBooking(booking);
  await updateDoc(doc(db, COL.bookings, booking.id), {
    status: "cancelled",
    updatedAt: new Date(),
  });
}

/** Löscht eine Buchung vollständig (nur für Admin gedacht). */
export async function deleteBooking(id: string) {
  await deleteDoc(doc(db, COL.bookings, id));
}