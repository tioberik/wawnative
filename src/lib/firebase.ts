import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  // @ts-expect-error — getReactNativePersistence postoji u RN buildu firebase-a,
  // ali tip nije eksportovan u glavnom d.ts-u (poznata caveat firebase v12 + RN).
  getReactNativePersistence,
  type Auth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseOptions: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Inicijaliziraj app samo jednom (Fast Refresh bi inace pokusao ponovo).
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseOptions);

/**
 * Auth instanca sa perzistencijom kroz AsyncStorage — korisnik ostaje
 * prijavljen i nakon zatvaranja aplikacije. initializeAuth se moze pozvati
 * samo jednom; ako je vec inicijaliziran (npr. Fast Refresh), padamo na getAuth.
 */
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

export { app, auth };
export const firestore = getFirestore(app);
export const storage = getStorage(app);
