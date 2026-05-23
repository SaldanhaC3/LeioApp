import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BadgeToastProps {
  visible: boolean;
  badgeName: string;
  badgeIcon: string;
  xpReward: number;
  onHide: () => void;
}

const SLIDE_OFFSET = -160;
const SHOW_DURATION_MS = 3500;

export function BadgeToast({
  visible,
  badgeName,
  badgeIcon,
  xpReward,
  onHide,
}: BadgeToastProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SLIDE_OFFSET)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 160,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SLIDE_OFFSET,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
        }),
      ]).start(() => {
        translateY.setValue(SLIDE_OFFSET);
        opacity.setValue(0);
        onHide();
      });
    }, SHOW_DURATION_MS);

    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.volt,
          top: insets.top + 12,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${colors.volt}22` }]}>
        <Ionicons
          name={badgeIcon as React.ComponentProps<typeof Ionicons>["name"]}
          size={22}
          color={colors.accentText}
        />
      </View>

      <View style={styles.textWrap}>
        <Text style={[styles.headline, { color: colors.mutedForeground }]}>
          Conquista desbloqueada!
        </Text>
        <Text
          style={[styles.name, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {badgeName}
        </Text>
      </View>

      <View style={[styles.xpPill, { backgroundColor: `${colors.volt}22` }]}>
        <Ionicons name="flash" size={11} color={colors.accentText} />
        <Text style={[styles.xpText, { color: colors.accentText }]}>
          +{xpReward}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    zIndex: 999,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  headline: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  xpPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  xpText: {
    fontSize: 13,
    fontWeight: "800",
  },
});
