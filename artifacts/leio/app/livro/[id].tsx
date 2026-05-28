import { useApp, GENRE_LABELS } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BookStatus } from "@/contexts/AppContext";
import { bookFileExists } from "@/services/readerFiles";
import { useEffect } from "react";

function relativeLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  if (clean.length < 6) return 0;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function getCoverOverlay(hex: string): number {
  const L = relativeLuminance(hex);
  if (L <= 0.18) return 0;
  const needed = 1 - 0.18 / L;
  return Math.min(needed + 0.05, 0.7);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}min` : `${h}h`;
}

const STATUS_LABELS: Record<BookStatus, string> = {
  reading: "Lendo",
  read: "Lido",
  want: "Quero ler",
  abandoned: "Abandonado",
};

export default function LivroDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getBookById, updateBook, removeBook, sessions } = useApp();

  const book = getBookById(id ?? "");
  const [activeTab, setActiveTab] = useState<"sessoes" | "vocab">("sessoes");
  const [hasBookFile, setHasBookFile] = useState(false);

  useEffect(() => {
    if (!id) return;
    bookFileExists(id).then((result) => setHasBookFile(!!result)).catch(() => {});
  }, [id]);

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  if (!book) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset + 20, paddingHorizontal: 20 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.errorText, { color: colors.foreground }]}>
          Livro não encontrado
        </Text>
      </View>
    );
  }

  const bookSessions = sessions.filter((s) => s.bookId === book.id);
  const progress = book.totalPages > 0 ? book.currentPage / book.totalPages : 0;
  const totalTime = bookSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const avgPace =
    bookSessions.length > 0
      ? bookSessions.reduce((acc, s) => acc + s.pace, 0) / bookSessions.length
      : 0;

  function handleStatusChange(status: BookStatus) {
    Haptics.selectionAsync();
    updateBook(book!.id, {
      status,
      ...(status === "read"
        ? { currentPage: book!.totalPages, finishedAt: new Date().toISOString() }
        : {}),
    });
  }

  function handleDelete() {
    Alert.alert(
      "Tirar da estante",
      `Vai mesmo despachar "${book!.title}" da biblioteca?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            removeBook(book!.id);
            router.back();
          },
        },
      ]
    );
  }

  function handleStartSession() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/sessao-ativa",
      params: {
        bookId: book!.id,
        startPage: book!.currentPage.toString(),
        ambient: "cafe",
        focusMode: "0",
        focusDuration: "30",
      },
    });
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topInset + 16, paddingBottom: 100 + bottomInset },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Back */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={colors.foreground} />
      </TouchableOpacity>

      {/* Cover Header */}
      <View style={[styles.coverSection, { backgroundColor: book.coverColor }]}>
        {/* WCAG AA overlay: darken light covers so white text passes 4.5:1 */}
        {getCoverOverlay(book.coverColor) > 0 && (
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: `rgba(0,0,0,${getCoverOverlay(book.coverColor)})`,
                borderRadius: 16,
              },
            ]}
            pointerEvents="none"
          />
        )}
        <View style={styles.coverIcon}>
          {book.coverImage ? (
            <Image
              source={{ uri: book.coverImage }}
              style={styles.coverImageFull}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <Ionicons name="camera-outline" size={32} color="rgba(255,255,255,0.4)" />
          )}
        </View>
        <View style={styles.coverInfo}>
          <Text style={styles.coverTitle} numberOfLines={3}>
            {book.title}
          </Text>
          <Text style={styles.coverAuthor}>{book.author}</Text>
          <View style={styles.coverMeta}>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>
                {STATUS_LABELS[book.status]}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Free book: read in-app */}
      {book.isFree && book.excerpt && (
        <View style={[styles.freeSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.freeSectionHeader}>
            <Ionicons name="gift-outline" size={18} color={colors.accentText} />
            <Text style={[styles.freeSectionTitle, { color: colors.foreground }]}>
              Clássico de domínio público
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.freeReadBtn, { backgroundColor: colors.volt }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/leitor/${book.id}`);
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="book-outline" size={18} color={colors.accentForeground} />
            <Text style={[styles.freeReadBtnText, { color: colors.accentForeground }]}>
              Ler trecho aqui mesmo
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Progress */}
      {book.status === "reading" && (
        <View style={styles.progressSection}>
          <View style={styles.progressMeta}>
            <Text style={[styles.progressPages, { color: colors.foreground }]}>
              Pág. {book.currentPage} de {book.totalPages}
            </Text>
            <Text style={[styles.progressPct, { color: colors.accentText }]}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: colors.volt, width: `${progress * 100}%` },
              ]}
            />
          </View>
        </View>
      )}

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        {[
          { label: "Sessões", value: bookSessions.length.toString(), icon: "timer-outline" },
          { label: "Tempo total", value: formatDuration(totalTime), icon: "hourglass-outline" },
          { label: "Pace médio", value: avgPace > 0 ? `${avgPace >= 100 ? Math.min(999, Math.round(avgPace)) : avgPace.toFixed(1)} pág./min` : "—", icon: "speedometer-outline" },
          { label: "Gênero", value: GENRE_LABELS[book.genre] ?? book.genre, icon: "bookmark-outline" },
        ].map((stat, i) => (
          <View
            key={i}
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name={stat.icon as never} size={16} color={colors.accentText} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {stat.value}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Actions */}
      {(book.status === "reading" || book.status === "want") && (
        <TouchableOpacity
          style={[styles.primaryAction, { backgroundColor: colors.volt }]}
          onPress={handleStartSession}
          activeOpacity={0.85}
        >
          <Ionicons name="play" size={20} color={colors.accentForeground} />
          <Text style={[styles.primaryActionText, { color: colors.accentForeground }]}>
            {book.status === "want" ? "Abrir o livro" : "Voltar pro capítulo"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Open file reader */}
      <TouchableOpacity
        style={[
          styles.primaryAction,
          {
            backgroundColor: hasBookFile ? colors.secondary : colors.card,
            borderWidth: 1.5,
            borderColor: hasBookFile ? colors.volt : colors.border,
            marginTop: -8,
          },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/leitor-arquivo/${book.id}`);
        }}
        activeOpacity={0.85}
      >
        <Ionicons
          name={hasBookFile ? "document-text" : "document-text-outline"}
          size={20}
          color={hasBookFile ? colors.volt : colors.mutedForeground}
        />
        <Text
          style={[
            styles.primaryActionText,
            { color: hasBookFile ? colors.foreground : colors.mutedForeground },
          ]}
        >
          {hasBookFile ? "Abrir leitor de arquivo" : "Importar PDF / ePub"}
        </Text>
      </TouchableOpacity>

      {/* Status Change */}
      <View style={styles.statusSection}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Status
        </Text>
        <View style={styles.statusBtns}>
          {(["reading", "read", "want", "abandoned"] as BookStatus[]).map(
            (status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusBtn,
                  {
                    backgroundColor:
                      book.status === status ? colors.volt : colors.secondary,
                    borderColor:
                      book.status === status ? colors.volt : colors.border,
                  },
                ]}
                onPress={() => handleStatusChange(status)}
              >
                <Text
                  style={[
                    styles.statusBtnText,
                    {
                      color:
                        book.status === status
                          ? colors.accentForeground
                          : colors.mutedForeground,
                    },
                  ]}
                >
                  {STATUS_LABELS[status]}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      {/* Sessions History */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Histórico de sessões
        </Text>
        {bookSessions.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
Nenhuma sessão por aqui — capa fechada, conta zerada
          </Text>
        ) : (
          bookSessions
            .slice()
            .reverse()
            .slice(0, 5)
            .map((session) => (
              <View
                key={session.id}
                style={[styles.sessionRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.sessionInfo}>
                  <Text style={[styles.sessionDate, { color: colors.foreground }]}>
                    {formatDate(session.date)}
                  </Text>
                  <Text style={[styles.sessionMeta, { color: colors.mutedForeground }]}>
                    Págs {session.startPage}–{session.endPage} · {formatDuration(session.durationSeconds)}
                  </Text>
                </View>
                <Text style={[styles.sessionPace, { color: colors.accentText }]}>
                  {session.pace >= 100 ? Math.min(999, Math.round(session.pace)) : session.pace.toFixed(1)} pág./min
                </Text>
              </View>
            ))
        )}
      </View>

      {/* Dates */}
      {(book.addedAt || book.finishedAt) && (
        <View style={styles.datesSection}>
          <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
            Adicionado em {formatDate(book.addedAt)}
          </Text>
          {book.finishedAt && (
            <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
              Concluído em {formatDate(book.finishedAt)}
            </Text>
          )}
        </View>
      )}

      {/* Delete */}
      <TouchableOpacity
        style={[styles.deleteBtn, { borderColor: colors.destructive }]}
        onPress={handleDelete}
      >
        <Ionicons name="trash-outline" size={16} color={colors.destructive} />
        <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>
Tirar da estante
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  backBtn: { marginBottom: 16 },
  coverSection: {
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
    marginBottom: 16,
  },
  coverIcon: {
    width: 64,
    height: 88,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  coverImageFull: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  coverInfo: { flex: 1, gap: 6 },
  coverTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  coverAuthor: { fontSize: 14, color: "rgba(255,255,255,0.75)" },
  coverMeta: { flexDirection: "row", gap: 6, marginTop: 4 },
  statusPill: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: { fontSize: 11, color: "#FFFFFF", fontWeight: "700" },
  freePill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  freePillText: { fontSize: 11, fontWeight: "900" },
  progressSection: { marginBottom: 16, gap: 8 },
  progressMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressPages: { fontSize: 14, fontWeight: "600" },
  progressPct: { fontSize: 18, fontWeight: "900" },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  statCard: {
    width: "47%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  statValue: { fontSize: 16, fontWeight: "800" },
  statLabel: { fontSize: 11 },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  primaryActionText: { fontSize: 16, fontWeight: "900" },
  statusSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 12 },
  statusBtns: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusBtn: {
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statusBtnText: { fontSize: 13, fontWeight: "600" },
  section: { marginBottom: 20 },
  emptyText: { fontSize: 14 },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  sessionInfo: { gap: 2 },
  sessionDate: { fontSize: 14, fontWeight: "600" },
  sessionMeta: { fontSize: 12 },
  sessionPace: { fontSize: 14, fontWeight: "800" },
  datesSection: { marginBottom: 20, gap: 4 },
  dateText: { fontSize: 12 },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 8,
  },
  deleteBtnText: { fontSize: 14, fontWeight: "700" },
  errorText: { fontSize: 16, marginTop: 20 },
  freeSection: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  freeSectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  freeSectionTitle: { fontSize: 14, fontWeight: "800" },
  freeReadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    padding: 12,
  },
  freeReadBtnText: { fontSize: 14, fontWeight: "800" },
});
