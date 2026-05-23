import colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";

type Palette = typeof colors.dark;

/**
 * Returns the active palette based on user setting (Papel/Couro).
 * Defaults to the dark "Couro" theme until settings are loaded.
 */
export function useColors(): Palette & { radius: number } {
  const { settings } = useApp();
  const palette = settings?.theme === "light" ? colors.light : colors.dark;
  return { ...palette, radius: colors.radius };
}
