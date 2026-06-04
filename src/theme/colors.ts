/**
 * Centralna paleta boja aplikacije. Bazirana na vizualnom identitetu
 * WAW web aplikacije (indigo/plava primarna boja).
 */
export const colors = {
  primary: "#4F46E5",
  primaryDark: "#4338CA",
  primaryLight: "#EEF2FF",

  background: "#F3F4F6",
  surface: "#FFFFFF",

  text: "#111827",
  textMuted: "#6B7280",
  textLight: "#9CA3AF",

  border: "#E5E7EB",
  borderFocus: "#4F46E5",

  success: "#10B981",
  successLight: "#ECFDF5",
  danger: "#EF4444",
  dangerLight: "#FEF2F2",
  warning: "#F59E0B",
  warningLight: "#FFFBEB",

  white: "#FFFFFF",
  black: "#000000",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;
