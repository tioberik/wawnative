import ErrorMessage from "@/components/ui/ErrorMessage";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeCustomers } from "@/services/customerService";
import { colors, fontSize, radius, spacing } from "@/theme/colors";
import type { Customer } from "@/types/customer";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CustomersScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsubscribe = subscribeCustomers(
      user.uid,
      (list) => {
        setCustomers(list);
        setLoading(false);
        setError(null);
      },
      (e) => {
        setError("Greška pri učitavanju kupaca: " + e.message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [user]);

  function renderItem({ item }: { item: Customer }) {
    return (
      <Pressable
        style={styles.row}
        onPress={() => router.push(`/(app)/customer/form?id=${item.id}`)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.rowInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.sub}>{item.phone}</Text>
          {item.city ? <Text style={styles.sub}>{item.city}</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
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

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : customers.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={48} color={colors.textLight} />
          <Text style={styles.emptyText}>Nema kupaca</Text>
          <Text style={styles.emptySub}>Dodajte prvog kupca dugmetom dolje.</Text>
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Floating dugme za novog kupca */}
      <Pressable
        style={styles.fab}
        onPress={() => router.push("/(app)/customer/form")}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
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
  emptySub: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  list: { padding: spacing.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  avatarText: { color: colors.primary, fontWeight: "700", fontSize: fontSize.md },
  rowInfo: { flex: 1 },
  name: { fontSize: fontSize.md, fontWeight: "600", color: colors.text },
  sub: { fontSize: fontSize.sm, color: colors.textMuted },
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
