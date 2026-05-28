import { useApp } from "@/contexts/AppContext";
import type { BookStatus } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { isIsbn, normalizeIsbn, searchBookByIsbn, type BookSearchResult } from "@/services/bookSearch";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COVER_COLORS = ["#1A1A2E", "#16213E", "#0F3460", "#533483", "#2C3E50", "#27AE60"];
function pickCoverColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return COVER_COLORS[Math.abs(h) % COVER_COLORS.length];
}

type State =
  | { kind: "scanning" }
  | { kind: "looking-up"; isbn: string }
  | { kind: "found"; result: BookSearchResult }
  | { kind: "not-found"; isbn: string }
  | { kind: "manual" };

export default function EscanearLivroScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addBook } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<State>({ kind: "scanning" });
  const [manualIsbn, setManualIsbn] = useState("");
  const lastScanRef = useRef<string | null>(null);

  const lookup = useCallback(async (isbn: string) => {
    setState({ kind: "looking-up", isbn });
    try {
      const results = await searchBookByIsbn(isbn);
      if (results.length > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setState({ kind: "found", result: results[0] });
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setState({ kind: "not-found", isbn });
      }
    } catch {
      setState({ kind: "not-found", isbn });
    }
  }, []);

  const handleBarcode = useCallback(
    (event: BarcodeScanningResult) => {
      const raw = event.data ? normalizeIsbn(event.data) : "";
      if (!raw) return;
      if (lastScanRef.current === raw) return;
      if (!isIsbn(raw)) return;
      lastScanRef.current = raw;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      lookup(raw);
    },
    [lookup]
  );

  function addAndClose(status: BookStatus) {
    if (state.kind !== "found") return;
    const r = state.result;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const totalPages = r.pages > 0 ? r.pages : 200;
    addBook({
      title: r.title,
      author: r.author,
      genre: "outros",
      totalPages,
      currentPage: status === "read" ? totalPages : 0,
      status,
      coverColor: pickCoverColor(r.title + r.author),
      isbn: r.isbn,
      coverImage: r.coverUrl,
      finishedAt: status === "read" ? new Date().toISOString() : undefined,
    });
    router.back();
  }

  function rescan() {
    lastScanRef.current = null;
    setState({ kind: "scanning" });
  }

  function submitManualIsbn() {
    const cleaned = normalizeIsbn(manualIsbn);
    if (!isIsbn(cleaned)) {
      Alert.alert("ISBN esquisito", "Confere se digitou direitinho os 10 ou 13 dígitos.");
      return;
    }
    lookup(cleaned);
  }

  const cameraUnavailable = Platform.OS === "web";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Escanear livro</Text>
        <Pressable
          onPress={() =>
            setState((s) => (s.kind === "manual" ? { kind: "scanning" } : { kind: "manual" }))
          }
          hitSlop={12}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons
            name={state.kind === "manual" ? "scan-outline" : "keypad-outline"}
            size={22}
            color={colors.accentText}
          />
        </Pressable>
      </View>

      {state.kind === "manual" || cameraUnavailable ? (
        <View style={styles.manualPane}>
          <Text style={[styles.helper, { color: colors.mutedForeground }]}>
            {cameraUnavailable
              ? "A câmera não funciona aqui no navegador. Digita o ISBN abaixo."
              : "Digita o ISBN que tá na contracapa."}
          </Text>
          <TextInput
            value={manualIsbn}
            onChangeText={setManualIsbn}
            keyboardType="default"
            autoCapitalize="characters"
            placeholder="978..."
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
            ]}
          />
          <TouchableOpacity
            onPress={submitManualIsbn}
            style={[styles.primaryBtn, { backgroundColor: colors.volt }]}
          >
            <Text style={[styles.primaryBtnText, { color: colors.accentForeground }]}>Buscar</Text>
          </TouchableOpacity>
        </View>
      ) : !permission ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accentText} />
        </View>
      ) : !permission.granted ? (
        <View style={styles.center}>
          <Ionicons name="camera-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.helper, { color: colors.mutedForeground, marginTop: 12 }]}>
Sem câmera, sem leitura. Libera o acesso aí.
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            style={[styles.primaryBtn, { backgroundColor: colors.volt, marginTop: 16 }]}
          >
            <Text style={[styles.primaryBtnText, { color: colors.accentForeground }]}>Permitir câmera</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cameraWrap}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
            }}
            onBarcodeScanned={state.kind === "scanning" ? handleBarcode : undefined}
          />
          <View style={styles.overlay} pointerEvents="none">
            <View style={[styles.reticle, { borderColor: colors.volt }]} />
            <Text style={[styles.reticleHint, { color: "#fff" }]}>
Mira no código de barras
            </Text>
          </View>
        </View>
      )}

      {(state.kind === "looking-up" || state.kind === "found" || state.kind === "not-found") && (
        <View style={[styles.resultSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
          {state.kind === "looking-up" && (
            <View style={styles.lookingRow}>
              <ActivityIndicator color={colors.accentText} />
              <Text style={[styles.helper, { color: colors.mutedForeground }]}>
Caçando o ISBN {state.isbn}...
              </Text>
            </View>
          )}
          {state.kind === "not-found" && (
            <>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
Esse ISBN sumiu do catálogo
              </Text>
              <Text style={[styles.helper, { color: colors.mutedForeground, marginTop: 4 }]}>
                ISBN {state.isbn}. Tenta de novo ou cadastra na mão.
              </Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  onPress={rescan}
                  style={[styles.secondaryBtn, { borderColor: colors.border }]}
                >
                  <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>Escanear outro</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.replace("/livro-manual")}
                  style={[styles.primaryBtn, { backgroundColor: colors.volt }]}
                >
                  <Text style={[styles.primaryBtnText, { color: colors.accentForeground }]}>Cadastrar na mão</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          {state.kind === "found" && (
            <>
              <View style={styles.foundRow}>
                {state.result.coverUrl ? (
                  <Image
                    source={{ uri: state.result.coverUrl }}
                    style={styles.cover}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={[styles.cover, { backgroundColor: pickCoverColor(state.result.title) }]}
                  />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
                    {state.result.title}
                  </Text>
                  <Text style={[styles.helper, { color: colors.mutedForeground, marginTop: 4 }]} numberOfLines={1}>
                    {state.result.author}
                  </Text>
                  {state.result.pages > 0 && (
                    <Text style={[styles.helper, { color: colors.mutedForeground, marginTop: 2 }]}>
                      {state.result.pages} páginas
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.statusRow}>
                <TouchableOpacity
                  onPress={() => addAndClose("reading")}
                  style={[styles.primaryBtn, { backgroundColor: colors.volt, flex: 1 }]}
                >
                  <Text style={[styles.primaryBtnText, { color: colors.accentForeground }]}>Tô lendo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => addAndClose("want")}
                  style={[styles.secondaryBtn, { borderColor: colors.border, flex: 1 }]}
                >
                  <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>Quero ler</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={rescan} style={styles.linkBtn}>
                <Text style={[styles.linkText, { color: colors.mutedForeground }]}>Próximo da pilha</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  iconBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: "700" },
  cameraWrap: { flex: 1, overflow: "hidden" },
  overlay: { flex: 1, alignItems: "center", justifyContent: "center" },
  reticle: {
    width: "70%",
    height: 120,
    borderWidth: 2,
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  reticleHint: { marginTop: 12, fontSize: 13 },
  manualPane: { padding: 20, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  helper: { fontSize: 13, lineHeight: 18 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { fontWeight: "700", fontSize: 15 },
  secondaryBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { fontWeight: "600", fontSize: 15 },
  resultSheet: {
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 12,
  },
  lookingRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  foundRow: { flexDirection: "row", gap: 12 },
  cover: { width: 64, height: 90, borderRadius: 6 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  statusRow: { flexDirection: "row", gap: 10 },
  linkBtn: { alignItems: "center", paddingVertical: 6 },
  linkText: { fontSize: 13, textDecorationLine: "underline" },
});
