import { colors } from "@/theme/colors";
import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen name="home" options={{ title: "WAW Native" }} />
    </Stack>
  );
}
