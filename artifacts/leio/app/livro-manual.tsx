import { useApp } from "@/contexts/AppContext";
import type { BookStatus } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COVER_COLORS = ["#1A1A2E", "#16213E", "#0F3460", "#533483", "#2C3E50", "#27AE60", "#8E44AD"];
function pickCoverColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return COVER_COLORS[Math.abs(h) % COVER_COLORS.length];
}

const STATUS_OPTIONS: { label: string; value: BookStatus; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: "Lendo", value: "reading", icon: "book-outline" },
  { label: "Quero ler", value: "want", icon: "bookmark-outline" },
  { label: "Já li", value: "read", icon: "checkmark-done-outline" },
];

function formatDateBR(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function parseDateBR(input: string): string | undefined {
  const m = input.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return undefined;
  const [, ddStr, mmStr, yyyyStr] = m;
  const dd = parseInt(ddStr, 10);
  const mm = parseInt(mmStr, 10);
  const yyyy = parseInt(yyyyStr, 10);
  if (yyyy < 1900 || yyyy > 2200) return undefined;
  if (mm < 1 || mm > 12) return undefined;
  if (dd < 1 || dd > 31) return undefined;
  const d = new Date(yyyy, mm - 1, dd);
  if (
    d.getFullYear() !== yyyy ||
    d.getMonth() !== mm - 1 ||
    d.getDate() !== dd
  ) {
    return undefined;
  }
  return d.toISOString();
}

export default function LivroManualScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addBook } = useApp();

  const [coverUri, setCoverUri] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pages, setPages] = useState("");
  const [purchasedAt, setPurchasedAt] = useState("");
  const [status, setStatus] = useState<BookStatus>("reading");
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => {
    const p = parseInt(pages, 10);
    return title.trim().length > 0 && author.trim().length > 0 && p > 0;
  }, [title, author, pages]);

  async function pickFromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permissão necessária", "Libere o acesso à câmera nos ajustes.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [2, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setCoverUri(result.assets[0].uri);
    }
  }

  async function pickFromLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permissão necessária", "Libere o acesso às fotos nos ajustes.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [2, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setCoverUri(result.assets[0].uri);
    }
  }

  function chooseCover() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancelar", "Tirar foto", "Escolher da galeria"],
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) pickFromCamera();
          if (idx === 2) pickFromLibrary();
        }
      );
    } else {
      Alert.alert("Capa do livro", "Como você quer adicionar?", [
        { text: "Tirar foto", onPress: pickFromCamera },
        { text: "Escolher da galeria", onPress: pickFromLibrary },
        { text: "Cancelar", style: "cancel" },
      ]);
    }
  }

  function handlePurchasedDateChange(text: string) {
    const digits = text.replace(/\D/g, "").slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    setPurchasedAt(formatted);
  }

  function handleSave() {
    if (!canSave) return;
    const totalPages = parseInt(pages, 10);
    const purchasedIso = purchasedAt.trim().length > 0 ? parseDateBR(purchasedAt) : undefined;
    if (purchasedAt.trim().length > 0 && !purchasedIso) {
      Alert.alert("Data inválida", "Use o formato DD/MM/AAAA.");
      return;
    }
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addBook({
      title: title.trim(),
      author: author.trim(),
      genre: "outros",
      totalPages,
      currentPage: status === "read" ? totalPages : 0,
      status,
      coverColor: pickCoverColor(title + author),
      coverImage: coverUri,
      purchasedAt: purchasedIso,
      finishedAt: status === "read" ? new Date().toISOString() : undefined,
    });
    router.back();
  }

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
        <Text style={[styles.title, { color: colors.foreground }]}>Adicionar manualmente</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={chooseCover}
          style={({ pressed }) => [
            styles.coverPicker,
            { backgroundColor: colors.card, borderColor: colors.border },
            pressed && { opacity: 0.85 },
          ]}
        >
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={styles.coverImage} contentFit="cover" />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="camera-outline" size={36} color={colors.muted} />
              <Text style={[styles.coverHint, { color: colors.muted }]}>
                Tirar foto da capa
              </Text>
            </View>
          )}
        </Pressable>

        <Field label="Título *" colors={colors}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Dom Casmurro"
            placeholderTextColor={colors.muted}
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
          />
        </Field>

        <Field label="Autor *" colors={colors}>
          <TextInput
            value={author}
            onChangeText={setAuthor}
            placeholder="Ex: Machado de Assis"
            placeholderTextColor={colors.muted}
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
          />
        </Field>

        <Field label="Páginas *" colors={colors}>
          <TextInput
            value={pages}
            onChangeText={(v) => setPages(v.replace(/\D/g, "").slice(0, 5))}
            placeholder="Ex: 256"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
          />
        </Field>

        <Field label="Quando você comprou" colors={colors}>
          <TextInput
            value={purchasedAt}
            onChangeText={handlePurchasedDateChange}
            placeholder="DD/MM/AAAA"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            maxLength={10}
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
          />
          {purchasedAt.length === 10 && parseDateBR(purchasedAt) && (
            <Text style={[styles.helper, { color: colors.muted }]}>
              Comprado em {formatDateBR(parseDateBR(purchasedAt)!)}
            </Text>
          )}
        </Field>

        <Field label="Status" colors={colors}>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((opt) => {
              const active = status === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setStatus(opt.value);
                  }}
                  style={[
                    styles.statusChip,
                    {
                      borderColor: active ? colors.accentBorder : colors.border,
                      backgroundColor: active ? colors.volt + "22" : "transparent",
                    },
                  ]}
                >
                  <Ionicons
                    name={opt.icon}
                    size={16}
                    color={active ? colors.accentText : colors.muted}
                  />
                  <Text
                    style={[
                      styles.statusChipText,
                      { color: active ? colors.foreground : colors.muted },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Field>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderColor: colors.border, paddingBottom: insets.bottom + 12 },
        ]}
      >
        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave || saving}
          style={[
            styles.saveBtn,
            { backgroundColor: canSave ? colors.volt : colors.border },
          ]}
        >
          <Text style={[styles.saveBtnText, { color: canSave ? colors.accentForeground : colors.mutedForeground }]}>
            Salvar livro
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Field({
  label,
  colors,
  children,
}: {
  label: string;
  colors: ReturnType<typeof useColors>;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      {children}
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
  form: { paddingHorizontal: 20, paddingTop: 8, gap: 16 },
  coverPicker: {
    alignSelf: "center",
    width: 140,
    height: 210,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  coverImage: { width: "100%", height: "100%" },
  coverPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 8,
  },
  coverHint: { fontSize: 12, textAlign: "center" },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  helper: { fontSize: 12, marginTop: 4 },
  statusRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusChipText: { fontSize: 13, fontWeight: "600" },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { fontSize: 16, fontWeight: "700" },
});
