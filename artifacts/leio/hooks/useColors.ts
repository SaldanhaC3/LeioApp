import colors from "@/constants/colors";

type Palette = typeof colors.light;

/**
 * Always returns the "Papel" (light) palette.
 * The dark theme remains in constants/colors.ts as a code-level fallback
 * but is no longer exposed in the UI.
 */
export function useColors(): Palette & { radius: number } {
  return { ...colors.light, radius: colors.radius };
}
