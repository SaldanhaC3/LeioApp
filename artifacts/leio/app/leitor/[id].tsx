import { HighlightShareCard } from "@/components/HighlightShareCard";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import type { Highlight } from "@/contexts/AppContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ViewShotRef } from "react-native-view-shot";

type BgVariant = Highlight["bgVariant"];

const BG_VARIANTS: { id: BgVariant; label: string; preview: string; fg: string }[] = [
  { id: "volt", label: "Volt", preview: "#CDFF00", fg: "#0A0A0A" },
  { id: "noir", label: "Noir", preview: "#0A0A0A", fg: "#FAFAF8" },
  { id: "cream", label: "Cream", preview: "#F4E9D8", fg: "#0A0A0A" },
  { id: "coral", label: "Coral", preview: "#FF6B5B", fg: "#FAFAF8" },
];

export default function LeitorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getBookById, addHighlight, getHighlightsForBook, removeHighlight, progressShareMission } = useApp();

  const book = getBookById(id ?? "");

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [shareHighlight, setShareHighlight] = useState<Highlight | null>(null);
  const [shareVariant, setShareVariant] = useState<BgVariant>("noir");
  const [exporting, setExporting] = useState(false);
  const shotRef = useRef<ViewShotRef>(null);

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const paragraphs = useMemo(
    () => (book?.excerpt ?? "").split(/\n\n+/).map((p) => p.trim()).filter(Boolean),
    [book?.excerpt]
  );

  const bookHighlights = book ? getHighlightsForBook(book.id) : [];
  const highlightedSet = useMemo(() => {
    const set = new Set<string>();
    bookHighlights.forEach((h) => set.add(h.text));
    return set;
  }, [bookHighlights]);

  if (!book) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingTop: topInset + 20, paddingHorizontal: 20 },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.empty, { color: colors.foreground }]}>Livro não encontrado</Text>
      </View>
    );
  }

  if (paragraphs.length === 0) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingTop: topInset + 20, paddingHorizontal: 20 },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.empty, { color: colors.mutedForeground }]}>
          Este livro ainda não tem trecho disponível.
        </Text>
      </View>
    );
  }

  function handleParagraphPress(idx: number) {
    Haptics.selectionAsync();
    setSelectedIdx(idx === selectedIdx ? null : idx);
  }

  function handleSaveHighlight() {
    if (selectedIdx === null) return;
    const text = paragraphs[selectedIdx];
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const created = addHighlight({
      bookId: book!.id,
      text,
      bgVariant: shareVariant,
    });
    setSelectedIdx(null);
    setShareHighlight(created);
  }

  function handleShareExisting(h: Highlight) {
    Haptics.selectionAsync();
    setShareVariant(h.bgVariant);
    setShareHighlight(h);
  }

  function handleRemoveHighlight(h: Highlight) {
    Alert.alert("Remover destaque", "Tem certeza que quer remover esse destaque?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          removeHighlight(h.id);
        },
      },
    ]);
  }

  async function handleExport() {
    if (!shotRef.current || !shareHighlight) return;
    try {
      setExporting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const uri = await shotRef.current.capture?.();
      if (!uri) throw new Error("capture failed");

      if (Platform.OS === "web") {
        const link = document.createElement("a");
        link.href = uri;
        link.download = `leio-destaque-${shareHighlight.id}.png`;
        link.click();
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Compartilhar destaque",
        });
      }
      progressShareMission();
    } catch (e) {
      Alert.alert("Ops", "Não foi possível exportar o card.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: topInset + 16,
          paddingHorizontal: 20,
          paddingBottom: 200 + bottomInset,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <View style={[styles.tipPill, { backgroundColor: `${colors.volt}22`, borderColor: colors.accentBorder }]}>
            <Ionicons name="hand-left-outline" size={12} color={colors.accentText} />
            <Text style={[styles.tipText, { color: colors.accentText }]}>Toque p/ destacar</Text>
          </View>
        </View>

        <Text style={[styles.bookTitle, { color: colors.foreground }]}>{book.title}</Text>
        <Text style={[styles.bookAuthor, { color: colors.mutedForeground }]}>{book.author}</Text>

        <View style={styles.body}>
          {paragraphs.map((p, idx) => {
            const isSelected = selectedIdx === idx;
            const isHighlighted = highlightedSet.has(p);
            return (
              <Pressable
                key={idx}
                onPress={() => handleParagraphPress(idx)}
                style={({ pressed }) => [
                  styles.paragraphWrap,
                  {
                    backgroundColor: isSelected
                      ? `${colors.volt}22`
                      : isHighlighted
                      ? `${colors.volt}10`
                      : "transparent",
                    borderLeftColor: isSelected
                      ? colors.accentBorder
                      : isHighlighted
                      ? `${colors.accentBorder}88`
                      : "transparent",
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={[styles.paragraph, { color: colors.foreground }]}>{p}</Text>
              </Pressable>
            );
          })}
        </View>

        {bookHighlights.length > 0 && (
          <View style={styles.savedSection}>
            <Text style={[styles.savedTitle, { color: colors.foreground }]}>
              Seus destaques ({bookHighlights.length})
            </Text>
            {bookHighlights
              .slice()
              .reverse()
              .map((h) => (
                <View
                  key={h.id}
                  style={[
                    styles.savedRow,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Text
                    style={[styles.savedText, { color: colors.foreground }]}
                    numberOfLines={3}
                  >
                    {h.text}
                  </Text>
                  <View style={styles.savedActions}>
                    <TouchableOpacity
                      onPress={() => handleShareExisting(h)}
                      style={[styles.savedBtn, { backgroundColor: colors.volt }]}
                    >
                      <Ionicons name="share-social" size={14} color={colors.accentForeground} />
                      <Text style={[styles.savedBtnText, { color: colors.accentForeground }]}>
                        Compartilhar
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRemoveHighlight(h)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={16} color={colors.destructive} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom action bar when paragraph selected */}
      {selectedIdx !== null && (
        <View
          style={[
            styles.actionBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + 12,
            },
          ]}
        >
          <Text style={[styles.actionLabel, { color: colors.mutedForeground }]}>
            Estilo do card
          </Text>
          <View style={styles.variantRow}>
            {BG_VARIANTS.map((v) => (
              <TouchableOpacity
                key={v.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setShareVariant(v.id);
                }}
                style={[
                  styles.variantSwatch,
                  {
                    backgroundColor: v.preview,
                    borderColor: shareVariant === v.id ? colors.volt : "transparent",
                  },
                ]}
              >
                <Text style={[styles.variantLabel, { color: v.fg }]}>Aa</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.volt }]}
            onPress={handleSaveHighlight}
            activeOpacity={0.85}
          >
            <Ionicons name="bookmark" size={18} color={colors.accentForeground} />
            <Text style={[styles.saveBtnText, { color: colors.accentForeground }]}>
              Salvar e compartilhar
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Share modal */}
      <Modal
        visible={shareHighlight !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setShareHighlight(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Compartilhar destaque
              </Text>
              <TouchableOpacity onPress={() => setShareHighlight(null)} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <View style={styles.previewWrap}>
              <View style={styles.previewScale}>
                {shareHighlight && (
                  <HighlightShareCard
                    ref={shotRef}
                    highlight={{ ...shareHighlight, bgVariant: shareVariant }}
                    book={book}
                  />
                )}
              </View>
            </View>

            <Text style={[styles.actionLabel, { color: colors.mutedForeground, marginTop: 16 }]}>
              Estilo
            </Text>
            <View style={styles.variantRow}>
              {BG_VARIANTS.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setShareVariant(v.id);
                  }}
                  style={[
                    styles.variantSwatch,
                    {
                      backgroundColor: v.preview,
                      borderColor: shareVariant === v.id ? colors.accentBorder : "transparent",
                    },
                  ]}
                >
                  <Text style={[styles.variantLabel, { color: v.fg }]}>Aa</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.volt, marginTop: 16 }]}
              onPress={handleExport}
              activeOpacity={0.85}
              disabled={exporting}
            >
              <Ionicons name="share-social" size={18} color={colors.accentForeground} />
              <Text style={[styles.saveBtnText, { color: colors.accentForeground }]}>
                {exporting ? "Exportando..." : Platform.OS === "web" ? "Baixar PNG" : "Compartilhar"}
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
  empty: { fontSize: 16, marginTop: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  tipPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tipText: { fontSize: 11, fontWeight: "700" },
  bookTitle: { fontSize: 28, fontWeight: "900", letterSpacing: -1 },
  bookAuthor: { fontSize: 14, marginTop: 4, marginBottom: 24 },
  body: { gap: 4 },
  paragraphWrap: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderLeftWidth: 3,
    borderRadius: 4,
  },
  paragraph: { fontSize: 17, lineHeight: 28, fontWeight: "500" },
  savedSection: { marginTop: 32, gap: 10 },
  savedTitle: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
  savedRow: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  savedText: { fontSize: 14, lineHeight: 20, fontStyle: "italic" },
  savedActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  savedBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  savedBtnText: { fontSize: 12, fontWeight: "700" },
  actionBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 10,
  },
  actionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  variantRow: { flexDirection: "row", gap: 10 },
  variantSwatch: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  variantLabel: { fontSize: 16, fontWeight: "900" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    padding: 14,
  },
  saveBtnText: { fontSize: 15, fontWeight: "900" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalTitle: { fontSize: 18, fontWeight: "900" },
  previewWrap: {
    height: 320,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  previewScale: {
    transform: [{ scale: 0.18 }],
  },
});
