import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { radii, space, type as typeScale } from "@/constants/theme";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZES: Record<Size, { padV: number; padH: number; font: number; icon: number }> = {
  sm: { padV: space.sm, padH: space.md, font: 13, icon: 16 },
  md: { padV: space.md, padH: space.lg, font: 15, icon: 18 },
  lg: { padV: space.lg, padH: space.xl, font: 16, icon: 20 },
};

/**
 * Botão padrão do Leio. Centraliza variantes, estados de loading/disabled e
 * ícones para que as telas parem de remontar TouchableOpacity à mão.
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const colors = useColors();
  const dims = SIZES[size];

  const palette: Record<Variant, { bg: string; fg: string; border: string }> = {
    primary: { bg: colors.volt, fg: "#2A2118", border: colors.volt },
    secondary: { bg: colors.secondary, fg: colors.foreground, border: colors.border },
    ghost: { bg: "transparent", fg: colors.accentText, border: "transparent" },
    destructive: { bg: "transparent", fg: colors.coral, border: colors.coral },
  };
  const p = palette[variant];
  const isInactive = disabled || loading;

  return (
    <Pressable
      onPress={isInactive ? undefined : onPress}
      disabled={isInactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: p.bg,
          borderColor: p.border,
          paddingVertical: dims.padV,
          paddingHorizontal: dims.padH,
          opacity: isInactive ? 0.5 : pressed ? 0.85 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={p.fg} />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === "left" && (
            <Ionicons name={icon} size={dims.icon} color={p.fg} />
          )}
          <Text
            style={[typeScale.bodyStrong, { color: p.fg, fontSize: dims.font, fontWeight: "800" }]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {icon && iconPosition === "right" && (
            <Ionicons name={icon} size={dims.icon} color={p.fg} />
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: { alignSelf: "stretch" },
  content: { flexDirection: "row", alignItems: "center", gap: space.sm },
});

export default Button;
