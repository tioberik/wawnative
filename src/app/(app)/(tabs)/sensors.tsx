import Button from "@/components/ui/Button";
import Screen from "@/components/ui/Screen";
import { useSensor, type SensorData } from "@/hooks/useSensor";
import { colors, fontSize, radius, spacing } from "@/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { Accelerometer, Gyroscope, Magnetometer } from "expo-sensors";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function SensorsScreen() {
  const [active, setActive] = useState(true);

  const accel = useSensor(Accelerometer, active, 100);
  const gyro = useSensor(Gyroscope, active, 100);
  const magneto = useSensor(Magnetometer, active, 100);

  return (
    <Screen scroll edges={["bottom"]}>
      <Text style={styles.intro}>
        Podaci se očitavaju u realnom vremenu sa senzora uređaja. Pomjerajte ili
        rotirajte telefon da vidite promjene.
      </Text>

      <SensorCard
        icon="speedometer-outline"
        title="Akcelerometar"
        unit="g (gravitacija)"
        data={accel}
        range={2}
      />
      <SensorCard
        icon="sync-outline"
        title="Žiroskop"
        unit="rad/s (rotacija)"
        data={gyro}
        range={5}
      />
      <SensorCard
        icon="compass-outline"
        title="Magnetometar"
        unit="μT (magnetsko polje)"
        data={magneto}
        range={100}
      />

      <Button
        title={active ? "Zaustavi senzore" : "Pokreni senzore"}
        variant={active ? "secondary" : "primary"}
        onPress={() => setActive((v) => !v)}
        style={styles.toggle}
      />
    </Screen>
  );
}

function SensorCard({
  icon,
  title,
  unit,
  data,
  range,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  unit: string;
  data: SensorData;
  range: number;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={20} color={colors.primary} />
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardUnit}>{unit}</Text>
      </View>
      <AxisRow label="X" value={data.x} range={range} color="#EF4444" />
      <AxisRow label="Y" value={data.y} range={range} color="#10B981" />
      <AxisRow label="Z" value={data.z} range={range} color="#3B82F6" />
    </View>
  );
}

function AxisRow({
  label,
  value,
  range,
  color,
}: {
  label: string;
  value: number;
  range: number;
  color: string;
}) {
  // Pretvori vrijednost (-range..+range) u širinu bara 0..100% od centra
  const clamped = Math.max(-range, Math.min(range, value));
  const fraction = Math.abs(clamped) / range;
  const widthPct = Math.round(fraction * 50); // pola širine za svaki smjer

  return (
    <View style={styles.axisRow}>
      <Text style={styles.axisLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={styles.barCenter} />
        <View
          style={[
            styles.barFill,
            {
              backgroundColor: color,
              width: `${widthPct}%`,
              left: clamped >= 0 ? "50%" : undefined,
              right: clamped < 0 ? "50%" : undefined,
            },
          ]}
        />
      </View>
      <Text style={styles.axisValue}>{value.toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: fontSize.md, fontWeight: "700", color: colors.text, flex: 1 },
  cardUnit: { fontSize: fontSize.xs, color: colors.textLight },
  axisRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  axisLabel: {
    width: 18,
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textMuted,
  },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: colors.background,
    borderRadius: radius.full,
    overflow: "hidden",
    justifyContent: "center",
  },
  barCenter: {
    position: "absolute",
    left: "50%",
    width: 1,
    height: "100%",
    backgroundColor: colors.border,
  },
  barFill: {
    position: "absolute",
    height: "100%",
    borderRadius: radius.full,
  },
  axisValue: {
    width: 56,
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: "600",
    textAlign: "right",
  },
  toggle: { marginTop: spacing.sm },
});
