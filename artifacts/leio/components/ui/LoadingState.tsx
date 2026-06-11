import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { space, type as typeScale } from "@/constants/theme";

interface LoadingStateProps {
  message?: string;
  compact?: boolean;
}

/**
 * Indicador de carregamento padronizado. Use durante buscas/fetches para
 * sinalizar atividade em vez de deixar a tela parecer congelada.
 */
export function LoadingState({ message, compact = false }: LoadingStateProps) {
  const colors = useColors();
  return (
    <View style={[styles.container, compact ? styles.compact : styles.full]}>
      <ActivityIndicator size="small" color={colors.accentText} />
      {message ? (
        <Text style={[typeScale.caption, { color: colors.mutedForeground }]}>{message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", gap: space.md },
  full: { paddingVertical: space["4xl"] },
  compact: { paddingVertical: space.xl },
});

export default LoadingState;
