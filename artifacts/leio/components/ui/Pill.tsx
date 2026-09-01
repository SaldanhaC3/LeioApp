import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { radii, space, type as typeScale } from "@/constants/theme";

interface PillProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  active?: boolean;
  onPress?: () => void;
}

/**
 * Chip/pílula reutilizável usada em filtros e tags. Estado ativo usa o
 * acento (volt); inativo segue a superfície neutra.
 */
export function Pill({ label, icon, active = false, onPress }: PillProps) {
  const colors = useColors();
  const content = (
    <>
      {icon ? (
        <Ionicons
          name={icon}
          size={14}
          color={active ? colors.foreground : colors.mutedForeground}
        />
      ) : null}
      <Text
        style={[
          typeScale.caption,
          { color: active ? colors.foreground : colors.mutedForeground, fontWeight: "700" },
        ]}
      >
        {label}
      </Text>
    </>
  );

  const style = [
    styles.pill,
    {
      backgroundColor: active ? colors.volt : colors.secondary,
      borderColor: active ? colors.volt : colors.border,
    },
  ];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [style, pressed && { opacity: 0.85 }]}>
        {content}
      </Pressable>
    );
  }
  return <View style={style}>{content}</View>;
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    paddingVertical: space.xs + 2,
    paddingHorizontal: space.md,
    borderRadius: radii.full,
    borderWidth: 1,
  },
});

export default Pill;
