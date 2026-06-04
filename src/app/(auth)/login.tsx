import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Input from "@/components/ui/Input";
import Screen from "@/components/ui/Screen";
import { useAuth } from "@/contexts/AuthContext";
import { colors, fontSize, spacing } from "@/theme/colors";
import * as Haptics from "expo-haptics";
import { Link } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function LoginScreen() {
  const { login, biometricAvailable, biometricEnabled, loginWithBiometric } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    if (!email.trim() || !password) {
      setError("Unesite email i lozinku.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Neispravna email adresa.");
      return false;
    }
    return true;
  }

  async function handleLogin() {
    setError(null);
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Preusmjeravanje obavlja root navigator automatski.
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(e instanceof Error ? e.message : "Greška pri prijavi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBiometric() {
    setError(null);
    try {
      await loginWithBiometric();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(e instanceof Error ? e.message : "Biometrijska prijava nije uspjela.");
    }
  }

  return (
    <Screen scroll center>
      <View style={styles.header}>
        <Text style={styles.logo}>WAW Native</Text>
        <Text style={styles.subtitle}>Prijavite se na svoj račun</Text>
      </View>

      <ErrorMessage message={error} />

      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="ime@primjer.com"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <Input
        label="Lozinka"
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        secureTextEntry
      />

      <Button title="Prijava" onPress={handleLogin} loading={loading} />

      {biometricAvailable && biometricEnabled && (
        <Button
          title="Prijava biometrijom"
          onPress={handleBiometric}
          variant="secondary"
          style={styles.bioButton}
        />
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Nemate račun? </Text>
        <Link href="/(auth)/register" style={styles.footerLink}>
          Registrujte se
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logo: {
    fontSize: fontSize.xxl,
    fontWeight: "800",
    color: colors.primary,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  bioButton: {
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  footerLink: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
});
