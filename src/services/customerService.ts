import { firestore } from "@/lib/firebase";
import type { Customer, CustomerInput } from "@/types/customer";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

const COLLECTION = "customers";

/**
 * Real-time pretplata na kupce prijavljenog korisnika.
 * Vraća funkciju za odjavu (unsubscribe). Lista se automatski osvježava
 * pri svakoj promjeni u bazi.
 */
export function subscribeCustomers(
  ownerId: string,
  onData: (customers: Customer[]) => void,
  onError: (error: Error) => void
): () => void {
  const q = query(
    collection(firestore, COLLECTION),
    where("ownerId", "==", ownerId),
    orderBy("name", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Customer[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Customer, "id">),
      }));
      onData(list);
    },
    (error) => onError(error)
  );
}

/** Dohvati sve kupce prijavljenog korisnika (jednokratno) — npr. za izbor u formi. */
export async function getCustomers(ownerId: string): Promise<Customer[]> {
  const q = query(
    collection(firestore, COLLECTION),
    where("ownerId", "==", ownerId),
    orderBy("name", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Customer, "id">) }));
}

/** Dohvati jednog kupca po ID-u (jednokratno). */
export async function getCustomer(id: string): Promise<Customer | null> {
  const snap = await getDoc(doc(firestore, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Customer, "id">) };
}

/** Kreiraj novog kupca. */
export async function createCustomer(
  ownerId: string,
  input: CustomerInput
): Promise<string> {
  const ref = await addDoc(collection(firestore, COLLECTION), {
    ...input,
    ownerId,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Ažuriraj postojećeg kupca. */
export async function updateCustomer(
  id: string,
  input: CustomerInput
): Promise<void> {
  await updateDoc(doc(firestore, COLLECTION, id), { ...input });
}

/** Obriši kupca. */
export async function deleteCustomer(id: string): Promise<void> {
  await deleteDoc(doc(firestore, COLLECTION, id));
}
