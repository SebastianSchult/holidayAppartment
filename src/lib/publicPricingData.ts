import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore/lite";
import { dbLite } from "./firebaseLiteDb";
import { COL } from "./schemas";
import type { Property, Season } from "./schemas";

export async function getFirstPropertyLite(): Promise<{ id: string; data: Property } | null> {
  const snap = await getDocs(query(collection(dbLite, COL.properties), limit(1)));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, data: d.data() as Property };
}

export async function getPropertyLite(id: string): Promise<Property | null> {
  const ref = doc(dbLite, COL.properties, id);
  const s = await getDoc(ref);
  return s.exists() ? (s.data() as Property) : null;
}

export async function listSeasonsLite(propertyId: string): Promise<(Season & { id: string })[]> {
  const q = query(
    collection(dbLite, COL.seasons),
    where("propertyId", "==", propertyId),
    orderBy("startDate", "asc")
  );
  const s = await getDocs(q);
  return s.docs.map((d) => ({ id: d.id, ...(d.data() as Season) }));
}
