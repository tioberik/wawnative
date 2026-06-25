import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Input from "@/components/ui/Input";
import Screen from "@/components/ui/Screen";
import { useAuth } from "@/contexts/AuthContext";
import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  updateCustomer,
} from "@/services/customerService";
import { colors, fontSize, spacing } from "@/theme/colors";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";

export default function CustomerFormScreen() {
  const { user, isAdmin, displayName } = useAuth();
  const router = useRouter();
  const { id, name: prefillName } = useLocalSearchParams<{
    id?: string;
    name?: string;
  }>();
  const isEdit = !!id;

  const [name, setName] = useState(prefillName ?? "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [createdByName, setCreatedByName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  // Kupca briše samo vlasnik (onaj koji ga je kreirao) ili admin.
  const canDelete = isEdit && (isAdmin || (!!ownerId && ownerId === user?.uid));

  // Učitaj postojećeg kupca u edit modu
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const c = await getCustomer(id);
        if (c) {
          setName(c.name);
          setPhone(c.phone);
          setAddress(c.address);
          setCity(c.city);
          setOwnerId(c.ownerId);
          setCreatedByName(c.ownerName ?? null);
        }
      } catch {
        setError("Greška pri učitavanju kupca.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function validate(): boolean {
    if (!name.trim()) {
      setError("Ime kupca je obavezno.");
      return false;
    }
    if (!phone.trim()) {
      setError("Telefon je obavezan.");
      return false;
    }
    return true;
  }

  async function handleSave() {
    setError(null);
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      const input = {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
      };
      if (isEdit && id) {
        await updateCustomer(id, input);
      } else {
        await createCustomer(user.uid, displayName ?? "", input);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError("Greška pri spremanju kupca.");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!id) return;
    Alert.alert("Brisanje kupca", "Jeste li sigurni da želite obrisati ovog kupca?", [
      { text: "Otkaži", style: "cancel" },
      {
        text: "Obriši",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCustomer(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          } catch {
            setError("Greška pri brisanju kupca.");
          }
        },
      },
    ]);
  }

  return (
    <Screen scroll edges={["bottom"]}>
      <Stack.Screen options={{ title: isEdit ? "Uredi kupca" : "Novi kupac" }} />

      <ErrorMessage message={error} />

      {isEdit && createdByName ? (
        <Text style={styles.createdBy}>Kreirao: {createdByName}</Text>
      ) : null}

      <Input
        label="Ime i prezime *"
        value={name}
        onChangeText={setName}
        placeholder="Marko Marković"
        editable={!loading}
      />
      <Input
        label="Telefon *"
        value={phone}
        onChangeText={setPhone}
        placeholder="+38761123456"
        keyboardType="phone-pad"
        editable={!loading}
      />
      <Input
        label="Adresa"
        value={address}
        onChangeText={setAddress}
        placeholder="Ulica i broj"
        editable={!loading}
      />
      <Input
        label="Grad"
        value={city}
        onChangeText={setCity}
        placeholder="Sarajevo"
        editable={!loading}
      />

      <Button
        title={isEdit ? "Spremi izmjene" : "Dodaj kupca"}
        onPress={handleSave}
        loading={saving}
      />

      {canDelete && (
        <Button
          title="Obriši kupca"
          variant="ghost"
          onPress={handleDelete}
          style={{ marginTop: spacing.sm }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  createdBy: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
});
