import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import ReaderSettingsPanel, {
  DEFAULT_READER_SETTINGS,
  type ReaderSettings,
} from "@/components/ReaderSettingsPanel";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import {
  bookFileExists,
  getBookFileUri,
  saveBookFile,
} from "@/services/readerFiles";

// ────────────────────────────────────────────────────────────────────────────────
// Theme palette for the reading area
// ────────────────────────────────────────────────────────────────────────────────
const READER_THEMES = {
  light: { background: "#FFFFFF", text: "#1A1A1A", surface: "#F5F5F5" },
  sepia: { background: "#F4E9D8", text: "#3B2F2F", surface: "#EDE0C8" },
  dark:  { background: "#141414", text: "#E8E8E8", surface: "#1E1E1E" },
};

const BAR_HIDE_DELAY_MS = 3000;
const PROGRESS_KEY_PREFIX = "leio:reader-progress:";

// ────────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────────
function buildEpubHtml(content: string, s: ReaderSettings): string {
  const rc = READER_THEMES[s.theme];
  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: ${rc.background};
    color: ${rc.text};
    font-family: ${s.fontFamily === "serif" ? "Georgia, serif" : "'Helvetica Neue', Arial, sans-serif"};
    font-size: ${s.fontSize}px;
    line-height: ${s.lineHeight};
    text-align: ${s.textAlign};
    padding: 24px 20px 80px;
    -webkit-font-smoothing: antialiased;
  }
  p { margin-bottom: 1em; }
  h1, h2, h3 { margin: 1.2em 0 0.5em; line-height: 1.3; }
  img { max-width: 100%; height: auto; display: block; margin: 1em auto; }
</style>
</head>
<body>${content}</body>
</html>`;
}

function buildProgressHtml(progress: number, s: ReaderSettings): string {
  const rc = READER_THEMES[s.theme];
  const pct = Math.round(progress * 100);
  const placeholderContent = `
    <h2>Arquivo carregando…</h2>
    <p>Progresso salvo: ${pct}%</p>
  `;
  return buildEpubHtml(placeholderContent, s);
}

export default function LeitorArquivoScreen() {
  const uiColors = useColors();
  const insets = useSafeAreaInsets();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const { getBookById, updateBook } = useApp();

  const book = getBookById(bookId ?? "");

  // ── State ──────────────────────────────────────────────────────────────────
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"pdf" | "epub" | null>(null);
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_READER_SETTINGS);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0); // 0–1

  // ── Bars animation ─────────────────────────────────────────────────────────
  const barsVisible = useSharedValue(1);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleBarsHide() {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      barsVisible.value = withTiming(0, { duration: 300 });
    }, BAR_HIDE_DELAY_MS);
  }

  function showBars() {
    barsVisible.value = withTiming(1, { duration: 200 });
    scheduleBarsHide();
  }

  const topBarStyle = useAnimatedStyle(() => ({
    opacity: barsVisible.value,
    transform: [{ translateY: barsVisible.value === 0 ? -60 : 0 }],
  }));
  const bottomBarStyle = useAnimatedStyle(() => ({
    opacity: barsVisible.value,
    transform: [{ translateY: barsVisible.value === 0 ? 60 : 0 }],
  }));

  // ── Load settings & progress from storage ─────────────────────────────────
  useEffect(() => {
    async function init() {
      // Load persisted reader settings
      try {
        const raw = await AsyncStorage.getItem("leio:reader-settings");
        if (raw) setSettings(JSON.parse(raw));
      } catch { /* ignore */ }

      // Load reading progress for this book
      if (bookId) {
        try {
          const rawProg = await AsyncStorage.getItem(`${PROGRESS_KEY_PREFIX}${bookId}`);
          if (rawProg) setProgress(parseFloat(rawProg));
        } catch { /* ignore */ }
      }

      // Check if file already exists
      if (bookId) {
        const existing = await bookFileExists(bookId);
        if (existing) {
          const uri = await getBookFileUri(bookId, existing.type);
          if (uri) {
            setFileUri(uri);
            setFileType(existing.type);
          } else {
            setImportModalVisible(true);
          }
        } else {
          setImportModalVisible(true);
        }
      }
    }
    init();
    scheduleBarsHide();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [bookId]);

  // ── Persist settings on change ────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.setItem("leio:reader-settings", JSON.stringify(settings)).catch(() => {});
  }, [settings]);

  // ── Save progress on change ───────────────────────────────────────────────
  useEffect(() => {
    if (!bookId) return;
    AsyncStorage.setItem(`${PROGRESS_KEY_PREFIX}${bookId}`, String(progress)).catch(() => {});
  }, [progress, bookId]);

  // ── Import file ───────────────────────────────────────────────────────────
  const handleImportFile = useCallback(async () => {
    if (!bookId) return;
    try {
      setImporting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "application/epub+zip"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset) return;

      const mimeType = asset.mimeType ?? "";
      const name = asset.name ?? "";
      const type: "pdf" | "epub" =
        mimeType === "application/epub+zip" || name.toLowerCase().endsWith(".epub")
          ? "epub"
          : "pdf";

      const savedUri = await saveBookFile(asset.uri, bookId, type);
      setFileUri(savedUri);
      setFileType(type);
      setImportModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: unknown) {
      Alert.alert("Erro", "Não foi possível importar o arquivo. Tente novamente.");
    } finally {
      setImporting(false);
    }
  }, [bookId]);

  // ── Sync page on exit ─────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    if (!book || !bookId) {
      router.back();
      return;
    }
    if (progress > 0 && book.totalPages > 0) {
      const approxPage = Math.round(progress * book.totalPages);
      Alert.alert(
        "Atualizar progresso?",
        `Você está aproximadamente na página ${approxPage} de ${book.totalPages}. Deseja atualizar?`,
        [
          {
            text: "Não",
            style: "cancel",
            onPress: () => router.back(),
          },
          {
            text: "Atualizar",
            onPress: () => {
              updateBook(bookId, { currentPage: approxPage });
              router.back();
            },
          },
        ]
      );
    } else {
      router.back();
    }
  }, [book, bookId, progress, updateBook]);

  // ── WebView message handler (progress from JS) ───────────────────────────
  const handleWebViewMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "progress" && typeof msg.value === "number") {
        setProgress(Math.max(0, Math.min(1, msg.value)));
      }
    } catch { /* ignore */ }
  }, []);

  // Injected JS to track scroll progress
  const INJECTED_JS = `
    (function() {
      function reportProgress() {
        var el = document.documentElement;
        var scrollable = el.scrollHeight - el.clientHeight;
        var pct = scrollable > 0 ? el.scrollTop / scrollable : 0;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'progress', value: pct }));
      }
      window.addEventListener('scroll', reportProgress, { passive: true });
      // Restore scroll position if saved
      var saved = ${JSON.stringify(progress)};
      if (saved > 0) {
        window.addEventListener('load', function() {
          setTimeout(function() {
            var el = document.documentElement;
            var scrollable = el.scrollHeight - el.clientHeight;
            el.scrollTop = scrollable * saved;
          }, 300);
        });
      }
    })();
    true;
  `;

  // ── Derived values ────────────────────────────────────────────────────────
  const rc = READER_THEMES[settings.theme];
  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);
  const pct = Math.round(progress * 100);
  const approxPage =
    book && book.totalPages > 0 ? Math.max(1, Math.round(progress * book.totalPages)) : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: rc.background }]}>
      {/* ── Reading area ──────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={{ flex: 1 }}
        activeOpacity={1}
        onPress={showBars}
      >
        {fileUri && fileType ? (
          <WebView
            key={`${fileUri}-${settings.theme}-${settings.fontSize}-${settings.lineHeight}-${settings.fontFamily}-${settings.textAlign}`}
            source={
              fileType === "pdf"
                ? { uri: fileUri }
                : { html: buildEpubHtml("<p>Carregando…</p>", settings) }
            }
            style={{ flex: 1, backgroundColor: rc.background }}
            injectedJavaScript={INJECTED_JS}
            onMessage={handleWebViewMessage}
            onError={() => Alert.alert("Erro", "Não foi possível carregar o arquivo.")}
            allowFileAccess
            allowUniversalAccessFromFileURLs
            originWhitelist={["*"]}
            javaScriptEnabled
            domStorageEnabled
            scalesPageToFit={fileType === "pdf"}
          />
        ) : !importModalVisible ? (
          <View style={[styles.placeholder, { backgroundColor: rc.background }]}>
            <Text style={[styles.placeholderText, { color: rc.text }]}>
              Nenhum arquivo importado.
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.topBar,
          {
            backgroundColor: `${rc.surface}EE`,
            paddingTop: topInset,
            borderBottomColor: rc.background === "#141414" ? "#2A2A2A" : "rgba(0,0,0,0.08)",
          },
          topBarStyle,
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity onPress={handleBack} hitSlop={10} style={styles.barBtn}>
          <Text style={[styles.backIcon, { color: rc.text }]}>←</Text>
        </TouchableOpacity>

        <Text style={[styles.barTitle, { color: rc.text }]} numberOfLines={1}>
          {book?.title ?? "Leitor"}
        </Text>

        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            setSettingsVisible(true);
          }}
          hitSlop={10}
          style={styles.barBtn}
        >
          <Text style={[styles.settingsIcon, { color: rc.text }]}>⚙</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Bottom bar ────────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.bottomBar,
          {
            backgroundColor: `${rc.surface}EE`,
            paddingBottom: bottomInset + 12,
            borderTopColor: rc.background === "#141414" ? "#2A2A2A" : "rgba(0,0,0,0.08)",
          },
          bottomBarStyle,
        ]}
        pointerEvents="box-none"
      >
        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: rc.background === "#141414" ? "#2A2A2A" : "rgba(0,0,0,0.12)" }]}>
          <View
            style={[styles.progressFill, { width: `${pct}%`, backgroundColor: "#CDFF00" }]}
          />
        </View>

        <View style={styles.progressMeta}>
          <Text style={[styles.progressPct, { color: rc.text }]}>{pct}%</Text>
          {approxPage !== null && (
            <Text style={[styles.progressPage, { color: rc.text }]}>
              Pág. ~{approxPage}
              {book?.totalPages ? ` / ${book.totalPages}` : ""}
            </Text>
          )}
        </View>
      </Animated.View>

      {/* ── Settings panel ────────────────────────────────────────────────── */}
      {settingsVisible && (
        <ReaderSettingsPanel
          visible={settingsVisible}
          settings={settings}
          onSettingsChange={setSettings}
          onClose={() => setSettingsVisible(false)}
        />
      )}

      {/* ── Import modal ──────────────────────────────────────────────────── */}
      <Modal
        visible={importModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setImportModalVisible(false);
          router.back();
        }}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: uiColors.card, borderColor: uiColors.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: uiColors.foreground }]}>
              Importar arquivo
            </Text>
            <Text style={[styles.modalBody, { color: uiColors.mutedForeground }]}>
              {book
                ? `Importe um arquivo PDF ou ePub de "${book.title}" para leitura no leitor integrado.`
                : "Importe um arquivo PDF ou ePub para leitura."}
            </Text>

            <TouchableOpacity
              style={[styles.importBtn, { backgroundColor: uiColors.volt }]}
              onPress={handleImportFile}
              disabled={importing}
              activeOpacity={0.85}
            >
              <Text style={[styles.importBtnText, { color: uiColors.accentForeground }]}>
                {importing ? "Importando…" : "Selecionar arquivo (PDF / ePub)"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setImportModalVisible(false);
                router.back();
              }}
            >
              <Text style={[styles.cancelBtnText, { color: uiColors.mutedForeground }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Top bar
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 5,
  },
  barBtn: { padding: 4 },
  barTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  backIcon: { fontSize: 22, fontWeight: "600" },
  settingsIcon: { fontSize: 20 },

  // Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 10,
    paddingHorizontal: 16,
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    zIndex: 5,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressPct: { fontSize: 12, fontWeight: "800" },
  progressPage: { fontSize: 12 },

  // Placeholder
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  placeholderText: { fontSize: 16, textAlign: "center" },

  // Import modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalSheet: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  importBtn: {
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },
  importBtnText: { fontSize: 15, fontWeight: "900" },
  cancelBtn: { alignItems: "center", paddingVertical: 8 },
  cancelBtnText: { fontSize: 14, fontWeight: "600" },
});
