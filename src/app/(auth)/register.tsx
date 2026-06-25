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

export default function RegisterScreen() {
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    if (!name.trim() || !email.trim() || !password || !confirm) {
      setError("Popunite sva polja.");
      return false;
    }
    if (name.trim().length < 3) {
      setError("Unesite ime i prezime.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Neispravna email adresa.");
      return false;
    }
    if (password.length < 6) {
      setError("Lozinka mora imati najmanje 6 znakova.");
      return false;
    }
    if (password !== confirm) {
      setError("Lozinke se ne podudaraju.");
      return false;
    }
    return true;
  }

  async function handleRegister() {
    setError(null);
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Nakon uspješne registracije Firebase automatski prijavljuje korisnika;
      // root navigator preusmjerava na početni ekran.
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(e instanceof Error ? e.message : "Greška pri registraciji.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll center>
      <View style={styles.header}>
        <Text style={styles.logo}>Kreiraj račun</Text>
        <Text style={styles.subtitle}>Registrujte se za pristup aplikaciji</Text>
      </View>

      <ErrorMessage message={error} />

      <Input
        label="Ime i prezime"
        value={name}
        onChangeText={setName}
        placeholder="Tio Berik"
        autoCapitalize="words"
        autoComplete="name"
      />
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
        placeholder="Najmanje 6 znakova"
        secureTextEntry
      />
      <Input
        label="Potvrda lozinke"
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Ponovite lozinku"
        secureTextEntry
      />

      <Button title="Registracija" onPress={handleRegister} loading={loading} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Već imate račun? </Text>
        <Link href="/(auth)/login" style={styles.footerLink}>
          Prijavite se
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
    textAlign: "center",
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
