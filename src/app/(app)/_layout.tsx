import { colors } from "@/theme/colors";
import { Stack } from "expo-router";

/**
 * Stack koji sadrži tab-navigaciju i pojedinačne ekrane (detalji, forme)
 * koji se otvaraju "preko" tabova.
 */
export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="order/[id]" options={{ title: "Detalji narudžbe" }} />
      <Stack.Screen name="order/form" options={{ title: "Narudžba" }} />
      <Stack.Screen name="customer/form" options={{ title: "Kupac" }} />
    </Stack>
  );
}
