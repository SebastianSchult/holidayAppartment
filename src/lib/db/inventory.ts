import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebaseDb";
import { COL, type Booking } from "../schemas";
import { eachNight } from "./dates";
import { listPublicHolds } from "./holds";

export async function blockNightsForBooking(
  bookingId: string,
  propertyId: string,
  startISO: string,
  endISO: string,
) {
  const dates = eachNight(startISO, endISO);
  await Promise.all(
    dates.map((date) =>
      setDoc(
        doc(db, COL.inventory, propertyId, "nights", date),
        { bookingId, propertyId, date, createdAt: new Date() },
        { merge: true },
      ),
    ),
  );
}

export async function listBlockedNights(
  propertyId: string,
  fromISO: string,
  toISO: string,
): Promise<string[]> {
  if (!fromISO || !toISO) return [];

  const nightsQuery = query(
    collection(db, COL.inventory, propertyId, "nights"),
    where("date", ">=", fromISO),
    where("date", "<", toISO),
  );

  const snapshot = await getDocs(nightsQuery);
  return snapshot.docs
    .map((entry) => (entry.data() as { date?: string }).date || entry.id)
    .filter(Boolean) as string[];
}

export async function listUnavailableNights(
  propertyId: string,
  fromISO: string,
  toISO: string,
): Promise<string[]> {
  const [inventoryDates, holdDates] = await Promise.all([
    listBlockedNights(propertyId, fromISO, toISO),
    listPublicHolds(propertyId, fromISO, toISO),
  ]);
  return Array.from(new Set([...inventoryDates, ...holdDates])).sort();
}

export async function isInventoryFreeRange(
  propertyId: string,
  startISO: string,
  endISO: string,
): Promise<boolean> {
  const dates = eachNight(startISO, endISO);
  if (dates.length === 0) return false;

  const checks = await Promise.all(
    dates.map((date) => getDoc(doc(db, COL.inventory, propertyId, "nights", date))),
  );
  return checks.every((snap) => !snap.exists());
}

export async function isRangeAvailable(
  propertyId: string,
  startISO: string,
  endISO: string,
): Promise<boolean> {
  const dates = eachNight(startISO, endISO);
  if (dates.length === 0) return false;

  const inventoryChecks = await Promise.all(
    dates.map((date) => getDoc(doc(db, COL.inventory, propertyId, "nights", date))),
  );
  const inventoryFree = inventoryChecks.every((snap) => !snap.exists());
  if (!inventoryFree) return false;

  const holdDates = await listPublicHolds(propertyId, startISO, endISO);
  return holdDates.length === 0;
}

export async function freeNightsForBooking(booking: Booking & { id: string }) {
  const dates = eachNight(booking.startDate, booking.endDate);
  await Promise.all(
    dates.map(async (date) => {
      const ref = doc(db, COL.inventory, booking.propertyId, "nights", date);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      const data = snap.data() as { bookingId?: string };
      if (!data.bookingId || data.bookingId === booking.id) {
        await deleteDoc(ref);
      }
    }),
  );
}

export async function clearInventoryRange(
  propertyId: string,
  fromISO: string,
  toISO: string,
) {
  const nightsQuery = query(
    collection(db, COL.inventory, propertyId, "nights"),
    where("date", ">=", fromISO),
    where("date", "<", toISO),
  );
  const snapshot = await getDocs(nightsQuery);
  await Promise.all(snapshot.docs.map((entry) => deleteDoc(entry.ref)));
}
