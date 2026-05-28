import { BookCard } from "@/components/BookCard";
import { CapiMascot } from "@/components/CapiMascot";
import { useApp } from "@/contexts/AppContext";
import type { Highlight, VocabularyEntry } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
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

const TABS = [
  { id: "reading", label: "Lendo" },
  { id: "read", label: "Lidos" },
  { id: "want", label: "Quero Ler" },
  { id: "free", label: "Grátis" },
  { id: "trechos", label: "Trechos" },
  { id: "vocabulario", label: "Vocabulário" },
];

const HIGHLIGHT_COLORS: Record<string, string> = {
  volt: "#CDFF00",
  noir: "#2a2a2a",
  cream: "#f5f0e8",
  coral: "#FF6B6B",
};

export default function BibliotecaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { books, freeBooks, highlights, vocabulary } = useApp();
  const [activeTab, setActiveTab] = useState("reading");
  const [search, setSearch] = useState("");
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  function getBooks(): Book[] {
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

  const displayBooks = getBooks();

  const filteredHighlights = highlights
    .filter(
      (h) =>
        search === "" ||
        h.text.toLowerCase().includes(search.toLowerCase()) ||
        books.find((b) => b.id === h.bookId)?.title.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const filteredVocab = vocabulary
    .filter((v) => search === "" || v.word.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));

  const searchPlaceholder =
    activeTab === "trechos"
      ? "Procurar trecho..."
      : activeTab === "vocabulario"
      ? "Procurar palavra..."
      : "Procurar livro ou autor...";

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: topInset,
        },
      ]}
    >
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: 20 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Biblioteca
        </Text>
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
            placeholder={searchPlaceholder}
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

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsScrollView, { borderBottomColor: colors.border }]}
      >
        <View style={styles.tabsRow}>
          {TABS.map((tab) => {
            const count =
              tab.id === "trechos"
                ? highlights.length
                : tab.id === "vocabulario"
                ? vocabulary.length
                : tab.id === "free"
                ? freeBooks.length
                : books.filter((b) =>
                    tab.id === "reading"
                      ? b.status === "reading" || b.status === "abandoned"
                      : b.status === tab.id
                  ).length;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  {
                    borderBottomWidth: activeTab === tab.id ? 2 : 0,
                    borderBottomColor: colors.accentBorder,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveTab(tab.id);
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        activeTab === tab.id
                          ? colors.foreground
                          : colors.mutedForeground,
                      fontWeight: activeTab === tab.id ? "800" : "500",
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
                        backgroundColor:
                          activeTab === tab.id ? colors.volt : colors.secondary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabCountText,
                        {
                          color:
                            activeTab === tab.id
                              ? colors.accentForeground
                              : colors.mutedForeground,
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
        </View>
      </ScrollView>

      {/* Content */}
      {activeTab !== "trechos" && activeTab !== "vocabulario" ? (
        /* Book List */
        <FlatList
          data={displayBooks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: 100 + bottomInset },
          ]}
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
            <BookCard
              book={item}
              onPress={() => router.push(`/livro/${item.id}`)}
            />
          )}
        />
      ) : activeTab === "trechos" ? (
        /* Trechos List */
        <ScrollView
          contentContainerStyle={[
            styles.list,
            { paddingBottom: 100 + bottomInset },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {filteredHighlights.length === 0 ? (
            <View style={styles.empty}>
              <CapiMascot state="waving" size={80} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                Nenhum trecho salvo
              </Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                Salve trechos enquanto você lê
              </Text>
            </View>
          ) : (
            filteredHighlights.map((h) => (
              <TouchableOpacity
                key={h.id}
                style={[
                  styles.highlightCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderLeftColor: HIGHLIGHT_COLORS[h.bgVariant] ?? colors.volt,
                  },
                ]}
                onPress={() => setSelectedHighlight(h)}
              >
                <Text
                  style={[styles.highlightText, { color: colors.foreground }]}
                  numberOfLines={2}
                >
                  {h.text}
                </Text>
                <View style={styles.highlightFooter}>
                  <Text
                    style={[styles.highlightBook, { color: colors.mutedForeground }]}
                  >
                    {books.find((b) => b.id === h.bookId)?.title ?? "Livro desconhecido"}
                  </Text>
                  <TouchableOpacity onPress={() => Clipboard.setStringAsync(h.text)}>
                    <Ionicons name="copy-outline" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      ) : (
        /* Vocabulário List */
        <ScrollView
          contentContainerStyle={[
            styles.list,
            { paddingBottom: 100 + bottomInset },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {filteredVocab.length === 0 ? (
            <View style={styles.empty}>
              <CapiMascot state="waving" size={80} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                Nenhum vocabulário salvo
              </Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                Use o dicionário durante a leitura
              </Text>
            </View>
          ) : (
            filteredVocab.map((v) => (
              <View
                key={v.id}
                style={[
                  styles.vocabCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.vocabWord, { color: colors.foreground }]}>
                  {v.word}
                </Text>
                {v.phonetic && (
                  <Text style={[styles.vocabPhonetic, { color: colors.mutedForeground }]}>
                    {v.phonetic}
                  </Text>
                )}
                <Text
                  style={[styles.vocabDef, { color: colors.mutedForeground }]}
                  numberOfLines={2}
                >
                  {v.definition}
                </Text>
                <Text style={[styles.vocabBook, { color: colors.mutedForeground }]}>
                  {"📖 " + (books.find((b) => b.id === v.bookId)?.title ?? "Livro desconhecido")}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Highlight full-text Modal */}
      <Modal
        visible={selectedHighlight !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedHighlight(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedHighlight(null)}
        >
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.modalColorBar,
                {
                  backgroundColor:
                    HIGHLIGHT_COLORS[selectedHighlight?.bgVariant ?? "volt"],
                },
              ]}
            />
            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.modalText, { color: colors.foreground }]}>
                {selectedHighlight?.text}
              </Text>
              <Text style={[styles.modalBook, { color: colors.mutedForeground }]}>
                {books.find((b) => b.id === selectedHighlight?.bookId)?.title}
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalClose, { backgroundColor: colors.volt }]}
              onPress={() => setSelectedHighlight(null)}
            >
              <Text style={[styles.modalCloseText, { color: colors.accentForeground }]}>
                Fechar
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  tabsScrollView: { flexGrow: 0, borderBottomWidth: 1 },
  tabsRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  tabText: { fontSize: 13 },
  tabCount: {
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  tabCountText: { fontSize: 10, fontWeight: "700" },
  list: { paddingHorizontal: 20, paddingTop: 12 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },
  emptyText: { fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
  emptySub: { fontSize: 14, textAlign: "center", marginTop: 8 },
  highlightCard: {
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  highlightText: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  highlightFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  highlightBook: { fontSize: 12, flex: 1 },
  vocabCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  vocabWord: { fontSize: 20, fontWeight: "800", marginBottom: 2 },
  vocabPhonetic: { fontSize: 13, marginBottom: 4, fontStyle: "italic" },
  vocabDef: { fontSize: 13, lineHeight: 18, marginBottom: 6 },
  vocabBook: { fontSize: 11 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: "hidden",
    maxHeight: "70%",
    width: "100%",
  },
  modalColorBar: { height: 6 },
  modalScroll: { padding: 20 },
  modalText: { fontSize: 17, lineHeight: 26, marginBottom: 12 },
  modalBook: { fontSize: 13 },
  modalClose: {
    margin: 16,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  modalCloseText: { fontSize: 15, fontWeight: "700" },
});
