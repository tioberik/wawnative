import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Input from "@/components/ui/Input";
import Screen from "@/components/ui/Screen";
import { useAuth } from "@/contexts/AuthContext";
import { colors, fontSize, radius, spacing } from "@/theme/colors";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function ProfileScreen() {
  const {
    user,
    displayName,
    updateDisplayName,
    isAdmin,
    logout,
    biometricAvailable,
    biometricEnabled,
    enableBiometric,
    disableBiometric,
  } = useAuth();

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [nameInput, setNameInput] = useState(displayName ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);

  // Drži polje sinhronizovano s imenom iz konteksta (npr. kad se učita).
  useEffect(() => {
    setNameInput(displayName ?? "");
  }, [displayName]);

  async function handleSaveName() {
    setNameError(null);
    if (nameInput.trim().length < 3) {
      setNameError("Unesite ime i prezime.");
      return;
    }
    setSavingName(true);
    try {
      await updateDisplayName(nameInput);
    } catch {
      setNameError("Greška pri spremanju imena.");
    } finally {
      setSavingName(false);
    }
  }

  async function handleEnableBiometric() {
    setError(null);
    if (!password) {
      setError("Unesite trenutnu lozinku za potvrdu.");
      return;
    }
    if (!user?.email) {
      setError("Nedostaje email korisnika.");
      return;
    }
    setBusy(true);
    try {
      await enableBiometric(user.email, password);
      setPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Greška pri uključivanju biometrije.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisableBiometric() {
    setBusy(true);
    try {
      await disableBiometric();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen scroll edges={["bottom"]}>
      <View style={styles.card}>
        <Text style={styles.welcome}>Dobrodošli 👋</Text>
        {displayName ? <Text style={styles.name}>{displayName}</Text> : null}
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.note}>
          {isAdmin ? "Prijavljeni ste kao administrator." : "Prijavljeni ste na svoj račun."}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Ime i prezime</Text>
        <Text style={styles.muted}>
          Ime se prikazuje uz narudžbe i kupce koje kreirate.
        </Text>
        <ErrorMessage message={nameError} />
        <Input
          label="Ime i prezime"
          value={nameInput}
          onChangeText={setNameInput}
          placeholder="Tio Berik"
          autoCapitalize="words"
          style={styles.mt}
        />
        <Button
          title="Spremi ime"
          onPress={handleSaveName}
          loading={savingName}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Sigurnost</Text>

        {!biometricAvailable ? (
          <Text style={styles.muted}>
            Ovaj uređaj ne podržava biometriju ili nema postavljen otisak/Face ID.
          </Text>
        ) : biometricEnabled ? (
          <>
            <Text style={styles.muted}>
              Biometrijska prijava je uključena.
            </Text>
            <Button
              title="Isključi biometrijsku prijavu"
              variant="secondary"
              onPress={handleDisableBiometric}
              loading={busy}
              style={styles.mt}
            />
          </>
        ) : (
          <>
            <Text style={styles.muted}>
              Unesite trenutnu lozinku da omogućite brzu prijavu biometrijom.
            </Text>
            <ErrorMessage message={error} />
            <Input
              label="Lozinka"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              style={styles.mt}
            />
            <Button
              title="Omogući biometrijsku prijavu"
              onPress={handleEnableBiometric}
              loading={busy}
            />
          </>
        )}
      </View>

      <Button title="Odjava" variant="ghost" onPress={logout} style={styles.logout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  welcome: { fontSize: fontSize.xl, fontWeight: "700", color: colors.text },
  name: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.xs,
  },
  email: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  note: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.sm },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  muted: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.sm },
  mt: { marginTop: spacing.xs },
  logout: { marginTop: spacing.sm },
});
