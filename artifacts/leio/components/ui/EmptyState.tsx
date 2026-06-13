import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { CapiMascot } from "@/components/CapiMascot";
import type { CapiState } from "@/contexts/AppContext";
import { Button } from "@/components/ui/Button";
import { useColors } from "@/hooks/useColors";
import { space, type as typeScale } from "@/constants/theme";

interface EmptyStateProps {
  title: string;
  message?: string;
  capiState?: CapiState;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Estado vazio com a personalidade do app: o Capi dá a cara, copy curta e
 * um CTA opcional. Use sempre que uma lista puder vir vazia.
 */
export function EmptyState({
  title,
  message,
  capiState = "waving",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <CapiMascot state={capiState} size={96} />
      <Text style={[typeScale.section, styles.title, { color: colors.foreground }]}>{title}</Text>
      {message ? (
        <Text style={[typeScale.body, styles.message, { color: colors.mutedForeground }]}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: space["4xl"],
    paddingHorizontal: space.xl,
    gap: space.md,
  },
  title: { textAlign: "center", marginTop: space.sm },
  message: { textAlign: "center", maxWidth: 300 },
  action: { marginTop: space.sm },
});

export default EmptyState;
