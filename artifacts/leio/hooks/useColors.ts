import colors from "@/constants/colors";

type Palette = typeof colors.dark;

/**
 * Leio is a dark-first app. Always returns the dark palette.
 */
export function useColors(): Palette & { radius: number } {
  return { ...colors.dark, radius: colors.radius };
}
