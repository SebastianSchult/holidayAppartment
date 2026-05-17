import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebaseDb";
import { COL, type Property, type Role, type Season, type TouristTaxBand } from "../schemas";

export async function getFirstProperty(): Promise<{ id: string; data: Property } | null> {
  const snapshot = await getDocs(query(collection(db, COL.properties), limit(1)));
  if (snapshot.empty) return null;
  const first = snapshot.docs[0];
  return { id: first.id, data: first.data() as Property };
}

export async function getProperty(id: string): Promise<Property | null> {
  const ref = doc(db, COL.properties, id);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as Property) : null;
}

export async function createProperty(property: Omit<Property, "id" | "createdAt" | "updatedAt">) {
  return addDoc(collection(db, COL.properties), {
    ...property,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function updateProperty(id: string, patch: Partial<Property>) {
  return updateDoc(doc(db, COL.properties, id), {
    ...patch,
    updatedAt: new Date(),
  });
}

export async function listSeasons(propertyId: string): Promise<(Season & { id: string })[]> {
  const seasonQuery = query(
    collection(db, COL.seasons),
    where("propertyId", "==", propertyId),
    orderBy("startDate", "asc"),
  );
  const snapshot = await getDocs(seasonQuery);
  return snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Season) }));
}

export async function createSeason(season: Omit<Season, "id" | "createdAt" | "updatedAt">) {
  return addDoc(collection(db, COL.seasons), {
    ...season,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function updateSeason(id: string, patch: Partial<Season>) {
  return updateDoc(doc(db, COL.seasons, id), {
    ...patch,
    updatedAt: new Date(),
  });
}

export async function deleteSeason(id: string) {
  return deleteDoc(doc(db, COL.seasons, id));
}

export async function listTaxBands(propertyId: string): Promise<(TouristTaxBand & { id: string })[]> {
  const taxQuery = query(
    collection(db, COL.taxBands),
    where("propertyId", "==", propertyId),
    orderBy("zone", "asc"),
  );
  const snapshot = await getDocs(taxQuery);
  return snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as TouristTaxBand) }));
}

export async function createTaxBand(
  band: Omit<TouristTaxBand, "id" | "createdAt" | "updatedAt">,
) {
  return addDoc(collection(db, COL.taxBands), {
    ...band,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function updateTaxBand(id: string, patch: Partial<TouristTaxBand>) {
  return updateDoc(doc(db, COL.taxBands, id), {
    ...patch,
    updatedAt: new Date(),
  });
}

export async function deleteTaxBand(id: string) {
  return deleteDoc(doc(db, COL.taxBands, id));
}

export async function getRole(uid: string): Promise<Role | null> {
  const ref = doc(db, COL.roles, uid);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...(snapshot.data() as Role) };
}

export async function isAdmin(uid: string): Promise<boolean> {
  const role = await getRole(uid);
  return !!role?.admin;
}
