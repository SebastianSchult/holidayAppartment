import type { User } from "firebase/auth";
import {
  collectionGroup,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebaseDb";

function getDefaultPropertyId(): string | null {
  const envId = (
    import.meta as unknown as { env: Record<string, string | undefined> }
  ).env.VITE_DEFAULT_PROPERTY_ID?.trim();
  return envId || null;
}

export async function getIsAdminRole(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "roles", uid));
  const data = snap.data() as { admin?: boolean } | undefined;
  return !!(data && data.admin === true);
}

export async function hasMemberAccessForUser(user: User): Promise<boolean> {
  const defaultPropertyId = getDefaultPropertyId();

  if (defaultPropertyId) {
    const memberDoc = await getDoc(doc(db, "properties", defaultPropertyId, "members", user.uid));
    if (memberDoc.exists()) {
      return true;
    }
  }

  const byUid = query(
    collectionGroup(db, "members"),
    where(documentId(), "==", user.uid),
    limit(1),
  );
  const byUidSnap = await getDocs(byUid);
  if (!byUidSnap.empty) {
    return true;
  }

  if (!user.email) {
    return false;
  }

  const byEmail = query(
    collectionGroup(db, "members"),
    where("email", "==", user.email),
    limit(1),
  );
  const byEmailSnap = await getDocs(byEmail);
  return !byEmailSnap.empty;
}

export async function hasAdminOrManagerAccess(user: User): Promise<boolean> {
  try {
    const token = await user.getIdTokenResult();
    if (token.claims?.isAdmin === true) {
      return true;
    }
  } catch {
    // ignore token claim lookup failures and continue with data-based checks
  }

  return hasMemberAccessForUser(user);
}
