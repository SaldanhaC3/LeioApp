import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  PanResponder,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ViewShot, { type ViewShotRef } from "react-native-view-shot";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";

import ReaderSettingsPanel, {
  DEFAULT_READER_SETTINGS,
  type ReaderSettings,
} from "@/components/ReaderSettingsPanel";
import { TrechoShareCard } from "@/components/TrechoShareCard";
import { useApp, type Highlight } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import {
  bookFileExists,
  getBookFileUri,
  saveBookFile,
} from "@/services/readerFiles";

const READER_THEMES = {
  light: { background: "#FFFFFF", text: "#1A1A1A", surface: "#F5F5F5" },
  sepia: { background: "#F4E9D8", text: "#3B2F2F", surface: "#EDE0C8" },
  dark: { background: "#141414", text: "#E8E8E8", surface: "#1E1E1E" },
};

const HIGHLIGHT_BG_COLORS: Record<Highlight["bgVariant"], string> = {
  volt: "rgba(205,255,0,0.38)",
  cream: "rgba(255,220,160,0.5)",
  coral: "rgba(255,107,91,0.35)",
  noir: "rgba(100,100,255,0.25)",
};

const BAR_HIDE_DELAY_MS = 3000;
const PROGRESS_KEY_PREFIX = "leio:reader-progress:";

function buildEpubHtml(
  fileUri: string,
  s: ReaderSettings,
  savedProgress: number,
  highlights: { text: string; color: string; cfi?: string }[]
): string {
  const rc = READER_THEMES[s.theme];
  const fontFamily =
    s.fontFamily === "serif"
      ? "Georgia, 'Times New Roman', serif"
      : "'Helvetica Neue', Arial, sans-serif";
  const hlJson = JSON.stringify(highlights);

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body { height: 100%; overflow: hidden; background: ${rc.background}; }
  #viewer { position: absolute; inset: 0; }
  #msg { color: ${rc.text}; font-family: sans-serif; padding: 24px; line-height: 1.6; font-size: 15px; }
  ::selection { background: rgba(205,255,0,0.4); }
</style>
</head>
<body>
  <div id="viewer"></div>
  <script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.js"></script>
  <script>
  (function() {
    var EPUB_URI = ${JSON.stringify(fileUri)};
    var SAVED = ${JSON.stringify(savedProgress)};
    var HIGHLIGHTS = ${hlJson};
    var selTimer = null;

    function postMsg(obj) {
      try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(obj)); } catch(e) {}
    }

    if (typeof ePub === 'undefined') {
      document.getElementById('viewer').innerHTML = '<div id="msg">Conexão necessária para carregar o leitor ePub pela primeira vez. Abra com internet e o leitor ficará disponível.</div>';
      postMsg({ type: 'error', message: 'epubjs not loaded' });
      return;
    }

    try {
      var book = ePub(EPUB_URI);
      var rendition = book.renderTo('viewer', {
        width: window.innerWidth,
        height: window.innerHeight,
        spread: 'none',
        flow: 'paginated',
        allowScriptedContent: false
      });

      rendition.hooks.content.register(function(contents) {
        var doc = contents.document;
        var style = doc.createElement('style');
        style.textContent =
          'body { font-size: ${s.fontSize}px; font-family: ' + ${JSON.stringify(fontFamily)} + '; line-height: ${s.lineHeight}; text-align: ${s.textAlign}; color: ${rc.text}; background: ${rc.background}; padding: 12px 4px; -webkit-user-select: text; user-select: text; }' +
          'p { margin-bottom: 0.75em; }' +
          'h1,h2,h3 { margin: 1em 0 0.4em; line-height: 1.3; }' +
          '::selection { background: rgba(205,255,0,0.4); }';
        doc.head.appendChild(style);

        HIGHLIGHTS.forEach(function(h) {
          if (h.cfi) return;
          if (!h.text || h.text.length < 3) return;
          try {
            var walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null, false);
            var node;
            while ((node = walker.nextNode())) {
              var val = node.nodeValue || '';
              var idx = val.indexOf(h.text);
              if (idx >= 0 && node.parentNode) {
                var range = doc.createRange();
                range.setStart(node, idx);
                range.setEnd(node, idx + h.text.length);
                var mark = doc.createElement('mark');
                mark.style.cssText = 'background:' + h.color + ';border-radius:2px;padding:0 1px;';
                try { range.surroundContents(mark); } catch(e2) {}
                break;
              }
            }
          } catch(e) {}
        });

        doc.addEventListener('selectionchange', function() {
          clearTimeout(selTimer);
          var sel = contents.window.getSelection();
          var txt = sel ? sel.toString().trim() : '';
          if (txt.length > 2) {
            selTimer = setTimeout(function() {
              var cfi = null;
              try {
                if (sel.rangeCount > 0) {
                  var range = sel.getRangeAt(0);
                  cfi = contents.cfiFromRange(range);
                }
              } catch(e) {}
              postMsg({ type: 'selection', text: txt, cfi: cfi });
            }, 500);
          } else {
            postMsg({ type: 'selectionCleared' });
          }
        });
      });

      book.ready.then(function() {
        return book.locations.generate(1024);
      }).then(function() {
        HIGHLIGHTS.forEach(function(h, i) {
          if (!h.cfi) return;
          try {
            rendition.annotations.highlight(
              h.cfi, {}, null, 'hl-cfi-' + i,
              { fill: h.color, 'fill-opacity': '0.55' }
            );
          } catch(e) {}
        });
        if (SAVED > 0.005) {
          try {
            var cfi = book.locations.cfiFromPercentage(SAVED);
            return rendition.display(cfi);
          } catch(e) {}
        }
        return rendition.display();
      }).catch(function() { rendition.display(); });

      rendition.on('relocated', function(loc) {
        try {
          var pct = book.locations.percentageFromCfi(loc.start.cfi);
          postMsg({ type: 'progress', value: typeof pct === 'number' ? pct : 0, current: loc.start.displayed.page, total: loc.start.displayed.total });
        } catch(e) {}
      });

      rendition.on('displayError', function(err) {
        document.getElementById('viewer').innerHTML = '<div id="msg">Erro ao abrir o ePub. Certifique-se de que o arquivo está íntegro.</div>';
        postMsg({ type: 'error', message: String(err) });
      });

    } catch(e) {
      document.getElementById('viewer').innerHTML = '<div id="msg">Erro ao inicializar o leitor: ' + String(e) + '</div>';
      postMsg({ type: 'error', message: String(e) });
    }
  })();
  </script>
</body>
</html>`;
}

export default function LeitorArquivoScreen() {
  const uiColors = useColors();
  const insets = useSafeAreaInsets();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const { getBookById, updateBook, addHighlight, getHighlightsForBook } = useApp();

  const book = getBookById(bookId ?? "");

  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"pdf" | "epub" | null>(null);
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_READER_SETTINGS);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedText, setSelectedText] = useState("");
  const [selectedCfi, setSelectedCfi] = useState<string | null>(null);
  const [pendingReaderShare, setPendingReaderShare] = useState<Highlight | null>(null);
  const readerShareCardRef = useRef<ViewShotRef>(null);

  const barsVisible = useSharedValue(1);
  const selBarAnim = useSharedValue(0);
  const toastAnim = useSharedValue(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const selBarStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - selBarAnim.value) * 90 }],
    opacity: selBarAnim.value,
  }));
  const toastStyle = useAnimatedStyle(() => ({
    opacity: toastAnim.value,
    transform: [{ translateY: (1 - toastAnim.value) * 16 }],
  }));

  useEffect(() => {
    async function init() {
      try {
        const raw = await AsyncStorage.getItem("leio:reader-settings");
        if (raw) setSettings(JSON.parse(raw));
      } catch { /* ignore */ }

      if (bookId) {
        try {
          const rawProg = await AsyncStorage.getItem(`${PROGRESS_KEY_PREFIX}${bookId}`);
          if (rawProg) setProgress(parseFloat(rawProg));
        } catch { /* ignore */ }
      }

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
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [bookId]);

  useEffect(() => {
    AsyncStorage.setItem("leio:reader-settings", JSON.stringify(settings)).catch(() => {});
  }, [settings]);

  useEffect(() => {
    if (!bookId) return;
    AsyncStorage.setItem(`${PROGRESS_KEY_PREFIX}${bookId}`, String(progress)).catch(() => {});
  }, [progress, bookId]);

  function openSelBar(text: string, cfi?: string | null) {
    setSelectedText(text);
    setSelectedCfi(cfi ?? null);
    selBarAnim.value = withTiming(1, { duration: 220 });
  }

  function closeSelBar() {
    setSelectedText("");
    setSelectedCfi(null);
    selBarAnim.value = withTiming(0, { duration: 180 });
  }

  function flashToast() {
    toastAnim.value = withTiming(1, { duration: 200 });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      toastAnim.value = withTiming(0, { duration: 300 });
    }, 2200);
  }

  const handleSaveExcerpt = useCallback(() => {
    if (!selectedText || !bookId) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addHighlight({ bookId, text: selectedText, bgVariant: "volt", cfi: selectedCfi ?? undefined });
    closeSelBar();
    flashToast();
  }, [selectedText, bookId, addHighlight, selectedCfi]);

  const handleCopyExcerpt = useCallback(async () => {
    if (!selectedText) return;
    Haptics.selectionAsync();
    await Clipboard.setStringAsync(selectedText);
    closeSelBar();
  }, [selectedText]);

  const handleTranslateExcerpt = useCallback(() => {
    if (!selectedText) return;
    Haptics.selectionAsync();
    const encoded = encodeURIComponent(selectedText.slice(0, 500));
    Linking.openURL(
      `https://translate.google.com/?sl=auto&tl=pt&text=${encoded}&op=translate`
    ).catch(() => {});
    closeSelBar();
  }, [selectedText]);

  const handleShareExcerpt = useCallback(() => {
    if (!selectedText) return;
    Haptics.selectionAsync();
    if (!book) {
      Share.share({ message: `"${selectedText}"` }).catch(() => {});
      closeSelBar();
      return;
    }
    const tempHighlight: Highlight = {
      id: "reader-share-temp",
      bookId: book.id,
      text: selectedText,
      bgVariant: "volt",
      createdAt: new Date().toISOString(),
      cfi: selectedCfi ?? undefined,
    };
    setPendingReaderShare(tempHighlight);
    closeSelBar();
  }, [selectedText, book, selectedCfi]);

  useEffect(() => {
    if (!pendingReaderShare || !book) return;
    const timer = setTimeout(async () => {
      try {
        const uri = await readerShareCardRef.current?.capture?.();
        if (uri) {
          const canShare = await Sharing.isAvailableAsync();
          if (canShare) {
            await Sharing.shareAsync(uri, {
              mimeType: "image/png",
              dialogTitle: "Compartilhar trecho",
            });
          } else {
            Share.share({ message: `"${pendingReaderShare.text}"\n\n— ${book.title}` });
          }
        }
      } catch {
        Share.share({ message: `"${pendingReaderShare.text}"\n\n— ${book.title}` }).catch(() => {});
      } finally {
        setPendingReaderShare(null);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [pendingReaderShare, book]);

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
    } catch {
      Alert.alert("Erro", "Não foi possível importar o arquivo. Tente novamente.");
    } finally {
      setImporting(false);
    }
  }, [bookId]);

  const handleBack = useCallback(() => {
    if (!book || !bookId) {
      router.back();
      return;
    }
    if (progress > 0 && book.totalPages > 0) {
      const approxPage = Math.round(progress * book.totalPages);
      Alert.alert(
        "Atualizar progresso?",
        `Você está na página ~${approxPage} de ${book.totalPages}. Deseja atualizar?`,
        [
          { text: "Não", style: "cancel", onPress: () => router.back() },
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

  const handleWebViewMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === "progress" && typeof msg.value === "number") {
          setProgress(Math.max(0, Math.min(1, msg.value)));
          if (typeof msg.current === "number") setCurrentPage(msg.current);
          if (typeof msg.total === "number") setTotalPages(msg.total);
        } else if (msg.type === "selection" && msg.text) {
          openSelBar(msg.text, msg.cfi ?? null);
        } else if (msg.type === "selectionCleared") {
          closeSelBar();
        }
      } catch { /* ignore */ }
    },
    []
  );

  const bookHighlights = bookId
    ? getHighlightsForBook(bookId).map((h) => ({
        text: h.text,
        color: HIGHLIGHT_BG_COLORS[h.bgVariant] ?? HIGHLIGHT_BG_COLORS.volt,
        cfi: h.cfi,
      }))
    : [];

  const swipePanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        gs.dy < -20 && Math.abs(gs.dy) > Math.abs(gs.dx) * 1.5,
      onPanResponderRelease: (_, gs) => {
        if (gs.dy < -50 && Math.abs(gs.dx) < 80) {
          Haptics.selectionAsync();
          setSettingsVisible(true);
        }
      },
    })
  ).current;

  const PDF_INJECTED_JS = `
    (function() {
      function reportProgress() {
        var el = document.documentElement;
        var scrollable = el.scrollHeight - el.clientHeight;
        var pct = scrollable > 0 ? el.scrollTop / scrollable : 0;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'progress', value: pct }));
      }
      window.addEventListener('scroll', reportProgress, { passive: true });
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

  const rc = READER_THEMES[settings.theme];
  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);
  const pct = Math.round(progress * 100);
  const approxPage =
    book && book.totalPages > 0 ? Math.max(1, Math.round(progress * book.totalPages)) : null;

  const epubKey = `${fileUri}-${settings.theme}-${settings.fontSize}-${settings.lineHeight}-${settings.fontFamily}-${settings.textAlign}-${bookHighlights.length}`;
  const docDir = FileSystem.documentDirectory ?? undefined;

  return (
    <View style={[styles.container, { backgroundColor: rc.background }]}>
      <TouchableOpacity
        style={{ flex: 1 }}
        activeOpacity={1}
        onPress={() => {
          showBars();
          if (selectedText) closeSelBar();
        }}
      >
        {fileUri && fileType ? (
          <WebView
            key={fileType === "epub" ? epubKey : `${fileUri}-${settings.theme}`}
            source={
              fileType === "pdf"
                ? { uri: fileUri }
                : { html: buildEpubHtml(fileUri, settings, progress, bookHighlights), baseUrl: "" }
            }
            style={{ flex: 1, backgroundColor: rc.background }}
            injectedJavaScript={fileType === "pdf" ? PDF_INJECTED_JS : undefined}
            onMessage={handleWebViewMessage}
            onError={() => Alert.alert("Erro", "Não foi possível carregar o arquivo.")}
            allowFileAccess
            allowUniversalAccessFromFileURLs
            allowingReadAccessToURL={fileType === "epub" ? docDir : undefined}
            originWhitelist={["*", "file://*"]}
            javaScriptEnabled
            domStorageEnabled
            scalesPageToFit={fileType === "pdf"}
            mixedContentMode="always"
          />
        ) : !importModalVisible ? (
          <View style={[styles.placeholder, { backgroundColor: rc.background }]}>
            <Text style={[styles.placeholderText, { color: rc.text }]}>
              Nenhum arquivo importado.
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>

      {/* Top bar */}
      <Animated.View
        style={[
          styles.topBar,
          {
            backgroundColor: `${rc.surface}EE`,
            paddingTop: topInset,
            borderBottomColor:
              rc.background === "#141414" ? "#2A2A2A" : "rgba(0,0,0,0.08)",
          },
          topBarStyle,
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity onPress={handleBack} hitSlop={10} style={styles.barBtn}>
          <Ionicons name="arrow-back" size={22} color={rc.text} />
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
          <Ionicons name="settings-outline" size={20} color={rc.text} />
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom bar */}
      <Animated.View
        style={[
          styles.bottomBar,
          {
            backgroundColor: `${rc.surface}EE`,
            paddingBottom: bottomInset + 12,
            borderTopColor:
              rc.background === "#141414" ? "#2A2A2A" : "rgba(0,0,0,0.08)",
          },
          bottomBarStyle,
        ]}
        pointerEvents="box-none"
      >
        <View
          style={[
            styles.progressTrack,
            {
              backgroundColor:
                rc.background === "#141414" ? "#2A2A2A" : "rgba(0,0,0,0.12)",
            },
          ]}
        >
          <View
            style={[styles.progressFill, { width: `${pct}%`, backgroundColor: "#CDFF00" }]}
          />
        </View>

        <View style={styles.progressMeta}>
          <Text style={[styles.progressPct, { color: rc.text }]}>{pct}%</Text>
          {fileType === "epub" && totalPages > 1 ? (
            <Text style={[styles.progressPage, { color: rc.text }]}>
              {currentPage} / {totalPages}
            </Text>
          ) : approxPage !== null ? (
            <Text style={[styles.progressPage, { color: rc.text }]}>
              Pág. ~{approxPage}
              {book?.totalPages ? ` / ${book.totalPages}` : ""}
            </Text>
          ) : null}
        </View>
      </Animated.View>

      {/* Text selection action bar */}
      <Animated.View
        style={[
          styles.selBar,
          {
            backgroundColor: rc.background === "#141414" ? "#1C1C1C" : "#0F0F0F",
            paddingBottom: bottomInset + 6,
          },
          selBarStyle,
        ]}
        pointerEvents={selectedText ? "auto" : "none"}
      >
        {/* Preview + close */}
        <View style={styles.selHeader}>
          <Text style={styles.selPreview} numberOfLines={2}>
            "{selectedText.slice(0, 80)}{selectedText.length > 80 ? "…" : ""}"
          </Text>
          <TouchableOpacity onPress={closeSelBar} hitSlop={8}>
            <Ionicons name="close" size={18} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Primary action: Salvar trecho */}
        <TouchableOpacity
          style={styles.selPrimaryBtn}
          onPress={handleSaveExcerpt}
          activeOpacity={0.8}
        >
          <Ionicons name="bookmark-outline" size={15} color="#0A0A0A" />
          <Text style={styles.selPrimaryBtnText}>Salvar no caderno</Text>
        </TouchableOpacity>

        {/* Secondary actions row */}
        <View style={styles.selActions}>
          <TouchableOpacity style={styles.selSecBtn} onPress={handleCopyExcerpt} activeOpacity={0.75}>
            <Ionicons name="copy-outline" size={15} color="#B0B0B0" />
            <Text style={styles.selSecBtnText}>Copiar</Text>
          </TouchableOpacity>
          <View style={styles.selDivider} />
          <TouchableOpacity style={styles.selSecBtn} onPress={handleTranslateExcerpt} activeOpacity={0.75}>
            <Ionicons name="language-outline" size={15} color="#B0B0B0" />
            <Text style={styles.selSecBtnText}>Traduzir</Text>
          </TouchableOpacity>
          <View style={styles.selDivider} />
          <TouchableOpacity style={styles.selSecBtn} onPress={handleShareExcerpt} activeOpacity={0.75}>
            <Ionicons name="share-outline" size={15} color="#B0B0B0" />
            <Text style={styles.selSecBtnText}>Compartilhar</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Saved toast */}
      <Animated.View style={[styles.toast, toastStyle]} pointerEvents="none">
        <Ionicons name="checkmark-circle" size={16} color="#CDFF00" />
        <Text style={styles.toastText}>Salvo no caderno</Text>
      </Animated.View>

      {/* Swipe-up zone at bottom to open settings */}
      <View style={styles.swipeZone} {...swipePanResponder.panHandlers} />

      {/* Off-screen share card for reader Compartilhar action */}
      {pendingReaderShare && book && (
        <View style={styles.offScreen} pointerEvents="none">
          <TrechoShareCard
            ref={readerShareCardRef}
            highlight={pendingReaderShare}
            book={book}
          />
        </View>
      )}

      {settingsVisible && (
        <ReaderSettingsPanel
          visible={settingsVisible}
          settings={settings}
          onSettingsChange={setSettings}
          onClose={() => setSettingsVisible(false)}
        />
      )}

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
                ? `Importe um PDF ou ePub de "${book.title}" para leitura no leitor integrado.`
                : "Importe um arquivo PDF ou ePub para leitura."}
            </Text>

            <TouchableOpacity
              style={[styles.importBtn, { backgroundColor: uiColors.volt }]}
              onPress={handleImportFile}
              disabled={importing}
              activeOpacity={0.85}
            >
              <Text style={[styles.importBtnText, { color: uiColors.accentForeground }]}>
                {importing ? "Importando..." : "Selecionar arquivo (PDF / ePub)"}
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
  selBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 14,
    paddingHorizontal: 16,
    zIndex: 10,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    gap: 10,
  },
  selHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  selPreview: {
    flex: 1,
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    lineHeight: 17,
  },
  selPrimaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#CDFF00",
    borderRadius: 12,
    paddingVertical: 13,
  },
  selPrimaryBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0A0A0A",
    letterSpacing: -0.3,
  },
  selActions: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  selSecBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 12,
  },
  selSecBtnText: { fontSize: 12, fontWeight: "600", color: "#B0B0B0" },
  selDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "#2A2A2A",
    marginVertical: 8,
  },
  toast: {
    position: "absolute",
    bottom: 110,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#141414",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    zIndex: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#2A2A2A",
  },
  toastText: { color: "#E8E8E8", fontSize: 13, fontWeight: "600" },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  placeholderText: { fontSize: 16, textAlign: "center" },
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
  swipeZone: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 44,
    zIndex: 5,
  },
  offScreen: {
    position: "absolute",
    left: -2000,
    top: -2000,
  },
});
