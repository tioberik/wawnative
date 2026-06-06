import type { Timestamp } from "firebase/firestore";

/** Kupac kako je spremljen u Firestore-u. */
export type Customer = {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  ownerId: string;
  createdAt: Timestamp | null;
};

/** Polja koja korisnik unosi pri kreiranju/uređivanju kupca. */
export type CustomerInput = {
  name: string;
  phone: string;
  address: string;
  city: string;
};
