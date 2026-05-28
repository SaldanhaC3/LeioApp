import { useApp, getLevel, Session, Book, Highlight, GENRE_LABELS } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useMemo } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const HIGHLIGHT_COLORS: Record<string, string> = {
  volt: "#CDFF00",
  noir: "#1a1a1a",
  cream: "#f5f0e8",
  coral: "#FF6B6B",
};

function pagesOf(s: Session): number {
  return Math.max(0, s.endPage - s.startPage);
}

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  const dow = (out.getDay() + 6) % 7; // Mon=0
  out.setDate(out.getDate() - dow);
  return out;
}

function computeStreakWeeks(sessions: Session[]): number {
  if (sessions.length === 0) return 0;
  const today = new Date();
  let weekStart = startOfWeek(today);
  const weeksWithReading = new Set<number>();
  for (const s of sessions) {
    const sd = new Date(s.date);
    if (isNaN(sd.getTime())) continue;
    weeksWithReading.add(startOfWeek(sd).getTime());
  }
  let count = 0;
  while (weeksWithReading.has(weekStart.getTime())) {
    count++;
    const prev = new Date(weekStart);
    prev.setDate(prev.getDate() - 7);
    weekStart = prev;
  }
  return count;
}

function getFavoriteGenres(books: Book[]): { genre: string; label: string }[] {
  const counts: Record<string, number> = {};
  for (const b of books) {
    if ((b.status === "read" || b.status === "reading") && b.genre) {
      counts[b.genre] = (counts[b.genre] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([genre]) => ({ genre, label: GENRE_LABELS[genre] ?? genre }));
}

export default function PerfilScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { books, sessions, highlights, xp } = useApp();
  const { user, signOut } = useAuth();

  const level = getLevel(xp);
  const favoriteGenres = useMemo(() => getFavoriteGenres(books), [books]);
  const recentHighlights = useMemo(
    () =>
      [...highlights]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 3),
    [highlights]
  );
  const streakWeeks = useMemo(() => computeStreakWeeks(sessions), [sessions]);
  const booksRead = books.filter((b) => b.status === "read").length;
  const totalPages = sessions.reduce((sum, s) => sum + pagesOf(s), 0);
  const hoursRead = Math.floor(
    sessions.reduce((sum, s) => sum + s.durationSeconds, 0) / 3600
  );

  const xpProgress =
    level.next && level.next.minXP !== level.current.minXP
      ? Math.min(1, (xp - level.current.minXP) / (level.next.minXP - level.current.minXP))
      : 1;

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);

  function handleLogout() {
    Alert.alert(
      "Sair da conta?",
      "Você precisará entrar novamente para acessar seus dados.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", style: "destructive", onPress: () => signOut?.() },
      ]
    );
  }

  const initials = (user?.username ?? "Leitor").slice(0, 1).toUpperCase();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: topInset, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Settings gear top bar */}
      <View style={[styles.topBar, { paddingHorizontal: 20 }]}>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>
          Perfil
        </Text>
        <TouchableOpacity onPress={() => router.push("/settings")}>
          <Ionicons
            name="settings-outline"
            size={24}
            color={colors.mutedForeground}
          />
        </TouchableOpacity>
      </View>

      {/* Identity card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            marginHorizontal: 20,
            marginBottom: 12,
          },
        ]}
      >
        <View style={styles.identityRow}>
          <TouchableOpacity onPress={() => router.push("/profile-setup")}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.avatar,
                  styles.avatarFallback,
                  { backgroundColor: colors.volt },
                ]}
              >
                <Text
                  style={[
                    styles.avatarInitial,
                    { color: colors.accentForeground },
                  ]}
                >
                  {initials}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.identityInfo}>
            <Text style={[styles.userName, { color: colors.foreground }]}>
              {user?.username ?? "Leitor"}
            </Text>
            {user?.handle ? (
              <Text style={[styles.userHandle, { color: colors.mutedForeground }]}>
                @{user.handle}
              </Text>
            ) : null}
            {user?.email ? (
              <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
                {user.email}
              </Text>
            ) : null}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.editBtn, { borderColor: colors.border }]}
          onPress={() => router.push("/profile-setup")}
        >
          <Text style={[styles.editBtnText, { color: colors.foreground }]}>
            Editar perfil
          </Text>
        </TouchableOpacity>
      </View>

      {/* XP Level card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            marginHorizontal: 20,
            marginBottom: 12,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {level.current.name}
        </Text>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.volt,
                width: `${xpProgress * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.xpText, { color: colors.mutedForeground }]}>
          {xp} XP
          {level.next && level.next.minXP !== level.current.minXP
            ? ` · faltam ${level.next.minXP - xp} XP para ${level.next.name}`
            : " · Nível máximo!"}
        </Text>
      </View>

      {/* Stats row */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            marginHorizontal: 20,
            marginBottom: 12,
          },
        ]}
      >
        <View style={styles.statsRow}>
          {[
            { label: "Livros lidos", value: booksRead.toString(), icon: "📚" },
            {
              label: "Páginas",
              value: totalPages.toLocaleString("pt-BR"),
              icon: "📖",
            },
            { label: "Horas", value: `${hoursRead}h`, icon: "⏱️" },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCol}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {stat.value}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Favorite genres */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            marginHorizontal: 20,
            marginBottom: 12,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Seus Gêneros
        </Text>
        {favoriteGenres.length > 0 ? (
          <View style={styles.genreRow}>
            {favoriteGenres.map((g) => (
              <View
                key={g.genre}
                style={[
                  styles.genrePill,
                  {
                    backgroundColor: `${colors.volt}25`,
                    borderColor: `${colors.volt}60`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.genrePillText,
                    { color: colors.accentText ?? colors.volt },
                  ]}
                >
                  {g.label}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Adicione livros para descobrir seus gêneros
          </Text>
        )}
      </View>

      {/* Streak */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            marginHorizontal: 20,
            marginBottom: 12,
          },
        ]}
      >
        <View style={styles.streakRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              🔥 Fôlego
            </Text>
            <Text
              style={[styles.streakMotivation, { color: colors.mutedForeground }]}
            >
              {streakWeeks === 0
                ? "Comece hoje!"
                : streakWeeks <= 2
                ? "Bom começo!"
                : `${streakWeeks} semanas seguidas 💪`}
            </Text>
          </View>
          <Text style={[styles.streakNumber, { color: colors.volt }]}>
            {streakWeeks}
          </Text>
        </View>
      </View>

      {/* Recent highlights */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            marginHorizontal: 20,
            marginBottom: 12,
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Últimos Trechos
          </Text>
          {highlights.length > 0 && (
            <TouchableOpacity onPress={() => router.push("/(tabs)/biblioteca")}>
              <Text style={[styles.seeAll, { color: colors.volt }]}>
                Ver todos →
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {recentHighlights.length > 0 ? (
          recentHighlights.map((h) => {
            const book = books.find((b) => b.id === h.bookId);
            return (
              <View
                key={h.id}
                style={[
                  styles.highlightItem,
                  {
                    borderLeftColor:
                      HIGHLIGHT_COLORS[h.bgVariant] ?? colors.volt,
                  },
                ]}
              >
                <Text
                  style={[styles.highlightText, { color: colors.foreground }]}
                  numberOfLines={2}
                >
                  {h.text}
                </Text>
                {book ? (
                  <Text
                    style={[
                      styles.highlightBook,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {book.title}
                  </Text>
                ) : null}
              </View>
            );
          })
        ) : (
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Nenhum trecho salvo ainda
          </Text>
        )}
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={[styles.logoutBtn, { borderColor: colors.destructive }]}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.destructive} />
        <Text style={[styles.logoutText, { color: colors.destructive }]}>
          Sair da conta
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  screenTitle: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
  },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarFallback: { justifyContent: "center", alignItems: "center" },
  avatarInitial: { fontSize: 28, fontWeight: "900" },
  identityInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: "800" },
  userHandle: { fontSize: 13, marginTop: 2 },
  userEmail: { fontSize: 12, marginTop: 2 },
  editBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  editBtnText: { fontSize: 14, fontWeight: "600" },
  sectionTitle: { fontSize: 15, fontWeight: "800", marginBottom: 10 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  seeAll: { fontSize: 13, fontWeight: "600" },
  progressTrack: { height: 6, borderRadius: 3, marginBottom: 8 },
  progressFill: { height: 6, borderRadius: 3 },
  xpText: { fontSize: 12 },
  statsRow: { flexDirection: "row" },
  statCol: { flex: 1, alignItems: "center", gap: 4 },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 20, fontWeight: "900" },
  statLabel: { fontSize: 11, textAlign: "center" },
  genreRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  genrePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  genrePillText: { fontSize: 12, fontWeight: "700" },
  streakRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  streakNumber: { fontSize: 48, fontWeight: "900" },
  streakMotivation: { fontSize: 13, marginTop: 2 },
  highlightItem: { borderLeftWidth: 3, paddingLeft: 10, marginBottom: 10 },
  highlightText: { fontSize: 13, lineHeight: 18 },
  highlightBook: { fontSize: 11, marginTop: 3 },
  emptyText: { fontSize: 13 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 8,
  },
  logoutText: { fontSize: 15, fontWeight: "700" },
});
