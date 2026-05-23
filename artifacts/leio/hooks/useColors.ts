import { useColorScheme } from "react-native";

import colors from "@/constants/colors";

/**
 * Leio is a dark-first app. Always returns the dark palette.
 * Falls back to light only when the dark key is missing entirely.
 */
export function useColors() {
  const palette =
    "dark" in colors
      ? (colors as Record<string, typeof colors.light>).dark
      : colors.light;
  return { ...palette, radius: colors.radius };
}
