import { CapiMascot } from "@/components/CapiMascot";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function SessaoAtivaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    bookId: string;
    startPage: string;
    ambient: string;
    focusMode: string;
    focusDuration: string;
    modoVagao: string;
  }>();
  const { getBookById, addSession, checkAndUnlockBadges, setCapiState } = useApp();

  const book = getBookById(params.bookId ?? "");
  const startPage = parseInt(params.startPage ?? "0", 10);
  const isFocusMode = params.focusMode === "1";
  const focusDuration = parseInt(params.focusDuration ?? "30", 10);
  const isModoVagao = params.modoVagao === "1";

  const [elapsed, setElapsed] = useState(0);
  const [currentPage, setCurrentPage] = useState(startPage);
  const [isRunning, setIsRunning] = useState(true);
  const [focusExitSeconds, setFocusExitSeconds] = useState(0);
  const [showFocusReturn, setShowFocusReturn] = useState(false);
  const [showPageModal, setShowPageModal] = useState(false);
  const [newPageInput, setNewPageInput] = useState("");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backgroundStartRef = useRef<number | null>(null);
  const focusExitRef = useRef(0);
  const startTimeRef = useRef(Date.now());
  const elapsedRef = useRef(0);

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  useEffect(() => {
    setCapiState("reading");
    startTimer();
    return () => stopTimer();
  }, []);

  useEffect(() => {
    if (!isFocusMode) return;
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background" || nextState === "inactive") {
        backgroundStartRef.current = Date.now();
        stopTimer();
      } else if (nextState === "active") {
        if (backgroundStartRef.current !== null) {
          const outsideSeconds = Math.round(
            (Date.now() - backgroundStartRef.current) / 1000
          );
          focusExitRef.current += outsideSeconds;
          setFocusExitSeconds((prev) => prev + outsideSeconds);
          backgroundStartRef.current = null;

          if (outsideSeconds > 5) {
            setCapiState("sad");
            setShowFocusReturn(true);
          } else {
            startTimer();
          }
        }
      }
    });
    return () => sub.remove();
  }, [isFocusMode]);

  function startTimer() {
    setIsRunning(true);
    startTimeRef.current = Date.now() - elapsedRef.current * 1000;
    intervalRef.current = setInterval(() => {
      const nowElapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      elapsedRef.current = nowElapsed;
      setElapsed(nowElapsed);
    }, 1000);
  }

  function stopTimer() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }

  function togglePause() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isRunning) {
      stopTimer();
    } else {
      startTimer();
    }
  }

  function resumeAfterFocus() {
    setShowFocusReturn(false);
    setCapiState("reading");
    startTimer();
  }

  function endSession() {
    stopTimer();
    const pages = currentPage - startPage;
    const pace = elapsed > 0 && pages > 0 ? pages / (elapsed / 60) : 0;

    const session = {
      bookId: params.bookId ?? "",
      startPage,
      endPage: currentPage,
      durationSeconds: elapsed,
      pace: Math.round(pace * 10) / 10,
      date: new Date().toISOString(),
      isFocusMode,
      focusExitSeconds: focusExitRef.current,
      isModoVagao,
    };

    addSession(session);
    checkAndUnlockBadges(session as never);

    if (isFocusMode && focusExitRef.current === 0) {
      setCapiState("celebrating");
    }

    router.replace({
      pathname: "/conclusao",
      params: {
        bookId: params.bookId,
        startPage: startPage.toString(),
        endPage: currentPage.toString(),
        durationSeconds: elapsed.toString(),
        pace: pace.toFixed(1),
        focusMode: isFocusMode ? "1" : "0",
        focusExitSeconds: focusExitRef.current.toString(),
      },
    });
  }

  function handleEndPress() {
    if (currentPage <= startPage) {
      Alert.alert(
        "Encerrar sessão",
        "Você não atualizou a página. Quer encerrar mesmo assim?",
        [
          { text: "Continuar lendo", style: "cancel" },
          { text: "Encerrar", onPress: endSession, style: "destructive" },
        ]
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    endSession();
  }

  function updatePage() {
    const page = parseInt(newPageInput, 10);
    if (!isNaN(page) && page > startPage && page <= (book?.totalPages ?? 9999)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCurrentPage(page);
    }
    setShowPageModal(false);
    setNewPageInput("");
  }

  const pages = currentPage - startPage;
  const pace = elapsed > 60 && pages > 0 ? pages / (elapsed / 60) : 0;
  const totalMinutes = focusDuration * 60;
  const focusProgress = isFocusMode
    ? Math.min(1, elapsed / totalMinutes)
    : 0;

  if (!book) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={[styles.errorText, { color: colors.foreground }]}>
          Livro não encontrado
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: colors.volt }]}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: topInset,
          paddingBottom: bottomInset,
        },
      ]}
    >
      {/* Focus Return Modal */}
      <Modal visible={showFocusReturn} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.focusModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <CapiMascot state="sad" size={100} />
            <Text style={[styles.focusModalTitle, { color: colors.foreground }]}>
              Capi ficou te esperando...
            </Text>
            <Text style={[styles.focusModalTime, { color: colors.mutedForeground }]}>
              {Math.floor(focusExitSeconds / 60)}min {focusExitSeconds % 60}s fora do app
            </Text>
            <TouchableOpacity
              style={[styles.focusBtn, { backgroundColor: colors.volt }]}
              onPress={resumeAfterFocus}
            >
              <Text style={[styles.focusBtnText, { color: colors.accentForeground }]}>
                Voltar pra leitura
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.focusBtnOutline, { borderColor: colors.border }]}
              onPress={handleEndPress}
            >
              <Text style={[styles.focusBtnOutlineText, { color: colors.mutedForeground }]}>
                Encerrar sessão
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Page Update Modal */}
      <Modal visible={showPageModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.pageModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.pageModalTitle, { color: colors.foreground }]}>
              Atualizar página
            </Text>
            <TextInput
              style={[
                styles.pageModalInput,
                { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
              ]}
              value={newPageInput}
              onChangeText={setNewPageInput}
              keyboardType="numeric"
              placeholder={`Pág. atual: ${currentPage}`}
              placeholderTextColor={colors.mutedForeground}
              autoFocus
            />
            <Text style={[styles.pageModalSub, { color: colors.mutedForeground }]}>
              Total: {book.totalPages} páginas
            </Text>
            <View style={styles.pageModalBtns}>
              <TouchableOpacity
                style={[styles.pageModalCancelBtn, { borderColor: colors.border }]}
                onPress={() => { setShowPageModal(false); setNewPageInput(""); }}
              >
                <Text style={[styles.pageModalCancelText, { color: colors.mutedForeground }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pageModalConfirmBtn, { backgroundColor: colors.volt }]}
                onPress={updatePage}
              >
                <Text style={[styles.pageModalConfirmText, { color: colors.accentForeground }]}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Book Info */}
      <View style={styles.bookInfo}>
        <View style={[styles.coverDot, { backgroundColor: book.coverColor }]} />
        <View style={styles.bookText}>
          <Text style={[styles.bookTitle, { color: colors.foreground }]} numberOfLines={1}>
            {book.title}
          </Text>
          <Text style={[styles.bookAuthor, { color: colors.mutedForeground }]}>
            {book.author}
          </Text>
        </View>
        {isFocusMode && (
          <View style={[styles.focusBadge, { backgroundColor: `${colors.volt}22` }]}>
            <Ionicons name="eye" size={12} color={colors.volt} />
            <Text style={[styles.focusBadgeText, { color: colors.volt }]}>Foco</Text>
          </View>
        )}
        {isModoVagao && (
          <View style={[styles.focusBadge, { backgroundColor: `${colors.coral}22` }]}>
            <Ionicons name="train" size={12} color={colors.coral} />
            <Text style={[styles.focusBadgeText, { color: colors.coral }]}>Vagão</Text>
          </View>
        )}
      </View>

      {/* Timer */}
      <View style={styles.timerSection}>
        <Text style={[styles.timer, { color: colors.foreground }]}>
          {formatTime(elapsed)}
        </Text>
        {isFocusMode && (
          <View style={[styles.focusProgress, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.focusProgressFill,
                {
                  backgroundColor: colors.volt,
                  width: `${focusProgress * 100}%`,
                },
              ]}
            />
          </View>
        )}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: colors.volt }]}>
              {pages}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              páginas
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: colors.volt }]}>
              {pace > 0 ? pace.toFixed(1) : "—"}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              págs/min
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: colors.volt }]}>
              {currentPage}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              pág. atual
            </Text>
          </View>
        </View>
      </View>

      {/* Capi */}
      <View style={styles.capiWrap}>
        <CapiMascot state="reading" size={isModoVagao ? 64 : 80} />
      </View>

      {/* Modo Vagão Controls */}
      {isModoVagao ? (
        <View style={styles.vagaoControls}>
          <TouchableOpacity
            style={[styles.vagaoBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCurrentPage((p) => Math.max(startPage, p - 1));
            }}
          >
            <Ionicons name="remove" size={36} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.vagaoPage}>
            <Text style={[styles.vagaoPageNum, { color: colors.foreground }]}>
              {currentPage}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.vagaoBtn, { backgroundColor: colors.volt }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCurrentPage((p) => Math.min(book.totalPages, p + 1));
            }}
          >
            <Ionicons name="add" size={36} color={colors.accentForeground} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.updatePageBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          onPress={() => {
            Haptics.selectionAsync();
            setShowPageModal(true);
          }}
        >
          <Ionicons name="pencil-outline" size={18} color={colors.foreground} />
          <Text style={[styles.updatePageText, { color: colors.foreground }]}>
            Atualizar página
          </Text>
        </TouchableOpacity>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.pauseBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          onPress={togglePause}
        >
          <Ionicons
            name={isRunning ? "pause" : "play"}
            size={24}
            color={colors.foreground}
          />
        </TouchableOpacity>

        {isModoVagao && (
          <TouchableOpacity
            style={[styles.chegouBtn, { backgroundColor: colors.coral }]}
            onPress={handleEndPress}
          >
            <Text style={[styles.chegouText, { color: "#FFFFFF" }]}>Cheguei</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.endBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          onPress={handleEndPress}
        >
          <Ionicons name="stop" size={24} color={colors.foreground} />
          {!isModoVagao && (
            <Text style={[styles.endBtnText, { color: colors.foreground }]}>
              Encerrar
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bookInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  coverDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  bookText: { flex: 1 },
  bookTitle: { fontSize: 15, fontWeight: "700" },
  bookAuthor: { fontSize: 12 },
  focusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  focusBadgeText: { fontSize: 11, fontWeight: "700" },
  timerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 20,
  },
  timer: {
    fontSize: 64,
    fontWeight: "900",
    letterSpacing: -3,
    fontVariant: ["tabular-nums"],
  },
  focusProgress: {
    width: "80%",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  focusProgressFill: { height: "100%", borderRadius: 3 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  statItem: { alignItems: "center", gap: 2 },
  statVal: { fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  statLabel: { fontSize: 11 },
  statDivider: { width: 1, height: 32, backgroundColor: "#2A2A2A" },
  capiWrap: { alignItems: "center", paddingVertical: 16 },
  vagaoControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  vagaoBtn: {
    width: 80,
    height: 80,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  vagaoPage: { alignItems: "center" },
  vagaoPageNum: { fontSize: 40, fontWeight: "900", letterSpacing: -1 },
  updatePageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 20,
    padding: 14,
    marginBottom: 12,
  },
  updatePageText: { fontSize: 15, fontWeight: "600" },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  pauseBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chegouBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  chegouText: { fontSize: 18, fontWeight: "900" },
  endBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  endBtnText: { fontSize: 15, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  focusModal: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 14,
    width: "100%",
  },
  focusModalTitle: { fontSize: 20, fontWeight: "900", textAlign: "center" },
  focusModalTime: { fontSize: 14, textAlign: "center" },
  focusBtn: {
    width: "100%",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  focusBtnText: { fontSize: 16, fontWeight: "900" },
  focusBtnOutline: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
  },
  focusBtnOutlineText: { fontSize: 15, fontWeight: "600" },
  pageModal: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    width: "100%",
    gap: 12,
  },
  pageModalTitle: { fontSize: 18, fontWeight: "800" },
  pageModalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  pageModalSub: { fontSize: 12, textAlign: "center" },
  pageModalBtns: { flexDirection: "row", gap: 10, marginTop: 4 },
  pageModalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  pageModalCancelText: { fontSize: 15, fontWeight: "600" },
  pageModalConfirmBtn: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  pageModalConfirmText: { fontSize: 15, fontWeight: "800" },
  errorText: { fontSize: 16, marginBottom: 12 },
  backLink: { fontSize: 15, fontWeight: "700" },
});
