import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, updateDoc, where
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Property, Season, TouristTaxBand } from "./schemas";
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