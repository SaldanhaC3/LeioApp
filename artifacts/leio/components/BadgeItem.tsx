import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Badge } from "@/contexts/AppContext";

interface BadgeItemProps {
  badge: Badge;
  onPress?: () => void;
}

export function BadgeItem({ badge, onPress }: BadgeItemProps) {
  const colors = useColors();

  function handlePress() {
    if (badge.unlocked) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.selectionAsync();
    }
    onPress?.();
  }

  const unlocked = badge.unlocked;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: unlocked ? colors.card : colors.secondary,
          borderColor: unlocked ? colors.accentBorder : colors.border,
          borderWidth: 1,
          opacity: unlocked ? 1 : 0.85,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: unlocked ? `${colors.volt}22` : colors.muted,
            borderColor: unlocked ? colors.accentBorder : "transparent",
            borderWidth: unlocked ? 1 : 0,
          },
        ]}
      >
        <Ionicons
          name={(unlocked ? badge.icon ?? "star" : "lock-closed") as never}
          size={26}
          color={unlocked ? colors.accentText : colors.mutedForeground}
        />
      </View>

      <Text
        style={[
          styles.name,
          { color: unlocked ? colors.foreground : colors.mutedForeground },
        ]}
        numberOfLines={2}
      >
        {badge.name}
      </Text>

      <Text
        style={[styles.description, { color: colors.mutedForeground }]}
        numberOfLines={2}
      >
        {badge.description}
      </Text>

      <View style={styles.footer}>
        {unlocked ? (
          <View style={[styles.xpPill, { backgroundColor: `${colors.volt}22` }]}>
            <Ionicons name="flash" size={10} color={colors.accentText} />
            <Text style={[styles.xpText, { color: colors.accentText }]}>
              +{badge.xpReward} XP
            </Text>
          </View>
        ) : (
          <View style={[styles.lockedPill, { backgroundColor: colors.muted }]}>
            <Ionicons
              name="lock-closed"
              size={10}
              color={colors.mutedForeground}
            />
            <Text style={[styles.lockedText, { color: colors.mutedForeground }]}>
              Bloqueada
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "47%",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    minHeight: 180,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 14,
    flex: 1,
  },
  footer: {
    marginTop: 4,
  },
  xpPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  xpText: {
    fontSize: 10,
    fontWeight: "800",
  },
  lockedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  lockedText: {
    fontSize: 10,
    fontWeight: "700",
  },
});
