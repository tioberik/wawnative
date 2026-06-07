import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Screen from "@/components/ui/Screen";
import StatusBadge from "@/components/ui/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { pickFromCamera, pickFromLibrary } from "@/lib/imagePicker";
import { openInGoogleMaps } from "@/lib/maps";
import { getCustomer } from "@/services/customerService";
import {
  addAttachment,
  deleteOrder,
  getOrder,
  removeAttachment,
  updateOrderStatus,
} from "@/services/orderService";
import { deleteAttachmentFiles, uploadAttachment } from "@/services/storageService";
import { colors, fontSize, radius, spacing } from "@/theme/colors";
import type { Customer } from "@/types/customer";
import {
  ORDER_STATUSES,
  statusMeta,
  type Attachment,
  type Order,
  type OrderStatus,
} from "@/types/order";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function OrderDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Prilozi
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [viewer, setViewer] = useState<Attachment | null>(null);

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

  // Ponudi izbor izvora slike (kamera ili galerija)
  function handleAddPhoto() {
    Alert.alert("Dodaj fotografiju", "Odaberite izvor", [
      { text: "Kamera", onPress: () => addPhoto("camera") },
      { text: "Galerija", onPress: () => addPhoto("library") },
      { text: "Otkaži", style: "cancel" },
    ]);
  }

  async function addPhoto(source: "camera" | "library") {
    if (!user || !id || !order) return;
    setError(null);

    const uri =
      source === "camera" ? await pickFromCamera() : await pickFromLibrary();
    if (!uri) return; // otkazano ili dozvola odbijena

    setUploading(true);
    setProgress(0);
    try {
      const attachment = await uploadAttachment(user.uid, id, uri, setProgress);
      await addAttachment(id, attachment);
      setOrder({ ...order, attachments: [...order.attachments, attachment] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError("Greška pri uploadu fotografije.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  function confirmDeletePhoto(attachment: Attachment) {
    Alert.alert("Brisanje fotografije", "Obrisati ovu fotografiju?", [
      { text: "Otkaži", style: "cancel" },
      {
        text: "Obriši",
        style: "destructive",
        onPress: async () => {
          if (!id || !order) return;
          try {
            await removeAttachment(id, attachment);
            await deleteAttachmentFiles(attachment);
            setOrder({
              ...order,
              attachments: order.attachments.filter((a) => a.id !== attachment.id),
            });
            setViewer(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {
            setError("Greška pri brisanju fotografije.");
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

      {/* Prilozi (fotografije) */}
      <View style={styles.card}>
        <View style={styles.attachHeader}>
          <Text style={styles.sectionTitle}>Fotografije</Text>
          <Text style={styles.attachCount}>{order.attachments.length}</Text>
        </View>

        {order.attachments.length === 0 ? (
          <Text style={styles.muted}>Nema priloženih fotografija.</Text>
        ) : (
          <View style={styles.thumbGrid}>
            {order.attachments.map((a) => (
              <Pressable key={a.id} onPress={() => setViewer(a)}>
                <Image
                  source={{ uri: a.thumbUrl }}
                  style={styles.thumb}
                  contentFit="cover"
                  transition={150}
                  cachePolicy="memory-disk"
                />
              </Pressable>
            ))}
          </View>
        )}

        {uploading ? (
          <View style={styles.uploadingBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.uploadingText}>
              Uploadanje... {Math.round(progress * 100)}%
            </Text>
          </View>
        ) : (
          <Button
            title="Dodaj fotografiju"
            variant="secondary"
            onPress={handleAddPhoto}
            style={styles.mt}
          />
        )}
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

      {/* Full-screen pregled fotografije */}
      <Modal visible={!!viewer} transparent animationType="fade">
        <View style={styles.viewerBackdrop}>
          <View style={styles.viewerBar}>
            <Pressable onPress={() => setViewer(null)} hitSlop={10}>
              <Ionicons name="close" size={28} color={colors.white} />
            </Pressable>
            <Pressable
              onPress={() => viewer && confirmDeletePhoto(viewer)}
              hitSlop={10}
            >
              <Ionicons name="trash-outline" size={26} color={colors.white} />
            </Pressable>
          </View>
          {viewer ? (
            <Image
              source={{ uri: viewer.url }}
              style={styles.viewerImage}
              contentFit="contain"
              transition={150}
            />
          ) : null}
        </View>
      </Modal>
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
  // Prilozi
  muted: { fontSize: fontSize.sm, color: colors.textMuted },
  mt: { marginTop: spacing.md },
  attachHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  attachCount: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  thumbGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  thumb: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    backgroundColor: colors.border,
  },
  uploadingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  uploadingText: { fontSize: fontSize.sm, color: colors.textMuted },
  // Full-screen pregled
  viewerBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)" },
  viewerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: 50,
    paddingBottom: spacing.md,
  },
  viewerImage: { flex: 1, width: "100%" },
});
