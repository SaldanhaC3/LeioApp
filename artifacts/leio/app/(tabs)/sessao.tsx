import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
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
import { startQuickSession } from "@/utils/startSession";

// Sons ambiente foram removidos desta tela (v.2 ainda não roda no lado do
// cliente). O parâmetro `ambient` continua sendo repassado para
// `/sessao-ativa` com um valor fixo até essa feature voltar.
const DEFAULT_AMBIENT = "none";

export default function SessaoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { books, settings, getCurrentBook } = useApp();
  const currentBook = getCurrentBook();

  const [step, setStep] = useState<"book" | "config">("book");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [startPage, setStartPage] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  const [focusDuration, setFocusDuration] = useState(30);
  const [customDuration, setCustomDuration] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("45");
  const [search, setSearch] = useState("");
  const [spotifyOpened, setSpotifyOpened] = useState(false);

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  async function handleOpenSpotify() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    try {
      const canOpen = await Linking.canOpenURL("spotify:");
      if (canOpen) {
        await Linking.openURL("spotify:");
        setSpotifyOpened(true);
      } else {
        Alert.alert(
          "Spotify não encontrado",
          "Parece que o Spotify não está instalado. Você pode continuar a sessão em silêncio por enquanto.",
          [
            { text: "Abrir na web", onPress: () => Linking.openURL("https://open.spotify.com").catch(() => undefined) },
            { text: "Ok", style: "cancel" },
          ]
        );
      }
    } catch {
      Alert.alert(
        "Não foi possível abrir o Spotify",
        "Tente abrir o Spotify manualmente e volte aqui para começar a sessão.",
        [{ text: "Ok" }]
      );
    }
  }

  const readingBooks = books.filter(
    (b) =>
      b.status === "reading" &&
      (search === "" ||
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase()))
  );

  const wantBooks = books.filter(
    (b) =>
      b.status === "want" &&
      (search === "" ||
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase()))
  );

  function selectBook(book: Book) {
    Haptics.selectionAsync();
    setSelectedBook(book);
    setStartPage(book.currentPage.toString());
    setSpotifyOpened(false);
    setStep("config");
  }

  function startSession() {
    if (!selectedBook) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({
      pathname: "/sessao-ativa",
      params: {
        bookId: selectedBook.id,
        startPage: startPage || selectedBook.currentPage.toString(),
        ambient: DEFAULT_AMBIENT,
        focusMode: focusMode ? "1" : "0",
        focusDuration: focusDuration.toString(),
      },
    });
  }

  if (step === "config" && selectedBook) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topInset + 16, paddingBottom: 100 + bottomInset },
        ]}
      >
        <TouchableOpacity
          onPress={() => setStep("book")}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <Text style={[styles.configTitle, { color: colors.foreground }]}>
          Ajustar a sessão
        </Text>

        {/* Selected Book */}
        <View style={[styles.selectedBookCard, { backgroundColor: selectedBook.coverColor }]}>
          <Text style={styles.selectedBookTitle} numberOfLines={1}>
            {selectedBook.title}
          </Text>
          <Text style={styles.selectedBookAuthor}>{selectedBook.author}</Text>
        </View>

        {/* Start Page */}
        <View style={styles.configSection}>
          <Text style={[styles.configLabel, { color: colors.foreground }]}>
            Página inicial
          </Text>
          <View style={[styles.pageInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.pageInputText, { color: colors.foreground }]}
              value={startPage}
              onChangeText={setStartPage}
              keyboardType="numeric"
              placeholder={selectedBook.currentPage.toString()}
              placeholderTextColor={colors.mutedForeground}
            />
            <Text style={[styles.pageTotal, { color: colors.mutedForeground }]}>
              / {selectedBook.totalPages}
            </Text>
          </View>
        </View>

        {/* Audio Section */}
        <View style={styles.configSection}>
          <Text style={[styles.configLabel, { color: colors.foreground }]}>
            Trilha sonora
          </Text>

          {/* Spotify Deep Link */}
          <Text style={[styles.audioSubLabel, { color: colors.mutedForeground }]}>
            Sincronize com o Spotify
          </Text>
          <TouchableOpacity
            style={[
              styles.spotifyBtn,
              {
                backgroundColor: spotifyOpened ? `${colors.volt}11` : colors.card,
                borderColor: spotifyOpened ? colors.accentBorder : colors.border,
              },
            ]}
            onPress={handleOpenSpotify}
            activeOpacity={0.8}
          >
            <View style={[styles.spotifyIconWrap, { backgroundColor: spotifyOpened ? colors.volt : colors.secondary }]}>
              <Ionicons
                name="musical-notes"
                size={20}
                color={spotifyOpened ? colors.accentForeground : colors.mutedForeground}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.spotifyBtnTitle, { color: colors.foreground }]}>
                {spotifyOpened ? "Spotify aberto — volte quando quiser" : "Abrir no Spotify"}
              </Text>
              <Text style={[styles.spotifyBtnSub, { color: colors.mutedForeground }]}>
                {spotifyOpened
                  ? "Spotify no comando — volte aqui pra começar a sessão"
                  : "Escolha sua playlist no Spotify e comece a sessão já ouvindo ela"}
              </Text>
            </View>
            {spotifyOpened ? (
              <Ionicons name="checkmark-circle" size={20} color={colors.accentText} />
            ) : (
              <Ionicons name="open-outline" size={18} color={colors.mutedForeground} />
            )}
          </TouchableOpacity>
        </View>

        {/* Modo Foco */}
        <View style={styles.configSection}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={[styles.configLabel, { color: colors.foreground }]}>
                Modo Foco
              </Text>
              <Text style={[styles.configSub, { color: colors.mutedForeground }]}>
                Capi cutuca se você der uma escapada
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.toggle,
                { backgroundColor: focusMode ? colors.volt : colors.secondary },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setFocusMode(!focusMode);
              }}
            >
              <View
                style={[
                  styles.toggleThumb,
                  {
                    backgroundColor: focusMode ? colors.accentForeground : colors.mutedForeground,
                    transform: [{ translateX: focusMode ? 20 : 2 }],
                  },
                ]}
              />
            </TouchableOpacity>
          </View>
          {focusMode && (
            <View style={styles.durationRow}>
              {[15, 30, 60].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.durationBtn,
                    {
                      backgroundColor:
                        !customDuration && focusDuration === d
                          ? colors.volt
                          : colors.card,
                      borderColor:
                        !customDuration && focusDuration === d
                          ? colors.volt
                          : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setCustomDuration(false);
                    setFocusDuration(d);
                  }}
                >
                  <Text
                    style={[
                      styles.durationText,
                      {
                        color:
                          !customDuration && focusDuration === d
                            ? colors.accentForeground
                            : colors.foreground,
                      },
                    ]}
                  >
                    {d}min
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.durationBtn,
                  {
                    backgroundColor: customDuration ? colors.volt : colors.card,
                    borderColor: customDuration ? colors.volt : colors.border,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setCustomDuration(true);
                  const parsed = parseInt(customMinutes, 10);
                  if (Number.isFinite(parsed) && parsed >= 1) {
                    setFocusDuration(Math.min(600, parsed));
                  }
                }}
              >
                <Text
                  style={[
                    styles.durationText,
                    {
                      color: customDuration
                        ? colors.accentForeground
                        : colors.foreground,
                    },
                  ]}
                >
                  Outro
                </Text>
              </TouchableOpacity>
            </View>
          )}
          {focusMode && customDuration && (
            <View
              style={[
                styles.customDurationRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.customDurationLabel, { color: colors.mutedForeground }]}>
                Duração
              </Text>
              <TouchableOpacity
                style={[styles.stepperBtn, { borderColor: colors.border }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFocusDuration((d) => Math.max(1, d - 5));
                }}
              >
                <Ionicons name="remove" size={18} color={colors.foreground} />
              </TouchableOpacity>
              <TextInput
                style={[styles.customDurationInput, { color: colors.foreground, borderColor: colors.border }]}
                value={String(focusDuration)}
                keyboardType="number-pad"
                maxLength={3}
                onChangeText={(v) => {
                  const parsed = parseInt(v, 10);
                  setCustomMinutes(v);
                  if (Number.isFinite(parsed) && parsed >= 1) {
                    setFocusDuration(Math.min(600, parsed));
                  } else if (v === "") {
                    setFocusDuration(1);
                  }
                }}
              />
              <Text style={[styles.customDurationLabel, { color: colors.mutedForeground }]}>
                min
              </Text>
              <TouchableOpacity
                style={[styles.stepperBtn, { borderColor: colors.border }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFocusDuration((d) => Math.min(600, d + 5));
                }}
              >
                <Ionicons name="add" size={18} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: colors.volt }]}
          onPress={startSession}
          activeOpacity={0.85}
        >
          <Ionicons name="play-circle" size={24} color={colors.accentForeground} />
          <Text style={[styles.startBtnText, { color: colors.accentForeground }]}>
            Abrir o livro
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

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
      <View style={[styles.header, { paddingHorizontal: 20 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Nova Sessão
        </Text>
      </View>

      <View style={[styles.searchWrap, { paddingHorizontal: 20 }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Procurar na estante..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={[
          { type: "addNew" } as { type: string; label?: string; book?: Book },
          ...(readingBooks.length > 0 ? [{ type: "header", label: "Lendo" }] : []),
          ...readingBooks.map((b) => ({ type: "book", book: b })),
          ...(wantBooks.length > 0 ? [{ type: "header", label: "Quero Ler" }] : []),
          ...wantBooks.map((b) => ({ type: "book", book: b })),
        ] as Array<{ type: string; label?: string; book?: Book }>}
        keyExtractor={(item, i) =>
          item.type === "addNew"
            ? "add-new"
            : item.type === "header"
            ? `h-${i}`
            : item.book!.id
        }
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100 + bottomInset,
          paddingTop: 8,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          currentBook && search === "" ? (
            <TouchableOpacity
              style={[styles.continueHero, { backgroundColor: currentBook.coverColor }]}
              onPress={() => startQuickSession(currentBook, settings.ambientDefault)}
              activeOpacity={0.9}
            >
              <View style={styles.continueHeroText}>
                <Text style={styles.continueHeroKicker}>Continuar de onde parou</Text>
                <Text style={styles.continueHeroTitle} numberOfLines={1}>
                  {currentBook.title}
                </Text>
                <Text style={styles.continueHeroSub} numberOfLines={1}>
                  Pág. {currentBook.currentPage}/{currentBook.totalPages}
                </Text>
              </View>
              <View style={styles.continueHeroPlay}>
                <Ionicons name="play" size={26} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
Estante meio órfã.{"\n"}Torto Arado não leu a si mesmo — adiciona um livro na Biblioteca.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === "addNew") {
            return (
              <TouchableOpacity
                style={[
                  styles.addNewBtn,
                  { backgroundColor: `${colors.volt}11`, borderColor: colors.accentBorder },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push("/buscar-livro");
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.addNewIcon, { backgroundColor: colors.volt }]}>
                  <Ionicons name="add" size={20} color={colors.accentForeground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.addNewTitle, { color: colors.foreground }]}>
                    Colocar um livro novo na estante
                  </Text>
                  <Text style={[styles.addNewSub, { color: colors.mutedForeground }]}>
                    Por título, autor ou ISBN — vale até Kafka
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.accentText} />
              </TouchableOpacity>
            );
          }
          if (item.type === "header") {
            return (
              <Text style={[styles.listHeader, { color: colors.mutedForeground }]}>
                {item.label}
              </Text>
            );
          }
          const book = item.book!;
          return (
            <TouchableOpacity
              style={[
                styles.bookRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => selectBook(book)}
              activeOpacity={0.8}
            >
              <View style={[styles.cover, { backgroundColor: book.coverColor }]}>
                <Ionicons name="book" size={20} color="rgba(255,255,255,0.4)" />
              </View>
              <View style={styles.bookInfo}>
                <Text style={[styles.bookTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {book.title}
                </Text>
                <Text style={[styles.bookAuthor, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {book.author}
                </Text>
                {book.status === "reading" && (
                  <Text style={[styles.bookPage, { color: colors.mutedForeground }]}>
                    Pág. {book.currentPage}/{book.totalPages}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: "900", letterSpacing: -1 },
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
  listHeader: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  bookRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  cover: {
    width: 44,
    height: 60,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  bookInfo: { flex: 1 },
  bookTitle: { fontSize: 15, fontWeight: "700" },
  bookAuthor: { fontSize: 13, marginTop: 2 },
  bookPage: { fontSize: 11, marginTop: 3 },
  addNewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 12,
  },
  addNewIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addNewTitle: { fontSize: 15, fontWeight: "800" },
  addNewSub: { fontSize: 12, marginTop: 2 },
  continueHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  continueHeroText: { flex: 1 },
  continueHeroKicker: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.75)",
  },
  continueHeroTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginTop: 4,
  },
  continueHeroSub: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 3 },
  continueHeroPlay: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },
  backBtn: { marginBottom: 16 },
  configTitle: { fontSize: 24, fontWeight: "900", letterSpacing: -0.8, marginBottom: 20 },
  selectedBookCard: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
  },
  selectedBookTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  selectedBookAuthor: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  configSection: { marginBottom: 24 },
  configLabel: { fontSize: 16, fontWeight: "800", marginBottom: 12 },
  configSub: { fontSize: 12, marginTop: 2 },
  audioSubLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  pageInput: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pageInputText: { flex: 1, fontSize: 20, fontWeight: "700" },
  pageTotal: { fontSize: 16 },
  spotifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
  },
  spotifyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  spotifyBtnTitle: { fontSize: 15, fontWeight: "700" },
  spotifyBtnSub: { fontSize: 12, marginTop: 2 },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggle: {
    width: 46,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  durationRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  durationBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  durationText: { fontSize: 14, fontWeight: "700" },
  customDurationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  customDurationLabel: { fontSize: 13, fontWeight: "600" },
  customDurationInput: {
    width: 56,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
  },
  startBtnText: { fontSize: 18, fontWeight: "900" },
});
