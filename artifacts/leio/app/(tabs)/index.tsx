import { BookCard } from "@/components/BookCard";
import { CapiMascot } from "@/components/CapiMascot";
import { MissionCard } from "@/components/MissionCard";
import { useApp, getLevel, GENRE_LABELS } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Image,
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
      "Madrugada literária, hein?",
      "Insônia de Bentinho. Aproveita pra ler.",
      "Lua acordada, página também.",
    ],
    morning: [
      "Bom dia. Café preto e Machado?",
      "Bom dia, leitor. Capitu te observa.",
      "Manhã boa pra abrir um livro novo.",
    ],
    afternoon: [
      "Boa tarde. Hora do capítulo curto.",
      "Tarde de Clarice — luz que atravessa.",
      "Um capítulo antes do próximo café?",
    ],
    evening: [
      "Fim de tarde. Hora boa pra leitura.",
      "Trânsito ruim? Vagão literário ativado.",
      "O dia caiu — abra um livro.",
    ],
    night: [
      "Boa noite. Sessão calma agora?",
      "Lua de Drummond no horário.",
      "Noite alta, página aberta.",
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
  const { books, sessions, missions, badges, folego, folegoGuardado, xp, getCurrentBook, getAbandoned } = useApp();

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

  const readBooks = useMemo(() => books.filter((b) => b.status === "read"), [books]);
  const genreCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of readBooks) counts[b.genre] = (counts[b.genre] ?? 0) + 1;
    return counts;
  }, [readBooks]);
  const topGenres = useMemo(
    () => Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 4),
    [genreCounts]
  );
  const totalGenreCount = Object.values(genreCounts).reduce((a, b) => a + b, 0);
  const diversitySuggestions = useMemo(() => {
    if (readBooks.length < 2) return [];
    const total = readBooks.length;
    const female = readBooks.filter((b) => b.authorGender === "F").length;
    const nonBinary = readBooks.filter((b) => b.authorGender === "NB").length;
    const br = readBooks.filter((b) => b.authorNationality === "BR").length;
    const femaleRatio = female / total;
    const nbRatio = nonBinary / total;
    const brRatio = br / total;

    const suggestions: Array<{
      key: string;
      icon: keyof typeof Ionicons.glyphMap;
      title: string;
      hint: string;
    }> = [];

    if (femaleRatio < 0.4) {
      suggestions.push({
        key: "f",
        icon: "woman-outline",
        title: "Que tal uma autora mulher?",
        hint: "Sua estante anda meio masculina. Clarice, Conceição, Carola te esperam.",
      });
    }
    if (brRatio < 0.3) {
      suggestions.push({
        key: "br",
        icon: "flag-outline",
        title: "Um pouco de Brasil na estante",
        hint: "Pouca autoria nacional por aqui. Machado, Guimarães, Itamar Vieira Jr.?",
      });
    } else if (brRatio > 0.85) {
      suggestions.push({
        key: "intl",
        icon: "earth-outline",
        title: "Atravesse uma fronteira",
        hint: "Estante bem brasileira. Tenta um russo, uma japonesa, um nigeriano.",
      });
    }
    if (nbRatio === 0 && total >= 5) {
      suggestions.push({
        key: "nb",
        icon: "people-outline",
        title: "Vozes além do binário",
        hint: "Que tal explorar autoras e autores não-binários? Akwaeke Emezi é um começo.",
      });
    }
    return suggestions;
  }, [readBooks]);

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
          <Text style={[styles.level, { color: colors.accentText }]}>
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
            <Ionicons name="flame" size={22} color={colors.accentText} />
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
            {currentBook.coverImage ? (
              <Image
                source={{ uri: currentBook.coverImage }}
                style={styles.currentBookCover}
                resizeMode="cover"
              />
            ) : currentBook.authorImage ? (
              <Image
                source={{ uri: currentBook.authorImage }}
                style={styles.currentBookCover}
                resizeMode="cover"
              />
            ) : (
              <CapiMascot state="reading" size={80} />
            )}
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
              Estante vazia incomoda. Bora adicionar um livro?
            </Text>
            <Ionicons name="add-circle" size={24} color={colors.accentText} />
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
                  ? `${abandoned.length} livros esquecidos na prateleira`
                  : `"${abandoned[0].title}" pegou poeira`}
              </Text>
              <Text style={[styles.rescueSub, { color: colors.mutedForeground }]}>
                Sem julgamento, só um cutucão de saudade.
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
            Tarefas do dia
          </Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
            {missions.filter((m) => m.completed).length}/{missions.length}
          </Text>
        </View>
        {missions.map((m) => (
          <MissionCard key={m.id} mission={m} />
        ))}
      </View>

      {/* Stats Grid */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Seus números
        </Text>
        <View style={styles.statsGrid}>
          {[
            { label: "Páginas lidas", value: totalPagesRead.toString(), icon: "document-text" },
            { label: "Livros lidos", value: booksRead.toString(), icon: "library" },
            { label: "Pace médio", value: avgPace > 0 ? `${avgPace >= 100 ? Math.min(999, Math.round(avgPace)) : avgPace.toFixed(1)} pág./min` : "—", icon: "speedometer" },
            { label: "Sessões", value: sessions.length.toString(), icon: "timer" },
          ].map((stat, i) => (
            <View
              key={i}
              style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name={stat.icon as never} size={18} color={colors.accentText} />
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

      {/* Top Genres */}
      {topGenres.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Gêneros favoritos
          </Text>
          <View style={[styles.genresCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {topGenres.map(([genre, count], i) => {
              const pct = totalGenreCount > 0 ? count / totalGenreCount : 0;
              return (
                <View key={i} style={styles.genreRow}>
                  <Text
                    style={[styles.genreName, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {GENRE_LABELS[genre] ?? genre}
                  </Text>
                  <View style={[styles.genreBar, { backgroundColor: colors.secondary }]}>
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

      {/* Shelf Diversity Suggestions */}
      {diversitySuggestions.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Para variar a estante
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionRow}
          >
            {diversitySuggestions.map((s) => (
              <View
                key={s.key}
                style={[
                  styles.suggestionCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.suggestionIcon,
                    { backgroundColor: colors.volt },
                  ]}
                >
                  <Ionicons name={s.icon} size={18} color={colors.accentForeground} />
                </View>
                <Text style={[styles.suggestionTitle, { color: colors.foreground }]}>
                  {s.title}
                </Text>
                <Text style={[styles.suggestionHint, { color: colors.mutedForeground }]}>
                  {s.hint}
                </Text>
              </View>
            ))}
          </ScrollView>
          <Text style={[styles.diversityNote, { color: colors.mutedForeground }]}>
            Só uma sugestão — sem cobrança, sem catequese.
          </Text>
        </View>
      )}

      {/* Recent Badges */}
      {unlockedBadges.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Conquistas
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/badges")}>
              <Text style={[styles.seeAll, { color: colors.accentText }]}>
                Ver todas
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {unlockedBadges.slice(-5).map((badge) => (
              <View
                key={badge.id}
                style={[styles.badgePill, { backgroundColor: colors.card, borderColor: colors.accentBorder }]}
              >
                <Ionicons name={badge.icon as never} size={16} color={colors.accentText} />
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
          O grátis da semana
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
  currentBookCover: {
    width: 80,
    height: 110,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
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
  genresCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  genreRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  genreName: { fontSize: 13, fontWeight: "700", width: 110 },
  genreBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  genreFill: { height: "100%", borderRadius: 3 },
  genreCount: { fontSize: 12, width: 20, textAlign: "right", fontWeight: "700" },
  suggestionRow: { gap: 10, paddingRight: 4, marginBottom: 10 },
  suggestionCard: {
    width: 220,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionTitle: { fontSize: 14, fontWeight: "800", letterSpacing: -0.2 },
  suggestionHint: { fontSize: 12, lineHeight: 16 },
  diversityNote: { fontSize: 11, fontStyle: "italic", textAlign: "center" },
});
