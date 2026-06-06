import { fontSize, radius } from "@/theme/colors";
import { statusMeta, type OrderStatus } from "@/types/order";
import { StyleSheet, Text, View } from "react-native";

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = statusMeta(status);
  return (
    <View style={[styles.badge, { backgroundColor: meta.color }]}>
      <Text style={styles.text}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  text: {
    color: "#FFFFFF",
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
});
