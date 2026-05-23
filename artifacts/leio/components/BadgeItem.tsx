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
    }
    onPress?.();
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: badge.unlocked ? colors.card : colors.secondary,
          borderColor: badge.unlocked ? colors.volt : "transparent",
          borderWidth: badge.unlocked ? 1 : 0,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: badge.unlocked
              ? `${colors.volt}22`
              : colors.muted,
          },
        ]}
      >
        <Ionicons
          name={(badge.icon ?? "star") as never}
          size={28}
          color={badge.unlocked ? colors.volt : colors.mutedForeground}
        />
      </View>
      <Text
        style={[
          styles.name,
          {
            color: badge.unlocked ? colors.foreground : colors.mutedForeground,
          },
        ]}
        numberOfLines={2}
      >
        {badge.name}
      </Text>
      {badge.unlocked && (
        <View style={[styles.xpPill, { backgroundColor: `${colors.volt}22` }]}>
          <Text style={[styles.xpText, { color: colors.volt }]}>
            +{badge.xpReward}XP
          </Text>
        </View>
      )}
      {!badge.unlocked && (
        <Text
          style={[styles.lockedText, { color: colors.mutedForeground }]}
          numberOfLines={2}
        >
          {badge.description}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "47%",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
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
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.2,
  },
  xpPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  xpText: {
    fontSize: 10,
    fontWeight: "800",
  },
  lockedText: {
    fontSize: 10,
    textAlign: "center",
    lineHeight: 14,
  },
});
