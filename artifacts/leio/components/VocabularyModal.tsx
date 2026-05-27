import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import {
  lookupWord,
  SupportedLanguage,
  WordLookup,
} from "@/services/translation";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface VocabularyModalProps {
  visible: boolean;
  bookId: string;
  onClose: () => void;
}

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; lookup: WordLookup }
  | { kind: "not-found" }
  | { kind: "error" };

interface LangOption {
  code: SupportedLanguage;
  label: string;
  speechLang: string;
  placeholder: string;
}

const LANG_OPTIONS: LangOption[] = [
  {
    code: "en",
    label: "🇺🇸 EN",
    speechLang: "en-US",
    placeholder: "Ex.: ephemeral",
  },
  {
    code: "pt-br",
    label: "🇧🇷 PT",
    speechLang: "pt-BR",
    placeholder: "Ex.: efêmero",
  },
  {
    code: "es",
    label: "🇪🇸 ES",
    speechLang: "es-ES",
    placeholder: "Ex.: efímero",
  },
];

export function VocabularyModal({
  visible,
  bookId,
  onClose,
}: VocabularyModalProps) {
  const colors = useColors();
  const { addVocabularyEntry } = useApp();
  const [word, setWord] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [saved, setSaved] = useState(false);
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>("en");
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  const activeLang =
    LANG_OPTIONS.find((l) => l.code === selectedLang) ?? LANG_OPTIONS[0];

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      Speech.stop().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      Speech.stop().catch(() => undefined);
    }
  }, [visible]);

  function reset() {
    setWord("");
    setStatus({ kind: "idle" });
    setSaved(false);
    requestIdRef.current += 1;
    Speech.stop().catch(() => undefined);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleLangChange(lang: SupportedLanguage) {
    if (lang === selectedLang) return;
    setSelectedLang(lang);
    // Reset results when switching language
    setStatus({ kind: "idle" });
    setSaved(false);
    requestIdRef.current += 1;
    Speech.stop().catch(() => undefined);
  }

  async function handleSearch() {
    const term = word.trim();
    if (term.length < 2) return;
    Haptics.selectionAsync().catch(() => undefined);
    requestIdRef.current += 1;
    const reqId = requestIdRef.current;
    setStatus({ kind: "loading" });
    setSaved(false);
    try {
      const result = await lookupWord(term, selectedLang);
      if (!mountedRef.current || reqId !== requestIdRef.current) return;
      if (result.kind === "not-found") {
        setStatus({ kind: "not-found" });
        return;
      }
      if (result.kind === "network-error") {
        setStatus({ kind: "error" });
        return;
      }
      setStatus({ kind: "ready", lookup: result.lookup });
    } catch {
      if (!mountedRef.current || reqId !== requestIdRef.current) return;
      setStatus({ kind: "error" });
    }
  }

  function handleListen() {
    if (status.kind !== "ready") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
      () => undefined
    );
    Speech.stop().catch(() => undefined);
    Speech.speak(status.lookup.word, {
      language: activeLang.speechLang,
      rate: 0.9,
      pitch: 1.0,
    });
  }

  function handleSave() {
    if (status.kind !== "ready") return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => undefined
    );
    // For EN: save Portuguese translation as definition; for PT/ES: save native definition
    const definitionToSave =
      status.lookup.language === "en"
        ? (status.lookup.portuguese ?? status.lookup.definition)
        : status.lookup.definition;
    addVocabularyEntry({
      bookId,
      word: status.lookup.word,
      definition: definitionToSave,
      phonetic: status.lookup.phonetic,
    });
    setSaved(true);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {/* ── Header ── */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  Anotar no caderninho
                </Text>
                <Text
                  style={[styles.sub, { color: colors.mutedForeground }]}
                >
                  Busque uma palavra para guardar no vocabulário
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeBtn}
                hitSlop={8}
                accessibilityLabel="Fechar"
              >
                <Ionicons name="close" size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* ── Language chips ── */}
            <View style={styles.langRow}>
              {LANG_OPTIONS.map((opt) => {
                const active = opt.code === selectedLang;
                return (
                  <TouchableOpacity
                    key={opt.code}
                    onPress={() => handleLangChange(opt.code)}
                    style={[
                      styles.langChip,
                      {
                        backgroundColor: active
                          ? `${colors.volt}22`
                          : colors.background,
                        borderColor: active
                          ? colors.volt
                          : colors.border,
                      },
                    ]}
                    accessibilityLabel={`Buscar em ${opt.label}`}
                  >
                    <Text
                      style={[
                        styles.langChipText,
                        {
                          color: active
                            ? colors.accentText
                            : colors.mutedForeground,
                          fontWeight: active ? "800" : "600",
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Search input ── */}
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.foreground,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
                value={word}
                onChangeText={(v) => {
                  setWord(v);
                  if (status.kind !== "idle") {
                    setStatus({ kind: "idle" });
                    setSaved(false);
                  }
                }}
                placeholder={activeLang.placeholder}
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
                autoFocus
              />
              <TouchableOpacity
                onPress={handleSearch}
                disabled={word.trim().length < 2 || status.kind === "loading"}
                style={[
                  styles.searchBtn,
                  {
                    backgroundColor:
                      word.trim().length < 2 ? colors.border : colors.volt,
                    opacity: status.kind === "loading" ? 0.7 : 1,
                  },
                ]}
              >
                <Ionicons
                  name="search"
                  size={20}
                  color={
                    word.trim().length < 2
                      ? colors.mutedForeground
                      : colors.accentForeground
                  }
                />
              </TouchableOpacity>
            </View>

            {/* ── States ── */}
            {status.kind === "loading" && (
              <View style={styles.center}>
                <ActivityIndicator color={colors.accentText} />
                <Text
                  style={[styles.muted, { color: colors.mutedForeground }]}
                >
                  Folheando o dicionário...
                </Text>
              </View>
            )}

            {status.kind === "not-found" && (
              <View style={styles.center}>
                <Ionicons
                  name="search-outline"
                  size={32}
                  color={colors.mutedForeground}
                />
                <Text
                  style={[styles.muted, { color: colors.mutedForeground }]}
                >
                  Não achei essa palavra. Confere a grafia?
                </Text>
              </View>
            )}

            {status.kind === "error" && (
              <View style={styles.center}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={32}
                  color={colors.coral}
                />
                <Text
                  style={[styles.muted, { color: colors.mutedForeground }]}
                >
                  A conexão fugiu. Tenta de novo daqui a pouco.
                </Text>
              </View>
            )}

            {/* ── Result ── */}
            {status.kind === "ready" && (
              <View style={styles.resultBox}>
                {/* Word + listen button */}
                <View style={styles.wordRow}>
                  <Text style={[styles.word, { color: colors.foreground }]}>
                    {status.lookup.word}
                  </Text>
                  <TouchableOpacity
                    onPress={handleListen}
                    style={[
                      styles.listenBtn,
                      {
                        backgroundColor: `${colors.volt}22`,
                        borderColor: colors.accentBorder,
                      },
                    ]}
                    accessibilityLabel="Ouvir pronúncia"
                  >
                    <Ionicons
                      name="volume-high"
                      size={18}
                      color={colors.accentText}
                    />
                    <Text
                      style={[
                        styles.listenText,
                        { color: colors.accentText },
                      ]}
                    >
                      Ouvir
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Phonetic */}
                {status.lookup.phonetic && (
                  <Text
                    style={[
                      styles.phonetic,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {status.lookup.phonetic}
                  </Text>
                )}

                {/* Part of speech */}
                {status.lookup.partOfSpeech && (
                  <Text
                    style={[
                      styles.partOfSpeech,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {status.lookup.partOfSpeech}
                  </Text>
                )}

                <View style={styles.divider} />

                {/* For EN: show Portuguese translation first */}
                {status.lookup.language === "en" && status.lookup.portuguese && (
                  <>
                    <Text
                      style={[
                        styles.label,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Tradução
                    </Text>
                    <Text
                      style={[
                        styles.translation,
                        { color: colors.foreground },
                      ]}
                    >
                      {status.lookup.portuguese}
                    </Text>
                  </>
                )}

                {/* For EN: English definition; for PT/ES: native definition */}
                {status.lookup.language === "en" ? (
                  status.lookup.englishDefinition ? (
                    <>
                      <Text
                        style={[
                          styles.label,
                          {
                            color: colors.mutedForeground,
                            marginTop: status.lookup.portuguese ? 12 : 0,
                          },
                        ]}
                      >
                        Definição em inglês
                      </Text>
                      <Text
                        style={[
                          styles.englishDef,
                          { color: colors.foreground },
                        ]}
                      >
                        {status.lookup.englishDefinition}
                      </Text>
                    </>
                  ) : null
                ) : (
                  <>
                    <Text
                      style={[
                        styles.label,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Significado
                    </Text>
                    <Text
                      style={[
                        styles.translation,
                        { color: colors.foreground },
                      ]}
                    >
                      {status.lookup.definition}
                    </Text>
                  </>
                )}

                {/* Examples */}
                {status.lookup.examples && status.lookup.examples.length > 0 && (
                  <>
                    <Text
                      style={[
                        styles.label,
                        {
                          color: colors.mutedForeground,
                          marginTop: 12,
                        },
                      ]}
                    >
                      Exemplos
                    </Text>
                    {status.lookup.examples.map((ex, i) => (
                      <Text
                        key={i}
                        style={[
                          styles.example,
                          { color: colors.foreground },
                        ]}
                      >
                        • {ex}
                      </Text>
                    ))}
                  </>
                )}

                {/* Save button */}
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saved}
                  style={[
                    styles.saveBtn,
                    {
                      backgroundColor: saved ? colors.border : colors.volt,
                    },
                  ]}
                >
                  <Ionicons
                    name={saved ? "checkmark-circle" : "bookmark"}
                    size={18}
                    color={
                      saved ? colors.mutedForeground : colors.accentForeground
                    }
                  />
                  <Text
                    style={[
                      styles.saveBtnText,
                      {
                        color: saved
                          ? colors.mutedForeground
                          : colors.accentForeground,
                      },
                    ]}
                  >
                    {saved ? "Guardado no caderninho" : "Guardar no vocabulário"}
                  </Text>
                </TouchableOpacity>

                {saved && (
                  <TouchableOpacity
                    onPress={() => {
                      setWord("");
                      setStatus({ kind: "idle" });
                      setSaved(false);
                    }}
                    style={styles.againBtn}
                  >
                    <Text
                      style={[styles.againText, { color: colors.accentText }]}
                    >
                      + Anotar outra palavra
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  scrollContent: {
    justifyContent: "flex-end",
    flexGrow: 1,
  },
  card: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 22,
    paddingBottom: 32,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  title: { fontSize: 20, fontWeight: "900" },
  sub: { fontSize: 13, marginTop: 2 },
  closeBtn: { padding: 4 },
  langRow: {
    flexDirection: "row",
    gap: 8,
  },
  langChip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  langChipText: {
    fontSize: 13,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "600",
  },
  searchBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 10,
  },
  muted: { fontSize: 13, textAlign: "center" },
  resultBox: { gap: 6 },
  wordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  word: { fontSize: 26, fontWeight: "900", flex: 1 },
  listenBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  listenText: { fontSize: 13, fontWeight: "800" },
  phonetic: { fontSize: 14, fontStyle: "italic" },
  partOfSpeech: { fontSize: 12, fontStyle: "italic", marginTop: -2 },
  divider: {
    height: 1,
    backgroundColor: "rgba(127,127,127,0.2)",
    marginVertical: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  translation: { fontSize: 22, fontWeight: "800", marginTop: 2 },
  englishDef: { fontSize: 14, lineHeight: 20, marginTop: 2 },
  example: { fontSize: 13, lineHeight: 18, marginTop: 2, fontStyle: "italic" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 18,
  },
  saveBtnText: { fontSize: 15, fontWeight: "900" },
  againBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
  againText: { fontSize: 14, fontWeight: "700" },
});
