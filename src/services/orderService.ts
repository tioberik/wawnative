import { firestore } from "@/lib/firebase";
import type { Order, OrderInput, OrderStatus } from "@/types/order";
import type { Attachment } from "@/types/order";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

const COLLECTION = "orders";

/**
 * Real-time pretplata na narudžbe prijavljenog korisnika.
 * Vraća funkciju za odjavu (unsubscribe).
 */
export function subscribeOrders(
  ownerId: string,
  onData: (orders: Order[]) => void,
  onError: (error: Error) => void
): () => void {
  const q = query(
    collection(firestore, COLLECTION),
    where("ownerId", "==", ownerId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Order[] = snapshot.docs.map((d) => {
        const data = d.data() as Omit<Order, "id">;
        return { id: d.id, ...data, attachments: data.attachments ?? [] };
      });
      onData(list);
    },
    (error) => onError(error)
  );
}

/** Dohvati jednu narudžbu po ID-u (jednokratno). */
export async function getOrder(id: string): Promise<Order | null> {
  const snap = await getDoc(doc(firestore, COLLECTION, id));
  if (!snap.exists()) return null;
  const data = snap.data() as Omit<Order, "id">;
  return { id: snap.id, ...data, attachments: data.attachments ?? [] };
}

/** Kreiraj novu narudžbu. */
export async function createOrder(
  ownerId: string,
  input: OrderInput
): Promise<string> {
  const ref = await addDoc(collection(firestore, COLLECTION), {
    ...input,
    attachments: [],
    ownerId,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Ažuriraj postojeću narudžbu. */
export async function updateOrder(
  id: string,
  input: OrderInput
): Promise<void> {
  await updateDoc(doc(firestore, COLLECTION, id), { ...input });
}

/** Promijeni samo status narudžbe. */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<void> {
  await updateDoc(doc(firestore, COLLECTION, id), { status });
}

/** Obriši narudžbu. */
export async function deleteOrder(id: string): Promise<void> {
  await deleteDoc(doc(firestore, COLLECTION, id));
}

/** Dodaj prilog u narudžbu (u attachments niz). */
export async function addAttachment(
  orderId: string,
  attachment: Attachment
): Promise<void> {
  await updateDoc(doc(firestore, COLLECTION, orderId), {
    attachments: arrayUnion(attachment),
  });
}

/** Ukloni prilog iz narudžbe (iz attachments niza). */
export async function removeAttachment(
  orderId: string,
  attachment: Attachment
): Promise<void> {
  await updateDoc(doc(firestore, COLLECTION, orderId), {
    attachments: arrayRemove(attachment),
  });
}
