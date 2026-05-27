import { useBookGroup } from "@/contexts/BookGroupContext";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
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

const PHOTO_SUGGESTIONS = ["mesa do café", "cama", "transporte", "sofá", "jardim"];

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
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const alreadyCheckedIn = hasCheckedInToday(groupId ?? "");

  async function handlePickPhoto(useCamera: boolean) {
    Haptics.selectionAsync();
    try {
      let result: ImagePicker.ImagePickerResult;
      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Permissão negada", "Precisamos de acesso à câmera para tirar a foto.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: "images",
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.75,
        });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Permissão negada", "Precisamos de acesso à galeria para escolher a foto.");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: "images",
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.75,
        });
      }
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Erro", "Não foi possível acessar a câmera ou galeria.");
    }
  }

  function handlePhotoOptions() {
    Alert.alert(
      "Adicionar foto",
      "Onde você quer buscar a foto?",
      [
        { text: "Câmera", onPress: () => handlePickPhoto(true) },
        { text: "Galeria", onPress: () => handlePickPhoto(false) },
        { text: "Cancelar", style: "cancel" },
      ]
    );
  }

  async function copyPhotoToDocuments(uri: string): Promise<string | null> {
    if (Platform.OS === "web") return uri;
    try {
      const filename = `checkin_${Date.now()}.jpg`;
      const dest = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.copyAsync({ from: uri, to: dest });
      return dest;
    } catch {
      return uri;
    }
  }

  async function handleSubmit() {
    const pagesNum = parseInt(pages, 10);
    if (!pagesNum || pagesNum <= 0) {
      Alert.alert("Páginas inválidas", "Informe quantas páginas você leu.");
      return;
    }
    if (!mood) {
      Alert.alert("Selecione um humor", "Como foi a leitura hoje?");
      return;
    }

    let savedPhotoUri: string | undefined;
    if (photoUri) {
      savedPhotoUri = (await copyPhotoToDocuments(photoUri)) ?? undefined;
    }

    addCheckIn(groupId ?? "", {
      pagesRead: pagesNum,
      mood,
      comment: comment.trim() || undefined,
      bookTitle: bookTitle.trim() || undefined,
      groupId: groupId ?? "",
      photoUri: savedPhotoUri,
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

        {/* Foto do check-in */}
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
          Foto da leitura (opcional)
        </Text>
        <View style={[styles.photoPromptCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.photoPromptTitle, { color: colors.foreground }]}>
            Mostra pra gente onde você tá lendo hoje 📸
          </Text>
          <Text style={[styles.photoPromptSub, { color: colors.mutedForeground }]}>
            {PHOTO_SUGGESTIONS.join(" · ")}
          </Text>
        </View>

        {photoUri ? (
          <View style={styles.photoPreviewWrap}>
            <Image
              source={{ uri: photoUri }}
              style={styles.photoPreview}
              contentFit="cover"
            />
            <TouchableOpacity
              style={[styles.removePhotoBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                Haptics.selectionAsync();
                setPhotoUri(null);
              }}
            >
              <Ionicons name="close" size={16} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addPhotoBtn, { backgroundColor: `${colors.volt}11`, borderColor: colors.accentBorder }]}
            onPress={handlePhotoOptions}
            activeOpacity={0.8}
          >
            <View style={[styles.addPhotoIcon, { backgroundColor: colors.volt }]}>
              <Ionicons name="camera" size={18} color={colors.accentForeground} />
            </View>
            <Text style={[styles.addPhotoBtnText, { color: colors.foreground }]}>
              Adicionar foto
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}

        {/* Comment */}
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 16 }]}>
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
  charCount: { fontSize: 11, textAlign: "right", marginBottom: 4 },
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
  photoPromptCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 4,
  },
  photoPromptTitle: { fontSize: 14, fontWeight: "700" },
  photoPromptSub: { fontSize: 12 },
  addPhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 4,
  },
  addPhotoIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoBtnText: { flex: 1, fontSize: 15, fontWeight: "700" },
  photoPreviewWrap: {
    position: "relative",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 4,
    height: 180,
  },
  photoPreview: {
    width: "100%",
    height: "100%",
  },
  removePhotoBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
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
