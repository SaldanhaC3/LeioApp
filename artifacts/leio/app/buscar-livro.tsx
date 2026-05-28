import { CapiMascot } from "@/components/CapiMascot";
import { useApp } from "@/contexts/AppContext";
import type { BookStatus } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { searchBooks, type BookSearchResult } from "@/services/bookSearch";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COVER_COLORS = [
  "#1A1A2E",
  "#16213E",
  "#0F3460",
  "#533483",
  "#2C3E50",
  "#27AE60",
  "#8E44AD",
  "#E74C3C",
  "#D35400",
  "#1ABC9C",
];

function pickCoverColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % COVER_COLORS.length;
  return COVER_COLORS[idx];
}

type SearchState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "success"; results: BookSearchResult[] };

const STATUS_OPTIONS: { label: string; value: BookStatus; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: "Lendo agora", value: "reading", icon: "book-outline" },
  { label: "Quero ler", value: "want", icon: "bookmark-outline" },
  { label: "Já li", value: "read", icon: "checkmark-done-outline" },
];

export default function BuscarLivroScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addBook } = useApp();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ kind: "idle" });
  const [selected, setSelected] = useState<BookSearchResult | null>(null);
  const [manualCoverUri, setManualCoverUri] = useState<string | null>(null);
  const [manualAddMode, setManualAddMode] = useState(false);
  const [manualAddTitle, setManualAddTitle] = useState("");
  const [manualAddAuthor, setManualAddAuthor] = useState("");
  const [manualAddCover, setManualAddCover] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqIdRef = useRef(0);

  const runSearch = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setState({ kind: "idle" });
      return;
    }
    const reqId = ++reqIdRef.current;
    setState({ kind: "loading" });
    try {
      const results = await searchBooks(trimmed);
      if (reqId !== reqIdRef.current) return;
      setState({ kind: "success", results });
    } catch {
      if (reqId !== reqIdRef.current) return;
      setState({ kind: "error" });
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(query);
    }, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  function handleAdd(status: BookStatus) {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const totalPages = selected.pages > 0 ? selected.pages : 200;
    addBook({
      title: selected.title,
      author: selected.author,
      genre: "outros",
      totalPages,
      currentPage: status === "read" ? totalPages : 0,
      status,
      coverColor: pickCoverColor(selected.title + selected.author),
      isbn: selected.isbn,
      coverImage: manualCoverUri || selected.coverUrl,
      finishedAt: status === "read" ? new Date().toISOString() : undefined,
    });
    setSelected(null);
    setManualCoverUri(null);
    router.back();
  }

  async function pickManualCover() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permissão necessária", "Autorize o acesso à galeria para adicionar uma capa.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        setManualCoverUri(result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert("Erro", "Não foi possível acessar a galeria.");
    }
  }

  async function openManualAddFlow() {
    Haptics.selectionAsync();
    setManualAddTitle(query.trim());
    setManualAddAuthor("");
    setManualAddCover(null);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.granted) {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.7,
        });
        if (!result.canceled && result.assets[0]) {
          setManualAddCover(result.assets[0].uri);
        }
      }
    } catch {
    }
    setManualAddMode(true);
  }

  function handleManualAdd(status: BookStatus) {
    if (!manualAddTitle.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addBook({
      title: manualAddTitle.trim(),
      author: manualAddAuthor.trim() || "Autor desconhecido",
      genre: "outros",
      totalPages: 200,
      currentPage: status === "read" ? 200 : 0,
      status,
      coverColor: pickCoverColor(manualAddTitle + manualAddAuthor),
      coverImage: manualAddCover ?? undefined,
      finishedAt: status === "read" ? new Date().toISOString() : undefined,
    });
    setManualAddMode(false);
    setManualAddCover(null);
    router.back();
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>
Procurar livro
        </Text>
        <View style={styles.closeBtn} />
      </View>

      <View
        style={[
          styles.searchBar,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Título, autor ou ISBN..."
          placeholderTextColor={colors.mutedForeground}
          value={query}
          onChangeText={setQuery}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={() => runSearch(query)}
        />
        {query !== "" && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.hint, { color: colors.mutedForeground }]}>
Digite título, autor ou cole o ISBN. A gente vasculha o acervo.
      </Text>

      {state.kind === "loading" && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accentText} />
          <Text style={[styles.muted, { color: colors.mutedForeground }]}>
Folheando o catálogo...
          </Text>
        </View>
      )}

      {state.kind === "error" && (
        <View style={styles.center}>
          <CapiMascot state="sad" size={96} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
A conexão fugiu
          </Text>
          <Text style={[styles.muted, { color: colors.mutedForeground }]}>
            Sem internet por aqui. A Capi fica esperando.
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.volt }]}
            onPress={() => runSearch(query)}
          >
            <Text style={[styles.retryText, { color: colors.accentForeground }]}>
              Tentar de novo
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {state.kind === "idle" && query.trim().length < 2 && (
        <View style={styles.center}>
          <CapiMascot state="reading" size={96} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
Bora achar o próximo livro
          </Text>
          <Text style={[styles.muted, { color: colors.mutedForeground }]}>
            Digita aí em cima — Machado, Clarice, Kafka, o que vier.
          </Text>
        </View>
      )}

      {state.kind === "success" && state.results.length === 0 && (
        <View style={styles.center}>
          <CapiMascot state="surprised" size={96} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
Estante vazia nesse termo
          </Text>
          <Text style={[styles.muted, { color: colors.mutedForeground }]}>
            Nada encontrado. Tenta outro título ou outro autor.
          </Text>
          <TouchableOpacity
            style={[styles.manualFallbackBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={openManualAddFlow}
            activeOpacity={0.8}
          >
            <Ionicons name="camera-outline" size={18} color={colors.accentText} />
            <Text style={[styles.manualFallbackText, { color: colors.foreground }]}>
              Não encontrei — adicionar com foto
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      )}

      {state.kind === "success" && state.results.length > 0 && (
        <FlatList
          data={state.results}
          keyExtractor={(item, idx) => `${item.isbn ?? "noisbn"}-${idx}`}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={
            <TouchableOpacity
              style={[styles.manualFallbackBtn, { borderColor: colors.border, backgroundColor: colors.card, marginTop: 4 }]}
              onPress={openManualAddFlow}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-outline" size={18} color={colors.accentText} />
              <Text style={[styles.manualFallbackText, { color: colors.foreground }]}>
                Não encontrei — adicionar com foto
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.resultCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.selectionAsync();
                setSelected(item);
              }}
            >
              <View
                style={[
                  styles.cover,
                  { backgroundColor: pickCoverColor(item.title + item.author) },
                ]}
              >
                {item.coverUrl ? (
                  <Image
                    source={{ uri: item.coverUrl }}
                    style={styles.coverImage}
                    contentFit="cover"
                    transition={150}
                  />
                ) : (
                  <Ionicons name="book" size={22} color="rgba(255,255,255,0.5)" />
                )}
              </View>
              <View style={styles.resultInfo}>
                <Text
                  style={[styles.resultTitle, { color: colors.foreground }]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
                <Text
                  style={[styles.resultAuthor, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {item.author}
                </Text>
                <View style={styles.resultMeta}>
                  {item.pages > 0 && (
                    <Text
                      style={[styles.resultMetaText, { color: colors.mutedForeground }]}
                    >
                      {item.pages} págs
                    </Text>
                  )}
                  {item.isbn && (
                    <Text
                      style={[styles.resultMetaText, { color: colors.mutedForeground }]}
                      numberOfLines={1}
                    >
                      ISBN {item.isbn}
                    </Text>
                  )}
                </View>
              </View>
              <Ionicons name="add-circle" size={24} color={colors.accentText} />
            </TouchableOpacity>
          )}
        />
      )}

      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => { setSelected(null); setManualCoverUri(null); }}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => { setSelected(null); setManualCoverUri(null); }}
        >
          <Pressable
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 16) + 8,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHandle} />
            <Text
              style={[styles.modalTitle, { color: colors.foreground }]}
              numberOfLines={2}
            >
              {selected?.title}
            </Text>
            <Text
              style={[styles.modalAuthor, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {selected?.author}
            </Text>
            {/* Manual cover option — always visible */}
            {selected && (
              <TouchableOpacity
                style={[styles.addCoverRow, { borderColor: colors.border, backgroundColor: colors.secondary }]}
                onPress={pickManualCover}
                activeOpacity={0.8}
              >
                {manualCoverUri ? (
                  <Image
                    source={{ uri: manualCoverUri }}
                    style={styles.manualCoverThumb}
                    contentFit="cover"
                  />
                ) : selected?.coverUrl ? (
                  <Image
                    source={{ uri: selected.coverUrl }}
                    style={styles.manualCoverThumb}
                    contentFit="cover"
                  />
                ) : (
                  <Ionicons name="camera-outline" size={20} color={colors.accentText} />
                )}
                <Text style={[styles.addCoverText, { color: manualCoverUri ? colors.foreground : colors.accentText }]}>
                  {manualCoverUri ? "Capa personalizada — trocar" : selected?.coverUrl ? "Usar capa diferente" : "Adicionar capa da galeria"}
                </Text>
                {manualCoverUri && (
                  <Ionicons name="checkmark-circle" size={18} color={colors.accentText} />
                )}
              </TouchableOpacity>
            )}

            <Text style={[styles.modalQuestion, { color: colors.foreground }]}>
Vai entrar em qual prateleira?
            </Text>
            {STATUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.statusBtn,
                  { backgroundColor: colors.secondary, borderColor: colors.border },
                ]}
                onPress={() => handleAdd(opt.value)}
                activeOpacity={0.8}
              >
                <Ionicons name={opt.icon} size={20} color={colors.accentText} />
                <Text
                  style={[styles.statusLabel, { color: colors.foreground }]}
                >
                  {opt.label}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => { setSelected(null); setManualCoverUri(null); }}
            >
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>
                Deixa pra lá
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Manual add modal (when user picks cover and enters title/author) */}
      <Modal
        visible={manualAddMode}
        transparent
        animationType="slide"
        onRequestClose={() => setManualAddMode(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setManualAddMode(false)}
        >
          <Pressable
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 16) + 8,
                gap: 10,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHandle} />
            <View style={styles.manualAddHeader}>
              {manualAddCover ? (
                <TouchableOpacity
                  style={[styles.manualAddCoverThumb, { backgroundColor: colors.secondary }]}
                  onPress={async () => {
                    try {
                      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [3, 4], quality: 0.7 });
                      if (!r.canceled && r.assets[0]) setManualAddCover(r.assets[0].uri);
                    } catch {}
                  }}
                >
                  <Image source={{ uri: manualAddCover }} style={styles.manualAddCoverImg} contentFit="cover" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.manualAddCoverThumb, { backgroundColor: colors.secondary, borderColor: colors.border, borderWidth: 1, borderStyle: "dashed" }]}
                  onPress={async () => {
                    try {
                      const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (!p.granted) return;
                      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [3, 4], quality: 0.7 });
                      if (!r.canceled && r.assets[0]) setManualAddCover(r.assets[0].uri);
                    } catch {}
                  }}
                >
                  <Ionicons name="camera-outline" size={22} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
              <View style={{ flex: 1, gap: 8 }}>
                <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border, paddingVertical: 8, marginHorizontal: 0 }]}>
                  <TextInput
                    style={[styles.searchInput, { color: colors.foreground }]}
                    placeholder="Título do livro"
                    placeholderTextColor={colors.mutedForeground}
                    value={manualAddTitle}
                    onChangeText={setManualAddTitle}
                    returnKeyType="next"
                    autoFocus
                  />
                </View>
                <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border, paddingVertical: 8, marginHorizontal: 0 }]}>
                  <TextInput
                    style={[styles.searchInput, { color: colors.foreground }]}
                    placeholder="Autor"
                    placeholderTextColor={colors.mutedForeground}
                    value={manualAddAuthor}
                    onChangeText={setManualAddAuthor}
                    returnKeyType="done"
                  />
                </View>
              </View>
            </View>
            <Text style={[styles.modalQuestion, { color: colors.foreground }]}>
              Vai entrar em qual prateleira?
            </Text>
            {STATUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.statusBtn,
                  { backgroundColor: colors.secondary, borderColor: colors.border },
                  !manualAddTitle.trim() && { opacity: 0.4 },
                ]}
                onPress={() => handleManualAdd(opt.value)}
                disabled={!manualAddTitle.trim()}
                activeOpacity={0.8}
              >
                <Ionicons name={opt.icon} size={20} color={colors.accentText} />
                <Text style={[styles.statusLabel, { color: colors.foreground }]}>{opt.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setManualAddMode(false)}
            >
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  closeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    marginHorizontal: 20,
  },
  searchInput: { flex: 1, fontSize: 15 },
  hint: {
    fontSize: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", letterSpacing: -0.5, textAlign: "center" },
  muted: { fontSize: 14, textAlign: "center" },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: { fontSize: 14, fontWeight: "800" },
  list: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  cover: {
    width: 52,
    height: 72,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  coverImage: { width: "100%", height: "100%" },
  resultInfo: { flex: 1, gap: 3 },
  resultTitle: { fontSize: 14, fontWeight: "700", letterSpacing: -0.2 },
  resultAuthor: { fontSize: 12 },
  resultMeta: { flexDirection: "row", gap: 10, marginTop: 4 },
  resultMetaText: { fontSize: 11 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 10,
  },
  modalHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3A3A3A",
    marginBottom: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },
  modalAuthor: { fontSize: 13 },
  modalQuestion: { fontSize: 14, fontWeight: "700", marginTop: 8, marginBottom: 4 },
  statusBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  statusLabel: { flex: 1, fontSize: 15, fontWeight: "700" },
  cancelBtn: { alignItems: "center", paddingVertical: 12, marginTop: 4 },
  cancelText: { fontSize: 14, fontWeight: "600" },
  addCoverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  manualCoverThumb: {
    width: 30,
    height: 40,
    borderRadius: 4,
    overflow: "hidden",
  },
  addCoverText: { flex: 1, fontSize: 14, fontWeight: "600" },
  manualFallbackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
  },
  manualFallbackText: { flex: 1, fontSize: 14, fontWeight: "700" },
  manualAddHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  manualAddCoverThumb: {
    width: 60,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  manualAddCoverImg: {
    width: "100%",
    height: "100%",
  },
});
