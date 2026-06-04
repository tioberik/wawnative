import { colors, fontSize, radius, spacing } from "@/theme/colors";
import { StyleSheet, Text, View } from "react-native";

export default function ErrorMessage({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  text: {
    color: "#B91C1C",
    fontSize: fontSize.sm,
  },
});
