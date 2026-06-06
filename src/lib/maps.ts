import { Linking } from "react-native";
import type { GeoLocation } from "@/types/order";

/** Otvara Google Maps na zadanim koordinatama (u browseru ili Maps aplikaciji). */
export async function openInGoogleMaps(location: GeoLocation): Promise<void> {
  const url = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  }
}
