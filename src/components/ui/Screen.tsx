import { colors, spacing } from "@/theme/colors";
import { type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

type Props = {
  children: ReactNode;
  scroll?: boolean;
  center?: boolean;
  /** Safe-area rubovi. Ekrani sa headerom obično trebaju samo "bottom". */
  edges?: Edge[];
};

/** Osnovni wrapper ekrana — safe area, padding, opcionalni scroll/centriranje. */
export default function Screen({
  children,
  scroll = false,
  center = false,
  edges = ["top", "bottom"],
}: Props) {
  const content = (
    <View style={[styles.inner, center && styles.center]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
    padding: spacing.lg,
  },
  center: {
    justifyContent: "center",
  },
});
