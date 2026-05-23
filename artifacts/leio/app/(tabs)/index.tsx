import { BookCard } from "@/components/BookCard";
import { CapiMascot } from "@/components/CapiMascot";
import { MissionCard } from "@/components/MissionCard";
import { useApp, getLevel } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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

function getGreeting(): string {
  const hour = new Date().getHours();
  const greetings = {
    early: [
      "Madrugador, hein?",
      "Dormiu não é? Bora ler então.",
      "As estrelas aprovam a dedicação.",
    ],
    morning: [
      "Bom dia, leitor!",
      "Café e livro: dupla perfeita.",
      "Começou bem o dia.",
    ],
    afternoon: [
      "Boa tarde!",
      "Hora da siesta literária.",
      "Um capítulo antes do lanche?",
    ],
    evening: [
      "Hora do Modo Vagão!",
      "No busão? Já sabe o que fazer.",
      "Boa tarde pra quem sabe aproveitar.",
    ],
    night: [
      "Sessão noturna, boa leitura!",
      "Modo noturno ativado.",
      "Leitores noturnos são especiais.",
    ],
  };
  let pool: string[];
  if (hour < 5) pool = greetings.early;
  else if (hour < 12) pool = greetings.morning;
  else if (hour < 18) pool = greetings.afternoon;
  else if (hour < 21) pool = greetings.evening;
  else pool = greetings.night;
  return pool[Math.floor(Math.random() * pool.length)];
}

function formatETA(book: { totalPages: number; currentPage: number; pace?: number }): string | null {
  if (!book.pace || book.pace === 0) return null;
  const remaining = book.totalPages - book.currentPage;
  if (remaining <= 0) return null;
  const minutes = remaining / book.pace;
  if (minutes < 60) return `${Math.round(minutes)}MIN`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) return `${hours}H`;
  return `${hours}H ${mins}MIN`;
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { books, sessions, missions, badges, folego, folegoGuardado, xp, getCurrentBook, getAbandoned, completeMission } = useApp();

  const greeting = useMemo(() => getGreeting(), []);
  const currentBook = getCurrentBook();
  const abandoned = getAbandoned();
  const unlockedBadges = badges.filter((b) => b.unlocked);
  const { current: levelInfo } = getLevel(xp);

  const recentSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
  const totalPagesRead = sessions.reduce(
    (acc, s) => acc + (s.endPage - s.startPage),
    0
  );
  const booksRead = books.filter((b) => b.status === "read").length;
  const avgPace =
    sessions.length > 0
      ? sessions.reduce((acc, s) => acc + s.pace, 0) / sessions.length
      : 0;

  const eta = currentBook ? formatETA(currentBook) : null;

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = Platform.OS === "web" ? 34 : 0;

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
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            {greeting}
          </Text>
          <Text style={[styles.level, { color: colors.volt }]}>
            {levelInfo.name}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/settings")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="settings-outline" size={22} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Folego Widget */}
      <View style={[styles.folegoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.folegoLeft}>
          <View style={[styles.folegoIconWrap, { backgroundColor: `${colors.volt}22` }]}>
            <Ionicons name="flame" size={22} color={colors.volt} />
          </View>
          <View>
            <Text style={[styles.folegoCount, { color: colors.foreground }]}>
              {folego} dias
            </Text>
            <Text style={[styles.folegoLabel, { color: colors.mutedForeground }]}>
              de fôlego
            </Text>
          </View>
        </View>
        <View style={styles.folegoRight}>
          <Text style={[styles.guardadoLabel, { color: colors.mutedForeground }]}>
            Guardado
          </Text>
          <View style={styles.tokens}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.token,
                  {
                    backgroundColor:
                      i < folegoGuardado ? colors.volt : colors.border,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Current Book */}
      {currentBook ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Lendo agora
          </Text>
          <TouchableOpacity
            style={[styles.currentBookCard, { backgroundColor: currentBook.coverColor }]}
            onPress={() => router.push(`/livro/${currentBook.id}`)}
            activeOpacity={0.85}
          >
            <View style={styles.currentBookInfo}>
              <Text style={styles.currentBookTitle} numberOfLines={2}>
                {currentBook.title}
              </Text>
              <Text style={styles.currentBookAuthor}>
                {currentBook.author}
              </Text>
              {eta && (
                <View style={styles.etaWrap}>
                  <Text style={styles.etaLabel}>FALTAM</Text>
                  <Text style={[styles.etaValue, { color: colors.volt }]}>
                    {eta}
                  </Text>
                  <Text style={styles.etaLabel}>no seu ritmo</Text>
                </View>
              )}
            </View>
            <CapiMascot state="reading" size={80} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.startSessionBtn, { backgroundColor: colors.volt }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/(tabs)/sessao");
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="play" size={18} color={colors.accentForeground} />
            <Text style={[styles.startSessionText, { color: colors.accentForeground }]}>
              Iniciar sessão
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.addBookPrompt, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/(tabs)/biblioteca")}
          >
            <CapiMascot state="waving" size={64} />
            <Text style={[styles.addBookText, { color: colors.foreground }]}>
              Adicione um livro e comece a ler!
            </Text>
            <Ionicons name="add-circle" size={24} color={colors.volt} />
          </TouchableOpacity>
        </View>
      )}

      {/* Resgates */}
      {abandoned.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Resgates
          </Text>
          <View style={[styles.rescueCard, { backgroundColor: `${colors.coral}15`, borderColor: `${colors.coral}40` }]}>
            <Ionicons name="heart-outline" size={18} color={colors.coral} />
            <View style={styles.rescueText}>
              <Text style={[styles.rescueTitle, { color: colors.foreground }]}>
                {abandoned.length > 1
                  ? `${abandoned.length} livros esperando por você`
                  : `"${abandoned[0].title}" parou há dias`}
              </Text>
              <Text style={[styles.rescueSub, { color: colors.mutedForeground }]}>
                Sem julgamento — bora resgatar?
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/biblioteca")}>
              <Ionicons name="chevron-forward" size={18} color={colors.coral} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Daily Missions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Missões de hoje
          </Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
            {missions.filter((m) => m.completed).length}/{missions.length}
          </Text>
        </View>
        {missions.map((m) => (
          <MissionCard key={m.id} mission={m} onComplete={completeMission} />
        ))}
      </View>

      {/* Stats Grid */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Suas stats
        </Text>
        <View style={styles.statsGrid}>
          {[
            { label: "Páginas lidas", value: totalPagesRead.toString(), icon: "document-text" },
            { label: "Livros lidos", value: booksRead.toString(), icon: "library" },
            { label: "Pace médio", value: avgPace > 0 ? `${avgPace.toFixed(1)} p/min` : "—", icon: "speedometer" },
            { label: "Sessões", value: sessions.length.toString(), icon: "timer" },
          ].map((stat, i) => (
            <View
              key={i}
              style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name={stat.icon as never} size={18} color={colors.volt} />
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

      {/* Recent Badges */}
      {unlockedBadges.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Conquistas
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/badges")}>
              <Text style={[styles.seeAll, { color: colors.volt }]}>
                Ver todas
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {unlockedBadges.slice(-5).map((badge) => (
              <View
                key={badge.id}
                style={[styles.badgePill, { backgroundColor: colors.card, borderColor: colors.volt }]}
              >
                <Ionicons name={badge.icon as never} size={16} color={colors.volt} />
                <Text style={[styles.badgePillText, { color: colors.foreground }]}>
                  {badge.name}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Free Book of the Week */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Livro gratuito da semana
        </Text>
        <TouchableOpacity
          style={[styles.freeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push("/(tabs)/biblioteca")}
          activeOpacity={0.8}
        >
          <View style={[styles.freeCover, { backgroundColor: "#1A5C2A" }]}>
            <Ionicons name="book" size={20} color="rgba(255,255,255,0.5)" />
          </View>
          <View style={styles.freeInfo}>
            <View style={[styles.freeBadge, { backgroundColor: colors.volt }]}>
              <Text style={[styles.freeBadgeText, { color: colors.accentForeground }]}>
                GRÁTIS
              </Text>
            </View>
            <Text style={[styles.freeTitle, { color: colors.foreground }]}>
              Dom Casmurro
            </Text>
            <Text style={[styles.freeAuthor, { color: colors.mutedForeground }]}>
              Machado de Assis
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greeting: { fontSize: 14, fontWeight: "500", marginBottom: 2 },
  level: { fontSize: 18, fontWeight: "900", letterSpacing: -0.5 },
  folegoCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  folegoLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  folegoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  folegoCount: { fontSize: 24, fontWeight: "900", letterSpacing: -1 },
  folegoLabel: { fontSize: 12 },
  folegoRight: { alignItems: "flex-end", gap: 4 },
  guardadoLabel: { fontSize: 11 },
  tokens: { flexDirection: "row", gap: 4 },
  token: { width: 10, height: 10, borderRadius: 5 },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  sectionSub: { fontSize: 13, fontWeight: "600" },
  seeAll: { fontSize: 13, fontWeight: "700" },
  currentBookCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    overflow: "hidden",
  },
  currentBookInfo: { flex: 1, gap: 4, paddingRight: 12 },
  currentBookTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.8,
  },
  currentBookAuthor: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  etaWrap: { marginTop: 12, gap: 2 },
  etaLabel: { fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: 1 },
  etaValue: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 32,
  },
  startSessionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    padding: 14,
  },
  startSessionText: { fontSize: 15, fontWeight: "800" },
  addBookPrompt: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  addBookText: { fontSize: 15, fontWeight: "600", textAlign: "center" },
  rescueCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  rescueText: { flex: 1 },
  rescueTitle: { fontSize: 14, fontWeight: "700" },
  rescueSub: { fontSize: 12, marginTop: 2 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    width: "47%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  statValue: { fontSize: 22, fontWeight: "900", letterSpacing: -0.8 },
  statLabel: { fontSize: 11 },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  badgePillText: { fontSize: 12, fontWeight: "700" },
  freeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  freeCover: {
    width: 48,
    height: 64,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  freeInfo: { flex: 1, gap: 4 },
  freeBadge: {
    alignSelf: "flex-start",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  freeBadgeText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  freeTitle: { fontSize: 15, fontWeight: "700" },
  freeAuthor: { fontSize: 12 },
});
