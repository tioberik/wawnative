import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Screen from "@/components/ui/Screen";
import StatusBadge from "@/components/ui/StatusBadge";
import { openInGoogleMaps } from "@/lib/maps";
import { getCustomer } from "@/services/customerService";
import { deleteOrder, getOrder, updateOrderStatus } from "@/services/orderService";
import { colors, fontSize, radius, spacing } from "@/theme/colors";
import type { Customer } from "@/types/customer";
import { ORDER_STATUSES, statusMeta, type Order, type OrderStatus } from "@/types/order";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Učitaj narudžbu + kupca svaki put kad ekran dobije fokus
  // (npr. nakon povratka iz uređivanja).
  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      (async () => {
        try {
          const o = await getOrder(id);
          setOrder(o);
          if (o?.customerId) {
            const c = await getCustomer(o.customerId);
            setCustomer(c);
          }
        } catch {
          setError("Greška pri učitavanju narudžbe.");
        } finally {
          setLoading(false);
        }
      })();
    }, [id])
  );

  function changeStatus(status: OrderStatus) {
    if (!id || !order || status === order.status) return;
    Alert.alert(
      "Promjena statusa",
      `Promijeniti status u "${statusMeta(status).label}"?`,
      [
        { text: "Otkaži", style: "cancel" },
        {
          text: "Promijeni",
          onPress: async () => {
            try {
              await updateOrderStatus(id, status);
              setOrder({ ...order, status });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {
              setError("Greška pri promjeni statusa.");
            }
          },
        },
      ]
    );
  }

  function handleDelete() {
    if (!id) return;
    Alert.alert("Brisanje narudžbe", "Jeste li sigurni?", [
      { text: "Otkaži", style: "cancel" },
      {
        text: "Obriši",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteOrder(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          } catch {
            setError("Greška pri brisanju narudžbe.");
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <Screen edges={["bottom"]}>
        <ErrorMessage message={error ?? "Narudžba nije pronađena."} />
      </Screen>
    );
  }

  return (
    <Screen scroll edges={["bottom"]}>
      <Stack.Screen options={{ title: "Detalji narudžbe" }} />

      <ErrorMessage message={error} />

      {/* Kupac */}
      <View style={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.customer}>{order.customerName || "Bez kupca"}</Text>
          <StatusBadge status={order.status} />
        </View>

        {customer ? (
          <View style={styles.customerInfo}>
            {customer.phone ? (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={15} color={colors.textMuted} />
                <Text style={styles.infoText}>{customer.phone}</Text>
              </View>
            ) : null}
            {customer.address || customer.city ? (
              <View style={styles.infoRow}>
                <Ionicons name="home-outline" size={15} color={colors.textMuted} />
                <Text style={styles.infoText}>
                  {[customer.address, customer.city].filter(Boolean).join(", ")}
                </Text>
              </View>
            ) : null}
            <Pressable
              style={styles.editCustomerBtn}
              onPress={() => router.push(`/(app)/customer/form?id=${customer.id}`)}
            >
              <Ionicons name="create-outline" size={16} color={colors.primary} />
              <Text style={styles.editCustomerText}>Uredi kupca</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.divider} />
        <Row label="Otkupnina (SDS)" value={`${order.codAmount.toFixed(2)} KM`} />
        {order.note ? <Row label="Napomena" value={order.note} /> : null}
        {order.location ? (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>GPS lokacija</Text>
            <Pressable
              style={styles.mapsLink}
              onPress={() => order.location && openInGoogleMaps(order.location)}
            >
              <Text style={styles.mapsLinkText}>
                {order.location.lat.toFixed(5)}, {order.location.lng.toFixed(5)}
              </Text>
              <Ionicons name="map" size={16} color={colors.primary} />
            </Pressable>
          </View>
        ) : null}
      </View>

      {/* Promjena statusa */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Promijeni status</Text>
        <View style={styles.statusWrap}>
          {ORDER_STATUSES.map((s) => {
            const active = s.value === order.status;
            return (
              <Pressable
                key={s.value}
                onPress={() => changeStatus(s.value)}
                style={[
                  styles.statusChip,
                  { borderColor: s.color },
                  active && { backgroundColor: s.color },
                ]}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    { color: active ? colors.white : s.color },
                  ]}
                >
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Button
        title="Uredi narudžbu"
        onPress={() => router.push(`/(app)/order/form?id=${order.id}`)}
      />
      <Button
        title="Obriši narudžbu"
        variant="ghost"
        onPress={handleDelete}
        style={{ marginTop: spacing.sm }}
      />
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  customer: { fontSize: fontSize.lg, fontWeight: "700", color: colors.text, flex: 1 },
  customerInfo: { marginTop: spacing.sm, gap: spacing.xs },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  infoText: { fontSize: fontSize.sm, color: colors.textMuted, flex: 1 },
  editCustomerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.xs,
  },
  editCustomerText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: "600" },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  rowLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  rowValue: { fontSize: fontSize.sm, color: colors.text, fontWeight: "600" },
  mapsLink: { flexDirection: "row", alignItems: "center", gap: 6 },
  mapsLinkText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  statusWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  statusChip: {
    borderWidth: 1.5,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  statusChipText: { fontSize: fontSize.sm, fontWeight: "600" },
});
