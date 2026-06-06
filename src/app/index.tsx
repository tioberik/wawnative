import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "expo-router";

/** Ulazna tačka — preusmjerava na osnovu stanja prijave. */
export default function Index() {
  const { isLoggedIn } = useAuth();
  return <Redirect href={isLoggedIn ? "/(app)/(tabs)" : "/(auth)/login"} />;
}
