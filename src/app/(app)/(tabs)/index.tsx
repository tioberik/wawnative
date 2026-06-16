import ErrorMessage from "@/components/ui/ErrorMessage";
import StatusBadge from "@/components/ui/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useShake } from "@/hooks/useShake";
import { subscribeOrders } from "@/services/orderService";
import { colors, fontSize, radius, spacing } from "@/theme/colors";
import type { Order } from "@/types/order";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OrdersScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shakeFlash, setShakeFlash] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Shake-to-refresh: protresi telefon → osvježi listu (značajka temeljena na senzoru).
  // Lista je već real-time (onSnapshot), pa protresanje daje vizualnu/taktilnu potvrdu
  // da su podaci aktuelni.
  useShake(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShakeFlash(true);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setShakeFlash(false), 1500);
  });

  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsubscribe = subscribeOrders(
      user.uid,
      (list) => {
        setOrders(list);
        setLoading(false);
        setError(null);
      },
      (e) => {
        setError("Greška pri učitavanju narudžbi: " + e.message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [user]);

  function renderItem({ item }: { item: Order }) {
    return (
      <Pressable
        style={styles.card}
        onPress={() => router.push(`/(app)/order/${item.id}`)}
      >
        <View style={styles.cardTop}>
          <Text style={styles.customer}>{item.customerName || "Bez kupca"}</Text>
          <StatusBadge status={item.status} />
        </View>
        {item.note ? (
          <Text style={styles.note} numberOfLines={1}>
            {item.note}
          </Text>
        ) : null}
        <View style={styles.cardBottom}>
          <Text style={styles.amount}>
            {item.codAmount > 0 ? `${item.codAmount.toFixed(2)} KM` : "Bez otkupnine"}
          </Text>
          {item.location ? (
            <View style={styles.locRow}>
              <Ionicons name="location" size={14} color={colors.textLight} />
              <Text style={styles.locText}>Lokacija zabilježena</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      {error ? (
        <View style={styles.pad}>
          <ErrorMessage message={error} />
        </View>
      ) : null}

      {shakeFlash ? (
        <View style={styles.shakeFlash}>
          <Ionicons name="refresh" size={16} color={colors.white} />
          <Text style={styles.shakeFlashText}>Lista je osvježena</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="cube-outline" size={48} color={colors.textLight} />
          <Text style={styles.emptyText}>Nema narudžbi</Text>
          <Text style={styles.emptySub}>Kreirajte prvu narudžbu dugmetom dolje.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      <Pressable style={styles.fab} onPress={() => router.push("/(app)/order/form")}>
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  shakeFlash: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.success,
    paddingVertical: spacing.sm,
  },
  shakeFlashText: { color: colors.white, fontSize: fontSize.sm, fontWeight: "600" },
  pad: { padding: spacing.md },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  emptySub: { fontSize: fontSize.sm, color: colors.textLight, marginTop: spacing.xs },
  list: { padding: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  customer: { fontSize: fontSize.md, fontWeight: "700", color: colors.text, flex: 1 },
  note: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  amount: { fontSize: fontSize.sm, fontWeight: "600", color: colors.text },
  locRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locText: { fontSize: fontSize.xs, color: colors.textLight },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.black,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
});
