import { BadgeItem } from "@/components/BadgeItem";
import { CapiMascot } from "@/components/CapiMascot";
import { useApp, getLevel } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Badge } from "@/contexts/AppContext";

const CATEGORIES = [
  { id: "all", label: "Todas" },
  { id: "inicio", label: "Início" },
  { id: "ritmo", label: "Ritmo" },
  { id: "volume", label: "Volume" },
  { id: "sequencia", label: "Sequência" },
  { id: "conquista", label: "Conquistas" },
  { id: "modo", label: "Modos" },
  { id: "social", label: "Social" },
];

export default function BadgesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { badges, xp } = useApp();
  const [activeCategory, setActiveCategory] = useState("all");

  const { current: levelInfo, next: nextLevelInfo } = getLevel(xp);
  const nextXp = nextLevelInfo.minXP;
  const prevXp = levelInfo.minXP;
  const progress = nextXp > prevXp ? (xp - prevXp) / (nextXp - prevXp) : 1;

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const filteredBadges: Badge[] =
    activeCategory === "all"
      ? badges
      : badges.filter((b) => b.category === activeCategory);

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: topInset },
      ]}
    >
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: 20 }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Conquistas
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            {unlockedCount}/{badges.length} desbloqueadas
          </Text>
        </View>
        <CapiMascot
          state={unlockedCount > 5 ? "celebrating" : "waving"}
          size={60}
        />
      </View>

      {/* Level + XP */}
      <View
        style={[
          styles.xpCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            marginHorizontal: 20,
          },
        ]}
      >
        <View style={styles.xpHeader}>
          <Text style={[styles.levelName, { color: colors.foreground }]}>
            {levelInfo.name}
          </Text>
          <Text style={[styles.xpVal, { color: colors.volt }]}>{xp} XP</Text>
        </View>
        <View style={[styles.xpBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.xpFill,
              {
                backgroundColor: colors.volt,
                width: `${Math.round(progress * 100)}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.xpNext, { color: colors.mutedForeground }]}>
          {nextXp - xp} XP para {nextLevelInfo.name}
        </Text>
      </View>

      {/* Category Filter */}
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.categoriesList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              {
                backgroundColor:
                  activeCategory === item.id ? colors.volt : colors.secondary,
              },
            ]}
            onPress={() => setActiveCategory(item.id)}
          >
            <Text
              style={[
                styles.categoryText,
                {
                  color:
                    activeCategory === item.id
                      ? colors.accentForeground
                      : colors.mutedForeground,
                  fontWeight: activeCategory === item.id ? "800" : "500",
                },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Badge Grid */}
      <FlatList
        data={filteredBadges}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.grid,
          { paddingBottom: 100 + bottomInset },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!filteredBadges.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="trophy-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Nenhuma conquista nessa categoria ainda
            </Text>
          </View>
        }
        renderItem={({ item }) => <BadgeItem badge={item} />}
      />
    </View>
  );
}

import { Ionicons } from "@expo/vector-icons";

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: "900", letterSpacing: -1 },
  sub: { fontSize: 13, marginTop: 2 },
  xpCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    marginBottom: 16,
  },
  xpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  levelName: { fontSize: 16, fontWeight: "800" },
  xpVal: { fontSize: 18, fontWeight: "900" },
  xpBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  xpFill: { height: "100%", borderRadius: 3 },
  xpNext: { fontSize: 12 },
  categoriesList: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  categoryChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
  },
  categoryText: { fontSize: 13 },
  row: {
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  grid: { paddingTop: 4 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },
});
