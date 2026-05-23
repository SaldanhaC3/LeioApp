import { BadgeItem } from "@/components/BadgeItem";
import { CapiMascot } from "@/components/CapiMascot";
import { useApp, getLevel, GENRE_LABELS } from "@/contexts/AppContext";
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

function buildHeatmap(sessions: Array<{ date: string }>) {
  const map: Record<string, number> = {};
  sessions.forEach((s) => {
    const d = s.date.split("T")[0];
    map[d] = (map[d] ?? 0) + 1;
  });
  const weeks: Array<Array<{ date: string; count: number }>> = [];
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 52 * 7);
  let week: Array<{ date: string; count: number }> = [];
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().split("T")[0];
    week.push({ date: key, count: map[key] ?? 0 });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) weeks.push(week);
  return weeks;
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
  const heatmap = useMemo(() => buildHeatmap(sessions), [sessions]);

  // Genre distribution
  const genreCounts: Record<string, number> = {};
  books
    .filter((b) => b.status === "read")
    .forEach((b) => {
      genreCounts[b.genre] = (genreCounts[b.genre] ?? 0) + 1;
    });
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Diversity
  const readBooks = books.filter((b) => b.status === "read");
  const femaleAuthors = readBooks.filter((b) => b.authorGender === "F").length;
  const brAuthors = readBooks.filter((b) => b.authorNationality === "BR").length;

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

      {/* Heatmap */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Atividade de leitura
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.heatmap}>
            {heatmap.slice(-26).map((week, wi) => (
              <View key={wi} style={styles.heatmapWeek}>
                {week.map((day, di) => (
                  <View
                    key={di}
                    style={[
                      styles.heatmapCell,
                      {
                        backgroundColor:
                          day.count === 0
                            ? colors.secondary
                            : day.count === 1
                            ? `${colors.volt}55`
                            : day.count === 2
                            ? `${colors.volt}99`
                            : colors.volt,
                      },
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Top Genres */}
      {topGenres.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Gêneros favoritos
          </Text>
          <View style={styles.genres}>
            {topGenres.map(([genre, count], i) => {
              const total = Object.values(genreCounts).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? count / total : 0;
              return (
                <View key={i} style={styles.genreRow}>
                  <Text style={[styles.genreName, { color: colors.foreground }]} numberOfLines={1}>
                    {GENRE_LABELS[genre] ?? genre}
                  </Text>
                  <View style={[styles.genreBar, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.genreFill,
                        { backgroundColor: colors.volt, width: `${pct * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={[styles.genreCount, { color: colors.mutedForeground }]}>
                    {count}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Diversity */}
      {readBooks.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Diversidade da estante
          </Text>
          <View style={[styles.diversityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {readBooks.length > 0 && (
              <View style={styles.diversityRow}>
                <Ionicons name="person-outline" size={16} color={colors.accentText} />
                <Text style={[styles.diversityText, { color: colors.foreground }]}>
                  {femaleAuthors > 0
                    ? `${Math.round((femaleAuthors / readBooks.length) * 100)}% de autoras mulheres`
                    : "Nenhuma autora mulher ainda — que tal explorar?"}
                </Text>
              </View>
            )}
            <View style={styles.diversityRow}>
              <Ionicons name="flag-outline" size={16} color={colors.accentText} />
              <Text style={[styles.diversityText, { color: colors.foreground }]}>
                {brAuthors > 0
                  ? `${Math.round((brAuthors / readBooks.length) * 100)}% de autores brasileiros`
                  : "Nenhum autor brasileiro ainda"}
              </Text>
            </View>
            <Text style={[styles.diversityNote, { color: colors.mutedForeground }]}>
              Só uma observação — sem julgamento.
            </Text>
          </View>
        </View>
      )}

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
  heatmap: { flexDirection: "row", gap: 3 },
  heatmapWeek: { gap: 3 },
  heatmapCell: { width: 11, height: 11, borderRadius: 2 },
  genres: { gap: 12 },
  genreRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  genreName: { fontSize: 13, fontWeight: "600", width: 120 },
  genreBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  genreFill: { height: "100%", borderRadius: 3 },
  genreCount: { fontSize: 12, width: 20, textAlign: "right" },
  diversityCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  diversityRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  diversityText: { fontSize: 14, flex: 1 },
  diversityNote: { fontSize: 11, fontStyle: "italic" },
  featuredBadges: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" },
});
