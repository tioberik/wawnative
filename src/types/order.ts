import type { Timestamp } from "firebase/firestore";

/** Mogući statusi narudžbe (pojednostavljeni WAW model). */
export type OrderStatus =
  | "nova"
  | "spremna"
  | "poslana"
  | "dostavljena"
  | "otkazana";

/** Redoslijed i prikazna imena statusa za UI. */
export const ORDER_STATUSES: { value: OrderStatus; label: string; color: string }[] = [
  { value: "nova", label: "Nova", color: "#3B82F6" },
  { value: "spremna", label: "Spremna", color: "#10B981" },
  { value: "poslana", label: "Poslana", color: "#8B5CF6" },
  { value: "dostavljena", label: "Dostavljena", color: "#059669" },
  { value: "otkazana", label: "Otkazana", color: "#9CA3AF" },
];

export function statusMeta(status: OrderStatus) {
  return ORDER_STATUSES.find((s) => s.value === status) ?? ORDER_STATUSES[0];
}

/** Geografska lokacija zabilježena pri kreiranju narudžbe (GPS). */
export type GeoLocation = {
  lat: number;
  lng: number;
};

/** Foto prilog uz narudžbu (spremljen u Firebase Storage). */
export type Attachment = {
  id: string;          // jedinstveni id priloga
  url: string;         // URL pune slike
  thumbUrl: string;    // URL umanjene sličice (thumbnail)
  path: string;        // putanja pune slike u Storage-u (za brisanje)
  thumbPath: string;   // putanja thumbnaila u Storage-u
  name: string;        // naziv datoteke
  uploadedAt: number;  // timestamp (ms)
};

/** Narudžba kako je spremljena u Firestore-u. */
export type Order = {
  id: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  codAmount: number;
  note: string;
  location: GeoLocation | null;
  attachments: Attachment[];
  ownerId: string;
  ownerName?: string; // ime korisnika koji je kreirao (denormalizovano)
  createdAt: Timestamp | null;
};

/** Polja koja korisnik unosi pri kreiranju/uređivanju narudžbe. */
export type OrderInput = {
  customerId: string;
  customerName: string;
  status: OrderStatus;
  codAmount: number;
  note: string;
  location: GeoLocation | null;
};
