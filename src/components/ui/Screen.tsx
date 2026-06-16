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

/** Osnovni wrapper ekrana — safe area, padding, opcionalni scroll/centriranje.
 * Sa scroll=true sadržaj se može pomicati iznad tipkovnice (bez prekrivanja polja). */
export default function Screen({
  children,
  scroll = false,
  center = false,
  edges = ["top", "bottom"],
}: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.scrollContent, center && styles.center]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.inner, center && styles.center]}>{children}</View>
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
  // Za scroll varijantu: padding ide ovdje, flexGrow dopušta i centriranje i scroll
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  inner: {
    flex: 1,
    padding: spacing.lg,
  },
  center: {
    justifyContent: "center",
  },
});
