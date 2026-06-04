import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Platform-safe spremište za osjetljive podatke.
 *
 * - Na native platformama (iOS/Android) koristi expo-secure-store
 *   (hardverski enkriptovan Keychain / Keystore).
 * - Na webu expo-secure-store ne postoji, pa padamo na AsyncStorage
 *   (localStorage) — samo za razvoj/testiranje u pregledniku.
 *
 * Biometrija ionako radi samo na native uređajima, tako da je web spremište
 * relevantno isključivo za testiranje sučelja.
 */
const isWeb = Platform.OS === "web";

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    await AsyncStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function getSecureItem(key: string): Promise<string | null> {
  if (isWeb) {
    return AsyncStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (isWeb) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
