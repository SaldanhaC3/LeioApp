import { BadgeItem } from "@/components/BadgeItem";
import { CapiMascot } from "@/components/CapiMascot";
import { useApp, getLevel } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Badge } from "@/contexts/AppContext";

type IoniconName = keyof typeof Ionicons.glyphMap;

const CATEGORIES: { id: string; label: string; icon: IoniconName }[] = [
  { id: "all", label: "Todas", icon: "grid-outline" },
  { id: "inicio", label: "Início", icon: "rocket-outline" },
  { id: "ritmo", label: "Ritmo", icon: "speedometer-outline" },
  { id: "volume", label: "Volume", icon: "library-outline" },
  { id: "sequencia", label: "Sequência", icon: "flame-outline" },
  { id: "habito", label: "Hábito", icon: "calendar-outline" },
  { id: "conquista", label: "Conquistas", icon: "trophy-outline" },
  { id: "modo", label: "Modos", icon: "color-wand-outline" },
  { id: "vocabulario", label: "Vocabulário", icon: "book-outline" },
  { id: "metas", label: "Metas", icon: "flag-outline" },
  { id: "diversidade", label: "Diversidade", icon: "globe-outline" },
  { id: "social", label: "Social", icon: "share-social-outline" },
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

  const categoryCounts = useMemo(() => {
    const counts: Record<string, { total: number; unlocked: number }> = {
      all: { total: badges.length, unlocked: unlockedCount },
    };
    for (const cat of CATEGORIES) {
      if (cat.id === "all") continue;
      const list = badges.filter((b) => b.category === cat.id);
      counts[cat.id] = {
        total: list.length,
        unlocked: list.filter((b) => b.unlocked).length,
      };
    }
    return counts;
  }, [badges, unlockedCount]);

  const visibleCategories = CATEGORIES.filter(
    (c) => c.id === "all" || (categoryCounts[c.id]?.total ?? 0) > 0
  );

  const sortedBadges = useMemo(
    () =>
      [...filteredBadges].sort((a, b) => {
        if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
        return 0;
      }),
    [filteredBadges]
  );

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
          <Text style={[styles.xpVal, { color: colors.accentText }]}>{xp} XP</Text>
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
      <View style={styles.categoriesWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        >
          {visibleCategories.map((item) => {
            const isActive = activeCategory === item.id;
            const counts = categoryCounts[item.id] ?? { total: 0, unlocked: 0 };
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isActive ? colors.foreground : colors.card,
                    borderColor: isActive ? colors.foreground : colors.border,
                  },
                ]}
                onPress={() => setActiveCategory(item.id)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={item.icon}
                  size={14}
                  color={isActive ? colors.background : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color: isActive ? colors.background : colors.foreground,
                      fontWeight: isActive ? "800" : "600",
                    },
                  ]}
                >
                  {item.label}
                </Text>
                <View
                  style={[
                    styles.categoryCount,
                    {
                      backgroundColor: isActive
                        ? `${colors.background}33`
                        : colors.secondary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryCountText,
                      {
                        color: isActive ? colors.background : colors.mutedForeground,
                      },
                    ]}
                  >
                    {counts.unlocked}/{counts.total}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Badge Grid */}
      <FlatList
        data={sortedBadges}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.grid,
          { paddingBottom: 100 + bottomInset },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!sortedBadges.length}
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
  categoriesWrap: {
    marginBottom: 8,
  },
  categoriesList: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
    alignItems: "center",
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryText: { fontSize: 13 },
  categoryCount: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 2,
  },
  categoryCountText: { fontSize: 10, fontWeight: "800" },
  row: {
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  grid: { paddingTop: 4 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },
});
