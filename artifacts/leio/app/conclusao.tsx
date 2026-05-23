import { CapiMascot } from "@/components/CapiMascot";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}min`;
  return `${m}min ${s}s`;
}

const FOCUS_MESSAGES = [
  "Foco total. Nem o Big Brother do Orwell te vigiou tanto.",
  "Capi orgulhosa. Riobaldo também.",
  "Disciplina drummondiana: no meio do caminho, leitura.",
];

const ABANDON_MESSAGES = [
  "Sem drama. Até o Bentinho parava pra respirar.",
  "Tá bom por hoje. A travessia continua amanhã.",
  "Página fechada não é página perdida.",
];

const SHARE_PHRASES = [
  "Mais um livro na estante imaginária.",
  "Hoje o foco venceu o feed.",
  "Lendo igual gente grande (e sem precisar postar print).",
  "O algoritmo chora, Machado sorri.",
  "Menos scroll, mais Drummond.",
  "Vagão lotado, página virada.",
  "Cérebro em construção — devagar e sempre.",
  "Capítulo fechado, ego saudavelmente inflado.",
  "Eça aprovaria essa sessão.",
  "Sessão concluída. Capitu não desconfiou de nada.",
];

export default function ConclusaoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    bookId: string;
    startPage: string;
    endPage: string;
    durationSeconds: string;
    pace: string;
    focusMode: string;
    focusExitSeconds: string;
  }>();
  const { getBookById, badges, freeBooks } = useApp();

  const book = getBookById(params.bookId ?? "");
  const endPage = parseInt(params.endPage ?? "0", 10);
  const startPage = parseInt(params.startPage ?? "0", 10);
  const pages = endPage - startPage;
  const duration = parseInt(params.durationSeconds ?? "0", 10);
  const pace = parseFloat(params.pace ?? "0");
  const isFocusMode = params.focusMode === "1";
  const focusExitSeconds = parseInt(params.focusExitSeconds ?? "0", 10);
  const isFocusClean = isFocusMode && focusExitSeconds === 0;

  const newlyUnlocked = badges.filter(
    (b) => b.unlocked && b.unlockedAt &&
    Date.now() - new Date(b.unlockedAt).getTime() < 60000
  );

  const pagesAnim = useRef(new Animated.Value(0)).current;
  const durationAnim = useRef(new Animated.Value(0)).current;
  const [displayPages, setDisplayPages] = useState(0);
  const [displayDuration, setDisplayDuration] = useState(0);
  const [isSharing, setIsSharing] = useState(false);

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  useEffect(() => {
    Haptics.notificationAsync(
      isFocusClean
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Success
    );

    Animated.timing(pagesAnim, {
      toValue: pages,
      duration: 800,
      useNativeDriver: false,
    }).start();
    Animated.timing(durationAnim, {
      toValue: duration,
      duration: 900,
      useNativeDriver: false,
    }).start();

    pagesAnim.addListener(({ value }) => setDisplayPages(Math.round(value)));
    durationAnim.addListener(({ value }) => setDisplayDuration(Math.round(value)));

    return () => {
      pagesAnim.removeAllListeners();
      durationAnim.removeAllListeners();
    };
  }, []);

  function handleShare() {
    if (isSharing || !book) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSharing(true);
    router.push({
      pathname: "/compartilhar",
      params: {
        bookId: book.id,
        pages: String(pages),
        durationSeconds: String(duration),
        pace: String(pace),
      },
    });
    setTimeout(() => setIsSharing(false), 600);
  }

  const focusMessage =
    FOCUS_MESSAGES[Math.floor(Math.random() * FOCUS_MESSAGES.length)];
  const abandonMessage =
    ABANDON_MESSAGES[Math.floor(Math.random() * ABANDON_MESSAGES.length)];

  const isBookFinished = book && endPage >= book.totalPages;

  const suggestedBook = freeBooks[0];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: topInset + 16,
          paddingBottom: bottomInset + 16,
          paddingHorizontal: 24,
        },
      ]}
    >
      {/* Capi */}
      <View style={styles.capiSection}>
        <CapiMascot
          state={pages === 0 ? "sad" : isFocusClean ? "celebrating" : "celebrating"}
          size={100}
        />
        <Text style={[styles.mainMessage, { color: colors.foreground }]}>
          {isBookFinished
            ? "Capa fechada. Livro vencido."
            : pages === 0
            ? abandonMessage
            : isFocusClean
            ? focusMessage
            : "Sessão na conta. Próximo capítulo te espera."}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statVal, { color: colors.accentText }]}>
            {displayPages}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            páginas
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statVal, { color: colors.accentText }]}>
            {formatDuration(displayDuration)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            duração
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statVal, { color: colors.accentText }]}>
            {pace > 0 ? (pace >= 100 ? Math.min(999, Math.round(pace)).toString() : pace.toFixed(1)) : "—"}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            págs/min
          </Text>
        </View>
      </View>

      {/* Focus Summary */}
      {isFocusMode && (
        <View
          style={[
            styles.focusSummary,
            {
              backgroundColor: isFocusClean
                ? `${colors.volt}15`
                : `${colors.coral}15`,
              borderColor: isFocusClean ? colors.volt : colors.coral,
            },
          ]}
        >
          <Ionicons
            name={isFocusClean ? "shield-checkmark" : "eye-off-outline"}
            size={16}
            color={isFocusClean ? colors.accentText : colors.coral}
          />
          <Text
            style={[
              styles.focusSummaryText,
              { color: isFocusClean ? colors.accentText : colors.coral },
            ]}
          >
            {isFocusClean
              ? "Foco impecável. Nem Bentinho ficou tão atento."
              : `${Math.floor(focusExitSeconds / 60)}min ${focusExitSeconds % 60}s fora do app`}
          </Text>
        </View>
      )}

      {/* New Badges */}
      {newlyUnlocked.length > 0 && (
        <View style={[styles.badgeSection, { backgroundColor: `${colors.volt}15`, borderColor: colors.volt }]}>
          <Text style={[styles.badgeHeader, { color: colors.accentText }]}>
  Medalhinhas novas na estante!
          </Text>
          {newlyUnlocked.map((badge) => (
            <View key={badge.id} style={styles.badgeRow}>
              <Ionicons name={badge.icon as never} size={18} color={colors.accentText} />
              <Text style={[styles.badgeName, { color: colors.foreground }]}>
                {badge.name}
              </Text>
              <Text style={[styles.badgeXP, { color: colors.accentText }]}>
                +{badge.xpReward}XP
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Next Book suggestion */}
      {suggestedBook && (
        <View style={[styles.nextBookCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.nextBookLabel, { color: colors.mutedForeground }]}>
Próximo livro da fila?
          </Text>
          <Text style={[styles.nextBookTitle, { color: colors.foreground }]} numberOfLines={1}>
            {suggestedBook.title}
          </Text>
          <Text style={[styles.nextBookAuthor, { color: colors.mutedForeground }]}>
            {suggestedBook.author} · grátis
          </Text>
        </View>
      )}

      {/* Actions */}
      <TouchableOpacity
        style={[
          styles.shareBtn,
          { backgroundColor: colors.volt, opacity: isSharing ? 0.7 : 1 },
        ]}
        onPress={handleShare}
        activeOpacity={0.85}
        disabled={isSharing}
      >
        {isSharing ? (
          <ActivityIndicator size="small" color={colors.accentForeground} />
        ) : (
          <Ionicons
            name="share-social-outline"
            size={20}
            color={colors.accentForeground}
          />
        )}
        <Text style={[styles.shareBtnText, { color: colors.accentForeground }]}>
{isSharing ? "Diagramando o card..." : "Mostrar essa sessão pro mundo"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.homeBtn, { borderColor: colors.border }]}
        onPress={() => {
          Haptics.selectionAsync();
          router.replace("/(tabs)");
        }}
        activeOpacity={0.8}
      >
        <Text style={[styles.homeBtnText, { color: colors.foreground }]}>
Voltar pro início
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  capiSection: { alignItems: "center", gap: 12, marginBottom: 28 },
  mainMessage: {
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.8,
  },
  statsGrid: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  statVal: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  statLabel: { fontSize: 11 },
  focusSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  focusSummaryText: { fontSize: 13, fontWeight: "700" },
  badgeSection: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    marginBottom: 16,
  },
  badgeHeader: { fontSize: 14, fontWeight: "800" },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  badgeName: { flex: 1, fontSize: 14, fontWeight: "600" },
  badgeXP: { fontSize: 12, fontWeight: "700" },
  nextBookCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    gap: 4,
  },
  nextBookLabel: { fontSize: 11, letterSpacing: 0.5 },
  nextBookTitle: { fontSize: 15, fontWeight: "700" },
  nextBookAuthor: { fontSize: 12 },
  photoPickBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  photoPickText: { fontSize: 14, fontWeight: "700" },
  photoPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  photoThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#000",
  },
  photoPreviewText: { flex: 1, gap: 2 },
  photoPreviewTitle: { fontSize: 13, fontWeight: "800" },
  photoPreviewSub: { fontSize: 11 },
  photoRemoveBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 16,
    padding: 18,
    marginBottom: 10,
  },
  shareBtnText: { fontSize: 16, fontWeight: "900" },
  homeBtn: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  homeBtnText: { fontSize: 15, fontWeight: "700" },
});
