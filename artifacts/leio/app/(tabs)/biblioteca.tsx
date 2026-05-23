import { BookCard } from "@/components/BookCard";
import { CapiMascot } from "@/components/CapiMascot";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
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
];

export default function BibliotecaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { books, freeBooks } = useApp();
  const [activeTab, setActiveTab] = useState("reading");
  const [search, setSearch] = useState("");

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  function getBooks(): Book[] {
    if (activeTab === "free") {
      const freeBooksFiltered = freeBooks.filter((b) =>
        search === "" ||
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase())
      );
      return freeBooksFiltered;
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
            placeholder="Procurar livro ou autor..."
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
      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const count =
            tab.id === "free"
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

      {/* Book List */}
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
  tabsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
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
});
