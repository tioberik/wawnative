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
import { spacing } from "@/theme/colors";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

export default function CustomerFormScreen() {
  const { user } = useAuth();
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

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
        await createCustomer(user.uid, input);
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

      {isEdit && (
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
