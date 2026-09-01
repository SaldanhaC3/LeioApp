import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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

export default function ProfileSetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, refreshProfile } = useAuth();
  const [username, setUsername] = useState("");
  const [handle, setHandle] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function sanitizeHandle(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
  }

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  }

  async function uploadAvatar(userId: string): Promise<string | null> {
    if (!avatarUri) return null;
    try {
      const ext = avatarUri.split(".").pop() ?? "jpg";
      const path = `${userId}/avatar.${ext}`;
      const response = await fetch(avatarUri);
      const blob = await response.blob();
      const { error } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true });
      if (error) return null;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      return data.publicUrl;
    } catch {
      return null;
    }
  }

  async function handleSave() {
    if (!username.trim()) return Alert.alert("Erro", "Digite seu nome.");
    if (!handle.trim()) return Alert.alert("Erro", "Digite seu @handle.");
    if (!user) return;

    setSaving(true);
    try {
      const avatarUrl = await uploadAvatar(user.id);
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        username: username.trim(),
        handle: handle.trim(),
        avatar_url: avatarUrl,
        xp: 0,
        folego: 0,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        if (error.code === "23505") {
          Alert.alert("Erro", "Esse @handle já está em uso. Tente outro.");
        } else {
          Alert.alert("Erro", "Não foi possível salvar o perfil.");
        }
        return;
      }

      await refreshProfile();
      router.replace("/onboarding");
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.text }]}>Crie seu perfil</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Como os outros leitores vão te encontrar
        </Text>

        <TouchableOpacity style={styles.avatarContainer} onPress={pickAvatar}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.muted }]}>
              <Ionicons name="camera" size={32} color={colors.mutedForeground} />
            </View>
          )}
          <Text style={[styles.avatarLabel, { color: colors.accent }]}>Adicionar foto</Text>
        </TouchableOpacity>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Nome</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={username}
              onChangeText={setUsername}
              placeholder="Seu nome de leitor"
              placeholderTextColor={colors.mutedForeground}
              maxLength={40}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>@handle</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={handle}
              onChangeText={(t) => setHandle(sanitizeHandle(t))}
              placeholder="seu_handle"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.foreground, opacity: saving ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Começar</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    gap: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    marginTop: -16,
  },
  avatarContainer: {
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
