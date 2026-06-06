import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Input from "@/components/ui/Input";
import Screen from "@/components/ui/Screen";
import { useAuth } from "@/contexts/AuthContext";
import { getCustomers } from "@/services/customerService";
import { createOrder, getOrder, updateOrder } from "@/services/orderService";
import { colors, fontSize, radius, spacing } from "@/theme/colors";
import type { Customer } from "@/types/customer";
import {
  ORDER_STATUSES,
  type GeoLocation,
  type OrderStatus,
} from "@/types/order";
import { openInGoogleMaps } from "@/lib/maps";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function OrderFormScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus>("nova");
  const [codAmount, setCodAmount] = useState("");
  const [note, setNote] = useState("");
  const [location, setLocation] = useState<GeoLocation | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);

  // Učitaj postojeću narudžbu (edit) — jednom
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const o = await getOrder(id);
        if (o) {
          setCustomerId(o.customerId);
          setCustomerName(o.customerName);
          setStatus(o.status);
          setCodAmount(o.codAmount ? String(o.codAmount) : "");
          setNote(o.note);
          setLocation(o.location);
        }
      } catch {
        setError("Greška pri učitavanju narudžbe.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Učitaj kupce svaki put kad ekran dobije fokus (npr. nakon kreiranja novog).
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      getCustomers(user.uid)
        .then(setCustomers)
        .catch(() => setError("Greška pri učitavanju kupaca."));
    }, [user])
  );

  function selectCustomer(c: Customer) {
    setCustomerId(c.id);
    setCustomerName(c.name);
    setCustomerSearch("");
  }

  function clearSelectedCustomer() {
    setCustomerId("");
    setCustomerName("");
    setCustomerSearch("");
  }

  // Pretraga se aktivira tek nakon najmanje 3 upisana znaka
  const trimmedSearch = customerSearch.trim();
  const hasMinSearch = trimmedSearch.length >= 3;
  const filteredCustomers = hasMinSearch
    ? customers.filter((c) =>
        c.name.toLowerCase().includes(trimmedSearch.toLowerCase())
      )
    : [];

  async function captureLocation() {
    setError(null);
    setGpsBusy(true);
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== "granted") {
        setError("Pristup lokaciji nije odobren.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError("Greška pri dohvaćanju lokacije.");
    } finally {
      setGpsBusy(false);
    }
  }

  function validate(): boolean {
    if (!customerId) {
      setError("Odaberite kupca.");
      return false;
    }
    const amount = parseFloat(codAmount.replace(",", "."));
    if (codAmount && (isNaN(amount) || amount < 0)) {
      setError("Otkupnina mora biti pozitivan broj.");
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
        customerId,
        customerName,
        status,
        codAmount: codAmount ? parseFloat(codAmount.replace(",", ".")) : 0,
        note: note.trim(),
        location,
      };
      if (isEdit && id) {
        await updateOrder(id, input);
      } else {
        await createOrder(user.uid, input);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError("Greška pri spremanju narudžbe.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen edges={["bottom"]}>
        <Text style={styles.muted}>Učitavanje...</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll edges={["bottom"]}>
      <Stack.Screen options={{ title: isEdit ? "Uredi narudžbu" : "Nova narudžba" }} />

      <ErrorMessage message={error} />

      {/* Izbor kupca — tražilica */}
      <Text style={styles.label}>Kupac *</Text>
      {customerId ? (
        // Izabran kupac
        <View style={styles.selectedCustomer}>
          <Ionicons name="person-circle" size={22} color={colors.primary} />
          <Text style={styles.selectedCustomerName}>{customerName}</Text>
          <Pressable onPress={clearSelectedCustomer}>
            <Text style={styles.changeLink}>Promijeni</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Input
            value={customerSearch}
            onChangeText={setCustomerSearch}
            placeholder="Pretraži kupca po imenu..."
            autoCapitalize="words"
          />
          {/* Prikaži rezultate tek nakon 3 upisana znaka */}
          {!hasMinSearch ? (
            <Text style={styles.muted}>
              Upišite najmanje 3 slova za pretragu kupca.
            </Text>
          ) : filteredCustomers.length > 0 ? (
            <View style={styles.resultsList}>
              {filteredCustomers.slice(0, 6).map((c) => (
                <Pressable
                  key={c.id}
                  style={styles.resultRow}
                  onPress={() => selectCustomer(c)}
                >
                  <Ionicons name="person-outline" size={18} color={colors.textMuted} />
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{c.name}</Text>
                    {c.phone ? <Text style={styles.resultSub}>{c.phone}</Text> : null}
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            // Nema rezultata → ponudi kreiranje
            <Pressable
              style={styles.createRow}
              onPress={() =>
                router.push(
                  `/(app)/customer/form?name=${encodeURIComponent(trimmedSearch)}`
                )
              }
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.createText}>
                Kreiraj kupca &quot;{trimmedSearch}&quot;
              </Text>
            </Pressable>
          )}
        </>
      )}

      {/* Status */}
      <Text style={styles.label}>Status</Text>
      <View style={styles.chipWrap}>
        {ORDER_STATUSES.map((s) => {
          const active = s.value === status;
          return (
            <Pressable
              key={s.value}
              onPress={() => setStatus(s.value)}
              style={[
                styles.chip,
                { borderColor: s.color },
                active && { backgroundColor: s.color },
              ]}
            >
              <Text
                style={[styles.chipText, { color: active ? colors.white : s.color }]}
              >
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Otkupnina + napomena */}
      <Input
        label="Otkupnina (KM)"
        value={codAmount}
        onChangeText={setCodAmount}
        placeholder="0.00"
        keyboardType="decimal-pad"
        style={styles.mt}
      />
      <Input
        label="Napomena"
        value={note}
        onChangeText={setNote}
        placeholder="Sadržaj pošiljke, dodatne informacije..."
        multiline
      />

      {/* GPS lokacija (hardver) */}
      <Text style={styles.label}>Lokacija dostave (GPS)</Text>
      {location ? (
        <View style={styles.locBox}>
          <Ionicons name="location" size={18} color={colors.success} />
          <Text style={styles.locText}>
            {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </Text>
          <Pressable
            onPress={() => openInGoogleMaps(location)}
            hitSlop={8}
            style={styles.mapsBtn}
          >
            <Ionicons name="map" size={20} color={colors.primary} />
          </Pressable>
          <Pressable onPress={() => setLocation(null)} hitSlop={8}>
            <Ionicons name="close-circle" size={20} color={colors.textLight} />
          </Pressable>
        </View>
      ) : null}
      <Button
        title={location ? "Ažuriraj lokaciju" : "Zabilježi trenutnu lokaciju"}
        variant="secondary"
        onPress={captureLocation}
        loading={gpsBusy}
        style={styles.mt}
      />

      <Button
        title={isEdit ? "Spremi izmjene" : "Kreiraj narudžbu"}
        onPress={handleSave}
        loading={saving}
        style={styles.saveBtn}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  muted: { fontSize: fontSize.sm, color: colors.textMuted },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.textMuted },
  chipTextActive: { color: colors.white },
  mt: { marginTop: spacing.sm },
  // Tražilica kupca
  selectedCustomer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  selectedCustomerName: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
  },
  changeLink: { fontSize: fontSize.sm, color: colors.primary, fontWeight: "600" },
  resultsList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  resultInfo: { flex: 1 },
  resultName: { fontSize: fontSize.md, color: colors.text, fontWeight: "600" },
  resultSub: { fontSize: fontSize.xs, color: colors.textMuted },
  createRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
  },
  createText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: "600" },
  locBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  locText: { flex: 1, fontSize: fontSize.sm, color: colors.text, fontWeight: "600" },
  mapsBtn: {},
  saveBtn: { marginTop: spacing.lg },
});
