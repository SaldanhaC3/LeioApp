import { useBookGroup } from "@/contexts/BookGroupContext";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Mood = "amei" | "bem" | "ok" | "difícil";

const MOODS: { value: Mood; label: string; emoji: string }[] = [
  { value: "amei", label: "Amei!", emoji: "🤩" },
  { value: "bem", label: "Bem", emoji: "😊" },
  { value: "ok", label: "OK", emoji: "😐" },
  { value: "difícil", label: "Difícil", emoji: "😓" },
];

export default function CheckInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { groupId, pages: pagesParam } = useLocalSearchParams<{
    groupId: string;
    pages?: string;
  }>();

  const { getGroupById, addCheckIn, hasCheckedInToday } = useBookGroup();
  const group = getGroupById(groupId ?? "");

  const [pages, setPages] = useState(pagesParam ?? "");
  const [mood, setMood] = useState<Mood | null>(null);
  const [bookTitle, setBookTitle] = useState(group?.currentBook ?? "");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const alreadyCheckedIn = hasCheckedInToday(groupId ?? "");

  function handleSubmit() {
    const pagesNum = parseInt(pages, 10);
    if (!pagesNum || pagesNum <= 0) {
      Alert.alert("Páginas inválidas", "Informe quantas páginas você leu.");
      return;
    }
    if (!mood) {
      Alert.alert("Selecione um humor", "Como foi a leitura hoje?");
      return;
    }

    addCheckIn(groupId ?? "", {
      pagesRead: pagesNum,
      mood,
      comment: comment.trim() || undefined,
      bookTitle: bookTitle.trim() || undefined,
      groupId: groupId ?? "",
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitted(true);

    setTimeout(() => {
      router.back();
    }, 1400);
  }

  const topPad = topInset + 16;
  const bottomPad = bottomInset + 16;

  if (submitted) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: topPad,
            paddingBottom: bottomPad,
            paddingHorizontal: 24,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text style={styles.successEmoji}>🎉</Text>
        <Text style={[styles.successTitle, { color: colors.foreground }]}>
          Check-in feito!
        </Text>
        <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
          Seu progresso foi registrado no grupo.
        </Text>
      </View>
    );
  }

  if (!group) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: topPad,
            paddingHorizontal: 24,
          },
        ]}
      >
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={colors.foreground} />
          <Text style={[styles.backText, { color: colors.foreground }]}>Voltar</Text>
        </TouchableOpacity>
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Grupo não encontrado.</Text>
      </View>
    );
  }

  if (alreadyCheckedIn) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: topPad,
            paddingBottom: bottomPad,
            paddingHorizontal: 24,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text style={styles.successEmoji}>✅</Text>
        <Text style={[styles.successTitle, { color: colors.foreground }]}>
          Já feito hoje!
        </Text>
        <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
          Você já registrou seu check-in de hoje neste grupo.
        </Text>
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: colors.border }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={[styles.backBtnText, { color: colors.foreground }]}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{
          paddingTop: topPad,
          paddingBottom: bottomPad,
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={colors.foreground} />
          <Text style={[styles.backText, { color: colors.foreground }]}>Cancelar</Text>
        </TouchableOpacity>

        <View style={styles.titleBlock}>
          <Text style={styles.groupEmoji}>{group.emoji}</Text>
          <View>
            <Text style={[styles.pageTitle, { color: colors.foreground }]}>Check-in diário</Text>
            <Text style={[styles.groupName, { color: colors.mutedForeground }]}>{group.name}</Text>
          </View>
        </View>

        {/* Páginas */}
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
          Quantas páginas você leu hoje? *
        </Text>
        <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.pagesInput, { color: colors.foreground }]}
            placeholder="0"
            placeholderTextColor={colors.mutedForeground}
            value={pages}
            onChangeText={(t) => setPages(t.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            maxLength={4}
          />
          <Text style={[styles.pagesUnit, { color: colors.mutedForeground }]}>págs</Text>
        </View>

        {/* Mood */}
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
          Como foi a leitura? *
        </Text>
        <View style={styles.moodGrid}>
          {MOODS.map((m) => (
            <TouchableOpacity
              key={m.value}
              style={[
                styles.moodBtn,
                {
                  borderColor: mood === m.value ? colors.volt : colors.border,
                  backgroundColor:
                    mood === m.value ? `${colors.volt}20` : colors.card,
                },
              ]}
              onPress={() => {
                setMood(m.value);
                Haptics.selectionAsync();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.moodBtnEmoji}>{m.emoji}</Text>
              <Text
                style={[
                  styles.moodBtnLabel,
                  {
                    color: mood === m.value ? colors.accentText : colors.mutedForeground,
                  },
                ]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Book Title */}
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
          Qual livro? (opcional)
        </Text>
        <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Título do livro..."
            placeholderTextColor={colors.mutedForeground}
            value={bookTitle}
            onChangeText={setBookTitle}
            maxLength={100}
          />
        </View>

        {/* Comment */}
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
          Deixa uma mensagem pro grupo (opcional)
        </Text>
        <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.textArea, { color: colors.foreground }]}
            placeholder="Conta como foi a leitura..."
            placeholderTextColor={colors.mutedForeground}
            value={comment}
            onChangeText={(t) => setComment(t.slice(0, 140))}
            multiline
            numberOfLines={4}
            maxLength={140}
          />
        </View>
        <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
          {comment.length}/140
        </Text>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.volt }]}
          onPress={handleSubmit}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-circle-outline" size={22} color={colors.accentForeground} />
          <Text style={[styles.submitBtnText, { color: colors.accentForeground }]}>
            Fazer check-in
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 24 },
  backText: { fontSize: 16, fontWeight: "600" },
  errorText: { fontSize: 16, textAlign: "center", marginTop: 40 },
  titleBlock: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 28 },
  groupEmoji: { fontSize: 40 },
  pageTitle: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  groupName: { fontSize: 13, marginTop: 2 },
  fieldLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  inputWrap: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 4,
  },
  pagesInput: { fontSize: 32, fontWeight: "900", paddingVertical: 12, textAlign: "center" },
  pagesUnit: { textAlign: "center", fontSize: 13, paddingBottom: 8 },
  input: { fontSize: 15, paddingVertical: 12 },
  textArea: { fontSize: 15, paddingVertical: 12, minHeight: 90, textAlignVertical: "top" },
  charCount: { fontSize: 11, textAlign: "right", marginBottom: 16 },
  moodGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  moodBtn: {
    flex: 1,
    minWidth: "20%",
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  moodBtnEmoji: { fontSize: 28 },
  moodBtnLabel: { fontSize: 12, fontWeight: "700" },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 8,
  },
  submitBtnText: { fontSize: 17, fontWeight: "900" },
  successEmoji: { fontSize: 72, marginBottom: 16 },
  successTitle: { fontSize: 26, fontWeight: "900", textAlign: "center", letterSpacing: -0.5 },
  successSub: { fontSize: 15, textAlign: "center", marginTop: 8, lineHeight: 22 },
  backBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 24,
  },
  backBtnText: { fontSize: 16, fontWeight: "700" },
});
