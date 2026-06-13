import React from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { elevation, radii, space } from "@/constants/theme";

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  padded?: boolean;
  raised?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Superfície padrão do app: fundo de cartão, borda quente e raio consistente.
 * Substitui as dezenas de Views com os mesmos borderWidth/borderColor inline.
 */
export function Card({ children, onPress, padded = true, raised = false, style }: CardProps) {
  const colors = useColors();
  const base: StyleProp<ViewStyle> = [
    styles.card,
    {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    padded && styles.padded,
    raised && elevation.sm,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [base, pressed && { opacity: 0.9 }]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={base}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  padded: { padding: space.lg },
});

export default Card;
