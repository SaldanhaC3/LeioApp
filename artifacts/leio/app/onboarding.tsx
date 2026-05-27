import { CapiMascot } from "@/components/CapiMascot";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    title: "Hoje você lê,\nou inventa desculpa?",
    subtitle:
      "O Leio anota cada sessão como o Bentinho anotava ciúme: tudo, com data. Torto Arado foi escrito em cadernos velhos. Você tem um app — não tem desculpa.",
    capiState: "waving" as const,
  },
  {
    id: "2",
    title: "Fôlego de leitor\nse cultiva.",
    subtitle:
      "Mantenha a sequência diária. Furou um dia? Você tem Fôlego Guardado. Carolina Maria de Jesus escrevia o Quarto de Despejo entre um turno e outro. Você dá conta.",
    capiState: "motivating" as const,
  },
  {
    id: "3",
    title: "Cada sessão\nvira um card.",
    subtitle:
      "Trechos, números, conquistas — tudo vira card bonito pro Stories. Fourth Wing, O Problema dos 3 Corpos, Intermezzo — o feed agradece o nível.",
    capiState: "celebrating" as const,
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { updateSettings } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  function goNext() {
    Haptics.selectionAsync();
    if (currentIndex < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      finish();
    }
  }

  function finish() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateSettings({ hasCompletedOnboarding: true });
    router.replace("/(tabs)");
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0),
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.skipBtn]}
        onPress={finish}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
          Pular
        </Text>
      </TouchableOpacity>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.capiWrap}>
              <CapiMascot state={item.capiState} size={160} />
            </View>
            <Text style={[styles.slideTitle, { color: colors.foreground }]}>
              {item.title}
            </Text>
            <Text style={[styles.slideSubtitle, { color: colors.mutedForeground }]}>
              {item.subtitle}
            </Text>
          </View>
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === currentIndex ? colors.accentBorder : colors.border,
                  width: i === currentIndex ? 20 : 6,
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: colors.volt }]}
          onPress={goNext}
          activeOpacity={0.85}
        >
          {currentIndex < SLIDES.length - 1 ? (
            <Ionicons
              name="arrow-forward"
              size={24}
              color={colors.accentForeground}
            />
          ) : (
            <Text style={[styles.startText, { color: colors.accentForeground }]}>
              Começar
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipBtn: {
    position: "absolute",
    top: 60,
    right: 24,
    zIndex: 10,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 24,
  },
  capiWrap: {
    marginBottom: 16,
  },
  slideTitle: {
    fontSize: 36,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -1.5,
    lineHeight: 42,
  },
  slideSubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  nextBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  startText: {
    fontSize: 14,
    fontWeight: "800",
  },
});
