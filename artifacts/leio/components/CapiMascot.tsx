import { useApp } from "@/contexts/AppContext";
import type { CapiState, CapiVariant } from "@/contexts/AppContext";
import React, { useEffect } from "react";
import { Image, ImageSourcePropType, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const CAPI_IMAGES: Record<CapiVariant, ImageSourcePropType> = {
  default: require("@/assets/images/capi-default.png") as ImageSourcePropType,
  vampire: require("@/assets/images/capi-vampire.png") as ImageSourcePropType,
  erudite: require("@/assets/images/capi-erudite.png") as ImageSourcePropType,
};

interface CapiMascotProps {
  state?: CapiState;
  variant?: CapiVariant;
  size?: number;
  style?: object;
}

export function CapiMascot({
  state,
  variant,
  size = 80,
  style,
}: CapiMascotProps) {
  const { settings, capiState: contextCapiState } = useApp();
  const activeState = state ?? contextCapiState;
  const activeVariant = variant ?? settings.capiVariant;

  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    switch (activeState) {
      case "celebrating":
        scale.value = withRepeat(
          withSequence(
            withSpring(1.2, { damping: 3 }),
            withSpring(0.95, { damping: 5 }),
            withSpring(1.1, { damping: 3 }),
            withSpring(1, { damping: 8 })
          ),
          3,
          false
        );
        translateY.value = withRepeat(
          withSequence(
            withTiming(-12, { duration: 200 }),
            withTiming(0, { duration: 200 })
          ),
          4,
          false
        );
        break;
      case "sleeping":
        scale.value = withRepeat(
          withSequence(
            withTiming(1.05, { duration: 1500 }),
            withTiming(0.98, { duration: 1500 })
          ),
          -1,
          true
        );
        translateY.value = withRepeat(
          withSequence(
            withTiming(3, { duration: 1500 }),
            withTiming(0, { duration: 1500 })
          ),
          -1,
          true
        );
        break;
      case "sad":
        scale.value = withTiming(0.9, { duration: 400 });
        translateY.value = withRepeat(
          withSequence(
            withTiming(2, { duration: 600 }),
            withTiming(0, { duration: 600 })
          ),
          -1,
          true
        );
        opacity.value = withRepeat(
          withSequence(
            withTiming(0.85, { duration: 1000 }),
            withTiming(1, { duration: 1000 })
          ),
          -1,
          true
        );
        break;
      case "waving":
        rotate.value = withRepeat(
          withSequence(
            withTiming(0.15, { duration: 300 }),
            withTiming(-0.1, { duration: 300 }),
            withTiming(0.15, { duration: 300 }),
            withTiming(0, { duration: 300 })
          ),
          3,
          false
        );
        break;
      case "surprised":
        scale.value = withSequence(
          withSpring(1.3, { damping: 2 }),
          withSpring(1, { damping: 8 })
        );
        break;
      case "reading":
        // Respiração contínua: sobe e desce sutil + leve crescimento/redução
        translateY.value = withRepeat(
          withSequence(
            withTiming(-3, { duration: 2400 }),
            withTiming(0, { duration: 2400 })
          ),
          -1,
          true
        );
        scale.value = withRepeat(
          withSequence(
            withTiming(1.02, { duration: 2400 }),
            withTiming(1, { duration: 2400 })
          ),
          -1,
          true
        );
        // Microbalanço de "virar página" - rotação muito sutil ocasional
        rotate.value = withRepeat(
          withSequence(
            withTiming(0, { duration: 4500 }),
            withTiming(0.03, { duration: 250 }),
            withTiming(-0.02, { duration: 250 }),
            withTiming(0, { duration: 250 })
          ),
          -1,
          false
        );
        break;
      case "motivating":
        scale.value = withRepeat(
          withSequence(
            withSpring(1.08, { damping: 5 }),
            withSpring(1, { damping: 8 })
          ),
          3,
          false
        );
        break;
      default:
        scale.value = withSpring(1);
        translateY.value = withTiming(0);
        opacity.value = withTiming(1);
        rotate.value = withTiming(0);
    }
  }, [activeState]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}rad` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Image
        source={CAPI_IMAGES[activeVariant]}
        style={[styles.image, { width: size, height: size }]}
        resizeMode="contain"
      />
      {activeState === "sad" && (
        <View style={[styles.tearDot, { top: size * 0.4, left: size * 0.35 }]} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  image: {
    borderRadius: 8,
  },
  tearDot: {
    position: "absolute",
    width: 4,
    height: 6,
    backgroundColor: "#4FC3F7",
    borderRadius: 2,
  },
});
