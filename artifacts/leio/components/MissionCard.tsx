import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Mission } from "@/contexts/AppContext";

const MISSION_ICONS: Record<string, string> = {
  pages: "book-outline",
  session: "timer-outline",
  share: "share-social-outline",
  vocabulary: "language-outline",
  pace: "flash-outline",
};

interface MissionCardProps {
  mission: Mission;
  onComplete?: (id: string) => void;
}

export function MissionCard({ mission, onComplete }: MissionCardProps) {
  const colors = useColors();
  const progress = Math.min(1, mission.progress / mission.target);

  function handlePress() {
    if (mission.completed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onComplete?.(mission.id);
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: mission.completed ? colors.volt : colors.border,
          opacity: mission.completed ? 0.7 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: mission.completed
              ? colors.volt
              : colors.secondary,
          },
        ]}
      >
        <Ionicons
          name={(MISSION_ICONS[mission.type] ?? "star-outline") as never}
          size={18}
          color={mission.completed ? colors.accentForeground : colors.mutedForeground}
        />
      </View>

      <View style={styles.body}>
        <Text
          style={[
            styles.text,
            {
              color: colors.foreground,
              textDecorationLine: mission.completed ? "line-through" : "none",
            },
          ]}
          numberOfLines={2}
        >
          {mission.text}
        </Text>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: mission.completed ? colors.volt : colors.primary,
              },
            ]}
          />
        </View>
        <View style={styles.footer}>
          <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
            {mission.progress}/{mission.target}
          </Text>
          <View style={styles.xpBadge}>
            <Text style={[styles.xpText, { color: colors.volt }]}>
              +{mission.xpReward} XP
            </Text>
          </View>
        </View>
      </View>

      {!mission.completed && (
        <TouchableOpacity
          style={[styles.checkBtn, { borderColor: colors.border }]}
          onPress={handlePress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="checkmark" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressText: {
    fontSize: 11,
  },
  xpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  xpText: {
    fontSize: 11,
    fontWeight: "700",
  },
  checkBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
