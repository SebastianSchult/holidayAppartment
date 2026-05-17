import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebaseDb";
import { COL, type Booking } from "../schemas";
import { blockNightsForBooking, clearInventoryRange, freeNightsForBooking, isInventoryFreeRange } from "./inventory";
import { createHoldsForRange, releaseHoldsForRange } from "./holds";
import { sendAdminActionMail } from "./mail";
import { getProperty } from "./properties";

export async function createBookingRequest(
  data: Omit<Booking, "id" | "createdAt" | "updatedAt">,
) {
  await createHoldsForRange(data.propertyId, data.startDate, data.endDate);

  return addDoc(collection(db, COL.bookings), {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function listBookings(propertyId: string): Promise<(Booking & { id: string })[]> {
  const bookingsQuery = query(
    collection(db, COL.bookings),
    where("propertyId", "==", propertyId),
  );
  const snapshot = await getDocs(bookingsQuery);
  return snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Booking) }));
}

export async function updateBookingStatus(id: string, status: "approved" | "declined") {
  await updateDoc(doc(db, COL.bookings, id), { status, updatedAt: new Date() });
}

export async function approveBooking(booking: Booking & { id: string }) {
  const inventoryFree = await isInventoryFreeRange(
    booking.propertyId,
    booking.startDate,
    booking.endDate,
  );
  if (!inventoryFree) {
    throw new Error("Zeitraum ist bereits bestatigt belegt.");
  }

  await blockNightsForBooking(booking.id, booking.propertyId, booking.startDate, booking.endDate);
  await updateDoc(doc(db, COL.bookings, booking.id), {
    status: "approved",
    updatedAt: new Date(),
  });
  await releaseHoldsForRange(booking.propertyId, booking.startDate, booking.endDate);

  const property = await getProperty(booking.propertyId);
  const propertyName = property?.name || "Antjes Ankerplatz";
  return sendAdminActionMail("approved", booking, propertyName);
}

export async function declineBooking(id: string) {
  const ref = doc(db, COL.bookings, id);
  const snapshot = await getDoc(ref);
  await updateDoc(ref, { status: "declined", updatedAt: new Date() });

  if (!snapshot.exists()) {
    return { ok: true };
  }

  const booking = { id: snapshot.id, ...(snapshot.data() as Booking) } as Booking & { id: string };
  await releaseHoldsForRange(booking.propertyId, booking.startDate, booking.endDate);

  const property = await getProperty(booking.propertyId);
  const propertyName = property?.name || "Antjes Ankerplatz";
  return sendAdminActionMail("declined", booking, propertyName);
}

export async function listApprovedBookings(
  propertyId: string,
  fromISO?: string,
  toISO?: string,
): Promise<(Booking & { id: string })[]> {
  const constraints = [
    where("propertyId", "==", propertyId),
    where("status", "==", "approved"),
    ...(fromISO && toISO
      ? [where("startDate", "<", toISO), where("endDate", ">", fromISO)]
      : []),
  ];

  const snapshot = await getDocs(query(collection(db, COL.bookings), ...constraints));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Booking) }));
}

export async function listOverlapBookings(
  propertyId: string,
  fromISO: string,
  toISO: string,
): Promise<(Booking & { id: string })[]> {
  const overlapQuery = query(
    collection(db, COL.bookings),
    where("propertyId", "==", propertyId),
    where("status", "in", ["approved", "requested"]),
    where("startDate", "<", toISO),
    where("endDate", ">", fromISO),
  );

  const snapshot = await getDocs(overlapQuery);
  return snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Booking) }));
}

export async function cancelBooking(booking: Booking & { id: string }) {
  await freeNightsForBooking(booking);
  await updateDoc(doc(db, COL.bookings, booking.id), {
    status: "cancelled",
    updatedAt: new Date(),
  });
  await releaseHoldsForRange(booking.propertyId, booking.startDate, booking.endDate);

  const property = await getProperty(booking.propertyId);
  const propertyName = property?.name || "Antjes Ankerplatz";
  return sendAdminActionMail("cancelled", booking, propertyName);
}

export async function deleteBooking(id: string) {
  const ref = doc(db, COL.bookings, id);
  const snapshot = await getDoc(ref);
  if (snapshot.exists()) {
    const booking = { id: snapshot.id, ...(snapshot.data() as Booking) } as Booking & { id: string };
    await releaseHoldsForRange(booking.propertyId, booking.startDate, booking.endDate);
  }
  await deleteDoc(ref);
}

export async function rebuildInventoryFromApproved(
  propertyId: string,
  fromISO: string,
  toISO: string,
) {
  await clearInventoryRange(propertyId, fromISO, toISO);
  const approved = await listApprovedBookings(propertyId, fromISO, toISO);
  for (const booking of approved) {
    await blockNightsForBooking(booking.id, booking.propertyId, booking.startDate, booking.endDate);
  }
}
