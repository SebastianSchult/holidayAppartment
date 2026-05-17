import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  where,
} from "firebase/firestore";
import { db } from "../firebaseDb";
import { eachNight } from "./dates";

type HoldDoc = {
  propertyId: string;
  date: string;
  status: "requested" | "approved";
  expiresAt: Timestamp;
  bookingRef?: string;
  createdAt: Date;
};

const HOLDS_TTL_HOURS = 72;

export async function createHoldsForRange(
  propertyId: string,
  startISO: string,
  endISO: string,
  bookingRef?: string,
) {
  const dates = eachNight(startISO, endISO);
  if (dates.length === 0) {
    throw new Error("Ungultiger Zeitraum.");
  }

  const now = new Date();
  const expires = new Date(now.getTime() + HOLDS_TTL_HOURS * 3600 * 1000);

  await runTransaction(db, async (tx) => {
    const refs = dates.map((date) => ({
      date,
      ref: doc(db, "publicHolds", `${propertyId}_${date}`),
    }));

    for (const { ref } of refs) {
      const snap = await tx.get(ref);
      if (!snap.exists()) continue;

      const data = snap.data() as Partial<HoldDoc>;
      const expiresAt =
        data.expiresAt && data.expiresAt instanceof Timestamp
          ? data.expiresAt.toDate()
          : null;

      if (!expiresAt || expiresAt > now) {
        throw new Error("Zeitraum bereits angefragt.");
      }
    }

    for (const { ref, date } of refs) {
      tx.set(ref, {
        propertyId,
        date,
        status: "requested",
        expiresAt: Timestamp.fromDate(expires),
        bookingRef: bookingRef || "",
        createdAt: now,
      } as HoldDoc);
    }
  });
}

export async function listPublicHolds(
  propertyId: string,
  fromISO: string,
  toISO: string,
): Promise<string[]> {
  const holdsQuery = query(
    collection(db, "publicHolds"),
    where("propertyId", "==", propertyId),
    where("date", ">=", fromISO),
    where("date", "<", toISO),
    where("expiresAt", ">", new Date()),
  );
  const snapshot = await getDocs(holdsQuery);
  return snapshot.docs.map((entry) => (entry.data() as { date: string }).date);
}

export async function releaseHoldsForRange(
  propertyId: string,
  startISO: string,
  endISO: string,
) {
  const dates = eachNight(startISO, endISO);
  await Promise.all(
    dates.map((date) => deleteDoc(doc(db, "publicHolds", `${propertyId}_${date}`))),
  );
}

export async function canCreatePublicHoldsForRange(
  propertyId: string,
  startISO: string,
  endISO: string,
): Promise<boolean> {
  const dates = eachNight(startISO, endISO);
  if (dates.length === 0) return false;

  const checks = await Promise.all(
    dates.map((date) => getDoc(doc(db, "publicHolds", `${propertyId}_${date}`))),
  );

  return checks.every((snap) => !snap.exists());
}
