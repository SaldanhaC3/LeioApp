import { BookCard } from "@/components/BookCard";
import { CapiMascot } from "@/components/CapiMascot";
import { TrechoShareCard } from "@/components/TrechoShareCard";
import { useApp, type Highlight, type VocabularyEntry } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Book } from "@/contexts/AppContext";
import type { ViewShotRef } from "react-native-view-shot";

const BOOK_TABS = [
  { id: "reading", label: "Lendo" },
  { id: "read", label: "Lidos" },
  { id: "want", label: "Quero Ler" },
  { id: "free", label: "Grátis" },
  { id: "caderno", label: "Caderno" },
];

const CADERNO_FILTERS = [
  { id: "trechos", label: "Trechos" },
  { id: "vocabulario", label: "Vocabulário" },
];

const VARIANT_COLORS: Record<Highlight["bgVariant"], string> = {
  volt: "#CDFF00",
  noir: "#0A0A0A",
  cream: "#F4E9D8",
  coral: "#FF6B5B",
};

export default function BibliotecaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    books,
    freeBooks,
    highlights,
    vocabulary,
    getBookById,
    removeHighlight,
    removeVocabularyEntry,
  } = useApp();

  const [activeTab, setActiveTab] = useState("reading");
  const [search, setSearch] = useState("");
  const [cadernoFilter, setCadernoFilter] = useState<"trechos" | "vocabulario">("trechos");

  const [pendingShare, setPendingShare] = useState<{ highlight: Highlight; book: Book } | null>(
    null
  );
  const [sharing, setSharing] = useState(false);
  const shareCardRef = useRef<ViewShotRef>(null);

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  useEffect(() => {
    if (!pendingShare) return;
    const t = setTimeout(async () => {
      try {
        setSharing(true);
        const uri = await shareCardRef.current?.capture?.();
        if (uri) {
          await Sharing.shareAsync(uri, { mimeType: "image/png" });
        }
      } catch {
        Alert.alert("Erro", "Não foi possível compartilhar o trecho.");
      } finally {
        setPendingShare(null);
        setSharing(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [pendingShare]);

  function getBooks(): Book[] {
    if (activeTab === "caderno") return [];
    if (activeTab === "free") {
      return freeBooks.filter(
        (b) =>
          search === "" ||
          b.title.toLowerCase().includes(search.toLowerCase()) ||
          b.author.toLowerCase().includes(search.toLowerCase())
      );
    }
    return books.filter((b) => {
      const matchTab =
        activeTab === "reading"
          ? b.status === "reading" || b.status === "abandoned"
          : activeTab === "want"
          ? b.status === "want"
          : b.status === activeTab;
      const matchSearch =
        search === "" ||
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase());
      return matchTab && matchSearch;
    });
  }

  const filteredHighlights = highlights.filter((h) =>
    search === "" ||
    h.text.toLowerCase().includes(search.toLowerCase()) ||
    (getBookById(h.bookId)?.title ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredVocabulary = vocabulary.filter((v) =>
    search === "" ||
    v.word.toLowerCase().includes(search.toLowerCase()) ||
    v.definition.toLowerCase().includes(search.toLowerCase()) ||
    (getBookById(v.bookId)?.title ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const displayBooks = getBooks();

  const handleDeleteHighlight = useCallback(
    (h: Highlight) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
        "Excluir trecho?",
        `"${h.text.slice(0, 60)}${h.text.length > 60 ? "…" : ""}"`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Excluir",
            style: "destructive",
            onPress: () => {
              removeHighlight(h.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
        ]
      );
    },
    [removeHighlight]
  );

  const handleDeleteVocabulary = useCallback(
    (v: VocabularyEntry) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
        "Excluir palavra?",
        `"${v.word}" — ${v.definition.slice(0, 60)}${v.definition.length > 60 ? "…" : ""}`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Excluir",
            style: "destructive",
            onPress: () => {
              removeVocabularyEntry(v.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
        ]
      );
    },
    [removeVocabularyEntry]
  );

  const handleShareHighlight = useCallback(
    (h: Highlight) => {
      const book = getBookById(h.bookId);
      if (!book) return;
      Haptics.selectionAsync();
      setPendingShare({ highlight: h, book });
    },
    [getBookById]
  );

  function renderHighlight({ item: h }: { item: Highlight }) {
    const book = getBookById(h.bookId);
    const accentColor = VARIANT_COLORS[h.bgVariant];
    return (
      <View
        style={[
          styles.cadernoCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={[styles.hlAccent, { backgroundColor: accentColor }]} />
        <View style={styles.cadernoCardBody}>
          <Text style={[styles.hlText, { color: colors.foreground }]} numberOfLines={4}>
            {h.text}
          </Text>
          {book && (
            <Text style={[styles.hlBook, { color: colors.mutedForeground }]} numberOfLines={1}>
              {book.title} · {book.author}
            </Text>
          )}
          <Text style={[styles.hlDate, { color: colors.mutedForeground }]}>
            {new Date(h.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </Text>
          <View style={styles.hlActions}>
            <TouchableOpacity
              style={[styles.hlBtn, { borderColor: colors.border }]}
              onPress={() => handleShareHighlight(h)}
              disabled={sharing}
            >
              <Ionicons name="share-outline" size={14} color={colors.accentText} />
              <Text style={[styles.hlBtnText, { color: colors.accentText }]}>
                {sharing && pendingShare?.highlight.id === h.id ? "…" : "Compartilhar"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.hlBtn, { borderColor: colors.border }]}
              onPress={() => handleDeleteHighlight(h)}
            >
              <Ionicons name="trash-outline" size={14} color={colors.mutedForeground} />
              <Text style={[styles.hlBtnText, { color: colors.mutedForeground }]}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  function renderVocabulary({ item: v }: { item: VocabularyEntry }) {
    const book = getBookById(v.bookId);
    return (
      <View
        style={[
          styles.cadernoCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={[styles.hlAccent, { backgroundColor: colors.volt }]} />
        <View style={styles.cadernoCardBody}>
          <View style={styles.vocabHeader}>
            <Text style={[styles.vocabWord, { color: colors.foreground }]}>{v.word}</Text>
            {v.phonetic ? (
              <Text style={[styles.vocabPhonetic, { color: colors.mutedForeground }]}>
                {v.phonetic}
              </Text>
            ) : null}
          </View>
          <Text style={[styles.vocabDef, { color: colors.foreground }]} numberOfLines={3}>
            {v.definition}
          </Text>
          {book && (
            <Text style={[styles.hlBook, { color: colors.mutedForeground }]} numberOfLines={1}>
              {book.title}
            </Text>
          )}
          <View style={styles.hlActions}>
            <Text style={[styles.hlDate, { color: colors.mutedForeground }]}>
              {new Date(v.savedAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </Text>
            <TouchableOpacity
              onPress={() => handleDeleteVocabulary(v)}
              hitSlop={8}
            >
              <Ionicons name="trash-outline" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const isCaderno = activeTab === "caderno";
  const cadernoData =
    cadernoFilter === "trechos" ? filteredHighlights : filteredVocabulary;
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: topInset },
      ]}
    >
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: 20 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Biblioteca</Text>
        {!isCaderno && (
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.volt }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/adicionar-livro");
            }}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Ionicons name="add" size={20} color={colors.accentForeground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { paddingHorizontal: 20 }]}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder={
              isCaderno
                ? cadernoFilter === "trechos"
                  ? "Procurar trecho ou livro..."
                  : "Procurar palavra..."
                : "Procurar livro ou autor..."
            }
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search !== "" && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main tabs row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsScrollRow, { borderBottomColor: colors.border }]}
        contentContainerStyle={styles.tabsContent}
      >
        {BOOK_TABS.map((tab) => {
          const count =
            tab.id === "caderno"
              ? highlights.length + vocabulary.length
              : tab.id === "free"
              ? freeBooks.length
              : books.filter((b) =>
                  tab.id === "reading"
                    ? b.status === "reading" || b.status === "abandoned"
                    : b.status === tab.id
                ).length;
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                isActive && { borderBottomWidth: 2, borderBottomColor: colors.accentBorder },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab(tab.id);
                setSearch("");
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isActive ? colors.foreground : colors.mutedForeground,
                    fontWeight: isActive ? "800" : "500",
                  },
                ]}
              >
                {tab.label}
              </Text>
              {count > 0 && (
                <View
                  style={[
                    styles.tabCount,
                    {
                      backgroundColor: isActive ? colors.volt : colors.secondary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabCountText,
                      {
                        color: isActive ? colors.accentForeground : colors.mutedForeground,
                      },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Caderno sub-tabs */}
      {isCaderno && (
        <View style={[styles.cadernoTabs, { borderBottomColor: colors.border }]}>
          {CADERNO_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.cadernoTab,
                cadernoFilter === f.id && {
                  backgroundColor: colors.volt,
                  borderColor: colors.volt,
                },
                cadernoFilter !== f.id && { borderColor: colors.border },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setCadernoFilter(f.id as "trechos" | "vocabulario");
                setSearch("");
              }}
            >
              <Ionicons
                name={f.id === "trechos" ? "bookmark-outline" : "text-outline"}
                size={14}
                color={cadernoFilter === f.id ? colors.accentForeground : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.cadernoTabText,
                  {
                    color:
                      cadernoFilter === f.id ? colors.accentForeground : colors.mutedForeground,
                    fontWeight: cadernoFilter === f.id ? "800" : "500",
                  },
                ]}
              >
                {f.label}
              </Text>
              <Text
                style={[
                  styles.cadernoTabCount,
                  {
                    color:
                      cadernoFilter === f.id ? colors.accentForeground : colors.mutedForeground,
                  },
                ]}
              >
                {f.id === "trechos" ? highlights.length : vocabulary.length}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Book list */}
      {!isCaderno && (
        <FlatList
          data={displayBooks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: 100 + bottomInset }]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!displayBooks.length}
          ListEmptyComponent={
            <View style={styles.empty}>
              <CapiMascot state="waving" size={80} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {activeTab === "reading"
                  ? "Nenhum livro em curso"
                  : activeTab === "read"
                  ? "Nenhum livro fechado ainda"
                  : activeTab === "want"
                  ? "Lista de desejo silenciosa feito noite de Drummond"
                  : "Carregando os clássicos do domínio público..."}
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {activeTab === "free"
                  ? "Machado, Lima, Eça e companhia — grátis e sem ressalva."
                  : "Toque em + e plante o próximo livro aqui"}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <BookCard book={item} onPress={() => router.push(`/livro/${item.id}`)} />
          )}
        />
      )}

      {/* Caderno list */}
      {isCaderno && (
        <FlatList
          data={cadernoData as (Highlight | VocabularyEntry)[]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: 100 + bottomInset }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <CapiMascot state="waving" size={80} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {cadernoFilter === "trechos"
                  ? "Nenhum trecho salvo ainda"
                  : "Nenhuma palavra no vocabulário"}
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {cadernoFilter === "trechos"
                  ? "Selecione um trecho no leitor e toque em Salvar"
                  : "Palavras salvas no leitor aparecem aqui"}
              </Text>
            </View>
          }
          renderItem={
            cadernoFilter === "trechos"
              ? ({ item }) => renderHighlight({ item: item as Highlight })
              : ({ item }) => renderVocabulary({ item: item as VocabularyEntry })
          }
        />
      )}

      {/* Off-screen TrechoShareCard for capture */}
      {pendingShare && (
        <View style={styles.offScreen} pointerEvents="none">
          <TrechoShareCard
            ref={shareCardRef}
            highlight={pendingShare.highlight}
            book={pendingShare.book}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
  },
  title: { fontSize: 28, fontWeight: "900", letterSpacing: -1 },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: { marginBottom: 12 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 15 },
  tabsScrollRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
    flexGrow: 0,
  },
  tabsContent: {
    paddingHorizontal: 12,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: -StyleSheet.hairlineWidth,
  },
  tabText: { fontSize: 13 },
  tabCount: {
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  tabCountText: { fontSize: 10, fontWeight: "700" },
  cadernoTabs: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  cadernoTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  cadernoTabText: { fontSize: 13 },
  cadernoTabCount: { fontSize: 11, fontWeight: "800" },
  list: { paddingHorizontal: 20, paddingTop: 12 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },
  emptyText: { fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
  cadernoCard: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  hlAccent: { width: 4 },
  cadernoCardBody: { flex: 1, padding: 14, gap: 6 },
  hlText: { fontSize: 15, lineHeight: 22, fontStyle: "italic" },
  hlBook: { fontSize: 12, fontWeight: "600" },
  hlDate: { fontSize: 11 },
  hlActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  hlBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  hlBtnText: { fontSize: 12, fontWeight: "600" },
  vocabHeader: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  vocabWord: { fontSize: 17, fontWeight: "900", letterSpacing: -0.4 },
  vocabPhonetic: { fontSize: 13 },
  vocabDef: { fontSize: 14, lineHeight: 20 },
  offScreen: {
    position: "absolute",
    left: -2000,
    top: -2000,
    opacity: 0,
  },
});
