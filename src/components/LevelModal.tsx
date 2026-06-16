import Button from "@/components/ui/Button";
import { useSensor } from "@/hooks/useSensor";
import { colors, fontSize, radius, spacing } from "@/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { Accelerometer } from "expo-sensors";
import { Modal, StyleSheet, Text, View } from "react-native";

const RING_SIZE = 220; // promjer vanjskog kruga (libela)
const BUBBLE_SIZE = 44; // promjer mjehura
const MAX_OFFSET = (RING_SIZE - BUBBLE_SIZE) / 2;
const LEVEL_THRESHOLD = 0.12; // koliko x/y smije odstupati da se smatra "ravno"

/**
 * Libela (vodootres) — koristi akcelerometar da pomogne korisniku da poravna
 * telefon vodoravno prije snimanja dokumenta, kako fotografija ne bi bila nakošena.
 * Kad je telefon ravan, mjehur je u centru i prikazuje se zelena potvrda.
 */
export default function LevelModal({
  visible,
  onClose,
  onCapture,
}: {
  visible: boolean;
  onClose: () => void;
  onCapture: () => void;
}) {
  const { x, y } = useSensor(Accelerometer, visible, 80);

  const isLevel = Math.abs(x) < LEVEL_THRESHOLD && Math.abs(y) < LEVEL_THRESHOLD;

  // Mjehur se pomiče suprotno od nagiba (kao prava libela)
  const offsetX = Math.max(-1, Math.min(1, -x / 0.5)) * MAX_OFFSET;
  const offsetY = Math.max(-1, Math.min(1, y / 0.5)) * MAX_OFFSET;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Poravnaj telefon</Text>
          <Text style={styles.subtitle}>
            Drži telefon vodoravno iznad dokumenta za ravnu fotografiju.
          </Text>

          <View
            style={[
              styles.ring,
              { borderColor: isLevel ? colors.success : colors.border },
            ]}
          >
            {/* Centralna meta */}
            <View style={styles.target} />
            {/* Mjehur */}
            <View
              style={[
                styles.bubble,
                {
                  backgroundColor: isLevel ? colors.success : colors.primary,
                  transform: [{ translateX: offsetX }, { translateY: offsetY }],
                },
              ]}
            />
          </View>

          <View style={styles.statusRow}>
            <Ionicons
              name={isLevel ? "checkmark-circle" : "alert-circle-outline"}
              size={18}
              color={isLevel ? colors.success : colors.textMuted}
            />
            <Text
              style={[
                styles.statusText,
                { color: isLevel ? colors.success : colors.textMuted },
              ]}
            >
              {isLevel ? "Telefon je poravnat" : "Nagnite telefon do centra"}
            </Text>
          </View>

          <Button
            title="Slikaj"
            onPress={onCapture}
            disabled={!isLevel}
            style={styles.captureBtn}
          />
          <Button title="Otkaži" variant="ghost" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
  },
  title: { fontSize: fontSize.lg, fontWeight: "700", color: colors.text },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  target: {
    position: "absolute",
    width: BUBBLE_SIZE + 12,
    height: BUBBLE_SIZE + 12,
    borderRadius: (BUBBLE_SIZE + 12) / 2,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.lg,
  },
  statusText: { fontSize: fontSize.sm, fontWeight: "600" },
  captureBtn: { alignSelf: "stretch", marginBottom: spacing.sm },
});
