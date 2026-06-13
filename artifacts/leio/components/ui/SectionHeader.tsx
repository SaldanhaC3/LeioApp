import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { space, type as typeScale } from "@/constants/theme";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Cabeçalho de seção reutilizável (título + subtítulo opcional + "ver tudo").
 * Padroniza o padrão hoje repetido inline na Home e na Biblioteca.
 */
export function SectionHeader({ title, subtitle, actionLabel, onAction }: SectionHeaderProps) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <View style={styles.titles}>
        <Text style={[typeScale.section, { color: colors.foreground }]}>{title}</Text>
        {subtitle ? (
          <Text style={[typeScale.caption, { color: colors.mutedForeground }]}>{subtitle}</Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[typeScale.caption, { color: colors.accentText, fontWeight: "700" }]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space.md,
    gap: space.md,
  },
  titles: { flex: 1, gap: 2 },
});

export default SectionHeader;
