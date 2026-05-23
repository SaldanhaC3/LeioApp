import { BadgeItem } from "@/components/BadgeItem";
import { CapiMascot } from "@/components/CapiMascot";
import { useApp, getLevel } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DAY_LABELS = ["S", "T", "Q", "Q", "S", "S", "D"];

interface DayStat {
  date: string;
  dayLabel: string;
  pages: number;
  isToday: boolean;
  isFuture: boolean;
}

function buildWeekStats(
  sessions: Array<{ date: string; startPage: number; endPage: number }>,
  weeksAgo: number
): DayStat[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek - weeksAgo * 7);

  const pagesByDate: Record<string, number> = {};
  for (const s of sessions) {
    const key = s.date.split("T")[0];
    pagesByDate[key] = (pagesByDate[key] ?? 0) + Math.max(0, s.endPage - s.startPage);
  }

  const days: DayStat[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = d.toISOString().split("T")[0];
    days.push({
      date: key,
      dayLabel: DAY_LABELS[i],
      pages: pagesByDate[key] ?? 0,
      isToday: d.getTime() === today.getTime(),
      isFuture: d.getTime() > today.getTime(),
    });
  }
  return days;
}

export default function PerfilScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { books, sessions, badges, xp, folego } = useApp();

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const { current: levelInfo, next: nextLevelInfo } = getLevel(xp);
  const progress =
    nextLevelInfo.minXP > levelInfo.minXP
      ? (xp - levelInfo.minXP) / (nextLevelInfo.minXP - levelInfo.minXP)
      : 1;

  const totalPages = sessions.reduce(
    (acc, s) => acc + (s.endPage - s.startPage),
    0
  );
  const booksRead = books.filter((b) => b.status === "read").length;
  const avgPace =
    sessions.length > 0
      ? sessions.reduce((acc, s) => acc + s.pace, 0) / sessions.length
      : 0;

  const bestPace = sessions.reduce((max, s) => Math.max(max, s.pace), 0);
  const bestSession = sessions.reduce(
    (max, s) => Math.max(max, s.endPage - s.startPage),
    0
  );

  const featuredBadges = badges.filter((b) => b.unlocked).slice(0, 3);

  const thisWeek = useMemo(() => buildWeekStats(sessions, 0), [sessions]);
  const lastWeek = useMemo(() => buildWeekStats(sessions, 1), [sessions]);

  const thisWeekPages = thisWeek.reduce((acc, d) => acc + d.pages, 0);
  const lastWeekPages = lastWeek.reduce((acc, d) => acc + d.pages, 0);
  const daysReadThisWeek = thisWeek.filter((d) => d.pages > 0).length;
  const maxPagesInWeek = Math.max(
    1,
    ...thisWeek.map((d) => d.pages),
    ...lastWeek.map((d) => d.pages)
  );
  const weekDelta =
    lastWeekPages > 0
      ? Math.round(((thisWeekPages - lastWeekPages) / lastWeekPages) * 100)
      : thisWeekPages > 0
      ? 100
      : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topInset + 16, paddingBottom: 100 + bottomInset },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.profileHeader}>
        <CapiMascot state="waving" size={72} />
        <View style={styles.profileInfo}>
          <Text style={[styles.levelName, { color: colors.accentText }]}>
            {levelInfo.name}
          </Text>
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
          <Text style={[styles.xpText, { color: colors.mutedForeground }]}>
            {xp} XP · {nextLevelInfo.minXP - xp} para próximo nível
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/settings")}>
          <Ionicons name="settings-outline" size={22} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Personal Bests */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Records pessoais
        </Text>
        <View style={styles.bests}>
          {[
            { icon: "book", label: "Livros lidos", value: booksRead.toString() },
            { icon: "document-text", label: "Páginas totais", value: totalPages.toString() },
            { icon: "speedometer", label: "Melhor pace", value: bestPace > 0 ? `${bestPace.toFixed(1)} p/m` : "—" },
            { icon: "trophy", label: "Maior sessão", value: bestSession > 0 ? `${bestSession} págs` : "—" },
            { icon: "flame", label: "Melhor fôlego", value: `${folego} dias` },
          ].map((item, i) => (
            <View
              key={i}
              style={[styles.bestCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name={item.icon as never} size={20} color={colors.accentText} />
              <Text style={[styles.bestValue, { color: colors.foreground }]}>
                {item.value}
              </Text>
              <Text style={[styles.bestLabel, { color: colors.mutedForeground }]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Weekly Activity */}
      <View style={styles.section}>
        <View style={styles.activityHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>
            Atividade da semana
          </Text>
          {lastWeekPages > 0 && (
            <View
              style={[
                styles.deltaPill,
                {
                  backgroundColor:
                    weekDelta >= 0 ? `${colors.volt}22` : `${colors.coral}22`,
                },
              ]}
            >
              <Ionicons
                name={weekDelta >= 0 ? "trending-up" : "trending-down"}
                size={12}
                color={weekDelta >= 0 ? colors.accentText : colors.coral}
              />
              <Text
                style={[
                  styles.deltaText,
                  { color: weekDelta >= 0 ? colors.accentText : colors.coral },
                ]}
              >
                {weekDelta > 0 ? "+" : ""}
                {weekDelta}%
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.activitySummary}>
            <View style={styles.activitySummaryItem}>
              <Text style={[styles.activityBigNum, { color: colors.foreground }]}>
                {thisWeekPages}
              </Text>
              <Text style={[styles.activitySmallLabel, { color: colors.mutedForeground }]}>
                páginas
              </Text>
            </View>
            <View style={[styles.activityDivider, { backgroundColor: colors.border }]} />
            <View style={styles.activitySummaryItem}>
              <Text style={[styles.activityBigNum, { color: colors.foreground }]}>
                {daysReadThisWeek}
              </Text>
              <Text style={[styles.activitySmallLabel, { color: colors.mutedForeground }]}>
                de 7 dias
              </Text>
            </View>
          </View>

          <View style={styles.weekStrip}>
            {thisWeek.map((day, i) => {
              const heightPct = day.pages > 0 ? Math.max(0.15, day.pages / maxPagesInWeek) : 0;
              return (
                <View key={i} style={styles.dayCol}>
                  <View style={[styles.dayBarTrack, { backgroundColor: colors.secondary }]}>
                    {day.pages > 0 && (
                      <View
                        style={[
                          styles.dayBarFill,
                          {
                            height: `${heightPct * 100}%`,
                            backgroundColor: day.isToday ? colors.volt : `${colors.volt}99`,
                          },
                        ]}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.dayLabel,
                      {
                        color: day.isToday
                          ? colors.foreground
                          : day.isFuture
                          ? `${colors.mutedForeground}55`
                          : colors.mutedForeground,
                        fontWeight: day.isToday ? "900" : "600",
                      },
                    ]}
                  >
                    {day.dayLabel}
                  </Text>
                  {day.pages > 0 && (
                    <Text style={[styles.dayPages, { color: colors.mutedForeground }]}>
                      {day.pages}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          <Text style={[styles.activityFootnote, { color: colors.mutedForeground }]}>
            Semana passada: {lastWeekPages} páginas
          </Text>
        </View>
      </View>

      {/* Featured Badges */}
      {featuredBadges.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Conquistas em destaque
          </Text>
          <View style={styles.featuredBadges}>
            {featuredBadges.map((badge) => (
              <BadgeItem key={badge.id} badge={badge} />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 28,
  },
  profileInfo: { flex: 1, gap: 6 },
  levelName: { fontSize: 18, fontWeight: "900", letterSpacing: -0.5 },
  xpBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  xpFill: { height: "100%", borderRadius: 3 },
  xpText: { fontSize: 11 },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  bests: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  bestCard: {
    width: "47%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  bestValue: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  bestLabel: { fontSize: 11 },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  deltaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  deltaText: { fontSize: 11, fontWeight: "800" },
  activityCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  activitySummary: { flexDirection: "row", alignItems: "center", gap: 16 },
  activitySummaryItem: { flex: 1, alignItems: "flex-start", gap: 2 },
  activityBigNum: { fontSize: 32, fontWeight: "900", letterSpacing: -1.5, lineHeight: 36 },
  activitySmallLabel: { fontSize: 12 },
  activityDivider: { width: 1, height: 40 },
  weekStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 6,
    paddingTop: 4,
  },
  dayCol: { flex: 1, alignItems: "center", gap: 6 },
  dayBarTrack: {
    width: "100%",
    height: 64,
    borderRadius: 8,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  dayBarFill: { width: "100%", borderRadius: 8 },
  dayLabel: { fontSize: 11 },
  dayPages: { fontSize: 10, fontWeight: "700" },
  activityFootnote: { fontSize: 11, textAlign: "center" },
  featuredBadges: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" },
});
