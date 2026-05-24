import { CapiMascot } from "@/components/CapiMascot";
import { VocabularyModal } from "@/components/VocabularyModal";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import {
  startAmbient,
  pauseAmbient,
  resumeAmbient,
  stopAmbient,
  type AmbientId,
} from "@/services/ambientAudio";
import { sendFocusBreakNotification } from "@/services/notifications";
import { deriveGradient } from "@/services/spotify";
import { formatPace } from "@/utils/formatPace";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  AppState,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

const BG_DIA = require("@/assets/images/bg-sessao-dia.png");
const BG_NOITE = require("@/assets/images/bg-sessao-noite.png");

function isNightTime(date = new Date()): boolean {
  const h = date.getHours();
  return h < 6 || h >= 18;
}

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
  }>();
  const {
    getBookById,
    addSession,
    checkAndUnlockBadges,
    setCapiState,
    nowPlaying,
    spotifyConnected,
    setReadingSessionActive,
  } = useApp();

  const book = getBookById(params.bookId ?? "");
  const startPage = parseInt(params.startPage ?? "0", 10);
  const isFocusMode = params.focusMode === "1";
  const focusDuration = parseInt(params.focusDuration ?? "30", 10);

  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [focusExitSeconds, setFocusExitSeconds] = useState(0);
  const [showFocusReturn, setShowFocusReturn] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [endPageInput, setEndPageInput] = useState("");
  const [endError, setEndError] = useState("");
  const [showVocabModal, setShowVocabModal] = useState(false);
  const wasRunningBeforeVocabRef = useRef(false);
  const wasRunningBeforeEndRef = useRef(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backgroundStartRef = useRef<number | null>(null);
  const focusExitRef = useRef(0);
  const startTimeRef = useRef(Date.now());
  const elapsedRef = useRef(0);
  const lastMilestoneRef = useRef(0);

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  // Gradient animation - reactive to nowPlaying
  const gradientProgress = useSharedValue(0);
  const [gradient, setGradient] = useState<[string, string]>([
    colors.background,
    colors.card,
  ]);

  useEffect(() => {
    setCapiState("reading");
    setReadingSessionActive(true);
    startTimer();
    const ambientId = (params.ambient ?? "none") as AmbientId;
    let cancelled = false;

    startAmbient(ambientId)
      .then(() => {
        // If the component unmounted before startAmbient finished, kill the zombie sound
        if (cancelled) {
          stopAmbient().catch((err) =>
            console.error("[sessao-ativa] stopAmbient (late start) error:", err)
          );
        }
      })
      .catch((err) => console.error("[sessao-ativa] startAmbient error:", err));

    return () => {
      cancelled = true;
      stopTimer();
      setReadingSessionActive(false);
      stopAmbient().catch((err) =>
        console.error("[sessao-ativa] stopAmbient cleanup error:", err)
      );
    };
  }, []);

  // Update gradient when nowPlaying changes
  useEffect(() => {
    if (nowPlaying) {
      const next = deriveGradient(nowPlaying.energy, nowPlaying.valence);
      setGradient(next);
      gradientProgress.value = 0;
      gradientProgress.value = withTiming(1, { duration: 1200 });
    } else {
      setGradient([colors.background, colors.card]);
      gradientProgress.value = withTiming(1, { duration: 800 });
    }
  }, [nowPlaying?.trackId]);

  const gradientAnimStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + gradientProgress.value * 0.5,
  }));

  // Milestones - small Capi reactions every 10 min
  useEffect(() => {
    const milestone = Math.floor(elapsed / 600);
    if (milestone > lastMilestoneRef.current && milestone > 0) {
      lastMilestoneRef.current = milestone;
      setCapiState("motivating");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined
      );
      setTimeout(() => setCapiState("reading"), 1800);
    }
  }, [elapsed]);

  useEffect(() => {
    if (!isFocusMode) return;
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background" || nextState === "inactive") {
        backgroundStartRef.current = Date.now();
        stopTimer();
        // Trigger notification: Capi calling you back
        sendFocusBreakNotification().catch(() => undefined);
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

  async function togglePause() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    if (isRunning) {
      stopTimer();
      await pauseAmbient().catch((err) =>
        console.error("[sessao-ativa] pauseAmbient error:", err)
      );
    } else {
      startTimer();
      await resumeAmbient().catch((err) =>
        console.error("[sessao-ativa] resumeAmbient error:", err)
      );
    }
  }

  function resumeAfterFocus() {
    setShowFocusReturn(false);
    setCapiState("reading");
    startTimer();
  }

  async function openEndModal() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    wasRunningBeforeEndRef.current = isRunning;
    stopTimer();
    await pauseAmbient().catch((err) =>
      console.error("[sessao-ativa] pauseAmbient error:", err)
    );
    setEndPageInput("");
    setEndError("");
    setShowEndModal(true);
  }

  function confirmEnd(useStartPage: boolean) {
    let endPage = startPage;
    if (!useStartPage) {
      const parsed = parseInt(endPageInput, 10);
      if (isNaN(parsed)) {
        setEndError("Bota um número aí — sem fingir que leu.");
        return;
      }
      if (parsed < startPage) {
        setEndError(`Não pode ser menor que ${startPage}.`);
        return;
      }
      if (book && parsed > book.totalPages) {
        setEndError(`O livro só tem ${book.totalPages} páginas.`);
        return;
      }
      endPage = parsed;
    }

    const pages = endPage - startPage;
    const pace = elapsed > 0 && pages > 0 ? pages / (elapsed / 60) : 0;

    const session = {
      bookId: params.bookId ?? "",
      startPage,
      endPage,
      durationSeconds: elapsed,
      pace: Math.round(pace * 10) / 10,
      date: new Date().toISOString(),
      isFocusMode,
      focusExitSeconds: focusExitRef.current,
    };

    addSession(session);
    checkAndUnlockBadges(session as never);
    setReadingSessionActive(false);

    if (isFocusMode && focusExitRef.current === 0) {
      setCapiState("celebrating");
    }

    setShowEndModal(false);

    router.replace({
      pathname: "/conclusao",
      params: {
        bookId: params.bookId,
        startPage: startPage.toString(),
        endPage: endPage.toString(),
        durationSeconds: elapsed.toString(),
        pace: pace.toFixed(1),
        focusMode: isFocusMode ? "1" : "0",
        focusExitSeconds: focusExitRef.current.toString(),
      },
    });
  }

  async function cancelEndModal() {
    setShowEndModal(false);
    if (wasRunningBeforeEndRef.current) {
      startTimer();
      await resumeAmbient().catch((err) =>
        console.error("[sessao-ativa] resumeAmbient error:", err)
      );
    }
  }

  async function openVocabModal() {
    Haptics.selectionAsync().catch(() => undefined);
    wasRunningBeforeVocabRef.current = isRunning;
    if (isRunning) {
      stopTimer();
      await pauseAmbient().catch((err) =>
        console.error("[sessao-ativa] pauseAmbient error:", err)
      );
    }
    setShowVocabModal(true);
  }

  async function closeVocabModal() {
    setShowVocabModal(false);
    // Don't auto-resume if another blocking modal is up
    if (wasRunningBeforeVocabRef.current && !showFocusReturn && !showEndModal) {
      startTimer();
      await resumeAmbient().catch((err) =>
        console.error("[sessao-ativa] resumeAmbient error:", err)
      );
    }
  }

  if (!book) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text style={[styles.errorText, { color: colors.foreground }]}>
          Livro não encontrado
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: colors.accentText }]}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalMinutes = focusDuration * 60;
  const focusProgress = isFocusMode ? Math.min(1, elapsed / totalMinutes) : 0;

  const night = isNightTime();
  const overlayColor = night ? "rgba(10,8,6,0.68)" : "rgba(10,8,6,0.52)";

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      {/* Ambient artwork — Capi reading (day/night based on time) */}
      <ImageBackground
        source={night ? BG_NOITE : BG_DIA}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: overlayColor }]} />
      </ImageBackground>

      {/* Reactive Spotify gradient tint (lower opacity so artwork shows) */}
      <AnimatedGradient
        colors={gradient}
        style={[StyleSheet.absoluteFillObject, gradientAnimStyle, { opacity: 0.25 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View
        style={[
          styles.inner,
          {
            paddingTop: topInset,
            paddingBottom: bottomInset,
          },
        ]}
      >
        {/* Focus Return Modal */}
        <Modal visible={showFocusReturn} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.focusModal,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <CapiMascot state="sad" size={100} />
              <Text
                style={[styles.focusModalTitle, { color: colors.foreground }]}
              >
                Capi ficou esperando feito Bentinho na janela...
              </Text>
              <Text
                style={[
                  styles.focusModalTime,
                  { color: colors.mutedForeground },
                ]}
              >
                {Math.floor(focusExitSeconds / 60)}min {focusExitSeconds % 60}s
                fora do app
              </Text>
              <TouchableOpacity
                style={[styles.focusBtn, { backgroundColor: colors.volt }]}
                onPress={resumeAfterFocus}
              >
                <Text
                  style={[
                    styles.focusBtnText,
                    { color: colors.accentForeground },
                  ]}
                >
                  Voltar pro livro
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.focusBtnOutline, { borderColor: colors.border }]}
                onPress={openEndModal}
              >
                <Text
                  style={[
                    styles.focusBtnOutlineText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Encerrar sessão
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* End Session Modal */}
        <Modal
          visible={showEndModal}
          transparent
          animationType="slide"
          onRequestClose={cancelEndModal}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
          >
            <ScrollView
              contentContainerStyle={styles.endModalScroll}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              <View
                style={[
                  styles.endModal,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.endModalTitle, { color: colors.foreground }]}
                >
                  Em que página o capítulo te soltou?
                </Text>
                <Text
                  style={[
                    styles.endModalSub,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Começou na {startPage} · livro tem {book.totalPages}
                </Text>
                <TextInput
                  style={[
                    styles.endModalInput,
                    {
                      color: colors.foreground,
                      borderColor: endError ? colors.coral : colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                  value={endPageInput}
                  onChangeText={(v) => {
                    setEndPageInput(v);
                    if (endError) setEndError("");
                  }}
                  keyboardType="numeric"
                  placeholder={String(startPage)}
                  placeholderTextColor={colors.mutedForeground}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={() => confirmEnd(false)}
                />
                {!!endError && (
                  <Text style={[styles.endModalError, { color: colors.coral }]}>
                    {endError}
                  </Text>
                )}
                <TouchableOpacity
                  style={[
                    styles.endModalConfirm,
                    { backgroundColor: colors.volt },
                  ]}
                  onPress={() => confirmEnd(false)}
                >
                  <Text
                    style={[
                      styles.endModalConfirmText,
                      { color: colors.accentForeground },
                    ]}
                  >
                    Salvar e encerrar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.endModalSecondary}
                  onPress={() => confirmEnd(true)}
                >
                  <Text
                    style={[
                      styles.endModalSecondaryText,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Não lembro · manter na {startPage}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.endModalCancel}
                  onPress={cancelEndModal}
                >
                  <Text
                    style={[
                      styles.endModalCancelText,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Cancelar · continuar lendo
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>

        {/* Book Info */}
        <View style={styles.bookInfo}>
          <View
            style={[styles.coverDot, { backgroundColor: book.coverColor }]}
          />
          <View style={styles.bookText}>
            <Text
              style={[styles.bookTitle, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {book.title}
            </Text>
            <Text
              style={[styles.bookAuthor, { color: colors.mutedForeground }]}
            >
              {book.author}
            </Text>
          </View>
          {isFocusMode && (
            <View
              style={[
                styles.focusBadge,
                { backgroundColor: `${colors.volt}22` },
              ]}
            >
              <Ionicons name="eye" size={12} color={colors.accentText} />
              <Text style={[styles.focusBadgeText, { color: colors.accentText }]}>
                Foco
              </Text>
            </View>
          )}
        </View>

        {/* Timer */}
        <View style={styles.timerSection}>
          <Text style={[styles.startPageHint, { color: colors.mutedForeground }]}>
            começou na pág. {startPage}
          </Text>
          <Text style={[styles.timer, { color: colors.foreground }]}>
            {formatTime(elapsed)}
          </Text>
          {isFocusMode && (
            <View
              style={[styles.focusProgress, { backgroundColor: colors.border }]}
            >
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
        </View>

        {/* Capi - reading along */}
        <View style={styles.capiWrap}>
          <CapiMascot state="reading" size={120} />
        </View>

        {/* Now Playing - Spotify */}
        {spotifyConnected && nowPlaying ? (
          <View
            style={[
              styles.nowPlaying,
              { backgroundColor: "rgba(0,0,0,0.4)" },
            ]}
          >
            <Ionicons name="musical-notes" size={14} color={colors.volt} />
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.npTrack, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {nowPlaying.track}
              </Text>
              <Text
                style={[styles.npArtist, { color: colors.mutedForeground }]}
                numberOfLines={1}
              >
                {nowPlaying.artist}
              </Text>
            </View>
          </View>
        ) : (
          <View style={{ height: 48 }} />
        )}

        {/* Controls - pause, vocab, and end */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[
              styles.pauseBtn,
              {
                backgroundColor: colors.secondary,
                borderColor: colors.border,
              },
            ]}
            onPress={togglePause}
          >
            <Ionicons
              name={isRunning ? "pause" : "play"}
              size={28}
              color={colors.foreground}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.vocabBtn,
              {
                backgroundColor: `${colors.volt}22`,
                borderColor: colors.accentBorder,
              },
            ]}
            onPress={openVocabModal}
            accessibilityLabel="Anotar palavra no vocabulário"
          >
            <Ionicons
              name="language"
              size={26}
              color={colors.accentText}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.endBtn, { backgroundColor: colors.coral }]}
            onPress={openEndModal}
          >
            <Ionicons name="stop" size={22} color="#FFFFFF" />
            <Text style={[styles.endBtnText, { color: "#FFFFFF" }]}>
              Encerrar
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <VocabularyModal
        visible={showVocabModal}
        bookId={params.bookId ?? ""}
        onClose={closeVocabModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1 },
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
    gap: 12,
    paddingHorizontal: 20,
  },
  startPageHint: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "700",
  },
  timer: {
    fontSize: 84,
    fontWeight: "900",
    letterSpacing: -4,
    fontVariant: ["tabular-nums"],
  },
  focusProgress: {
    width: "70%",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  focusProgressFill: { height: "100%", borderRadius: 3 },
  capiWrap: { alignItems: "center", paddingVertical: 8 },
  nowPlaying: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  npTrack: { fontSize: 13, fontWeight: "700" },
  npArtist: { fontSize: 11, marginTop: 1 },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  pauseBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  vocabBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  endBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 64,
    borderRadius: 18,
  },
  endBtnText: { fontSize: 17, fontWeight: "900" },
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
  endModalScroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  endModal: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    width: "100%",
    gap: 12,
  },
  endModalTitle: { fontSize: 20, fontWeight: "900" },
  endModalSub: { fontSize: 13, marginTop: -4 },
  endModalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 4,
  },
  endModalError: { fontSize: 12, marginTop: -4 },
  endModalConfirm: {
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 4,
  },
  endModalConfirmText: { fontSize: 16, fontWeight: "900" },
  endModalSecondary: {
    padding: 10,
    alignItems: "center",
  },
  endModalSecondaryText: { fontSize: 13, fontWeight: "600" },
  endModalCancel: {
    padding: 10,
    alignItems: "center",
  },
  endModalCancelText: { fontSize: 13 },
  errorText: { fontSize: 16, marginBottom: 12 },
  backLink: { fontSize: 15, fontWeight: "700" },
});
