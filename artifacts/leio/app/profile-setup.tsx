import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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

export default function ProfileSetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateProfile, uploadAvatar } = useAuth();

  const [username, setUsername] = useState(user?.username ?? "");
  const [handle, setHandle] = useState(user?.handle ?? "");
  const [avatarUri, setAvatarUri] = useState<string | null>(
    user?.avatarUrl ?? null
  );
  const [loading, setLoading] = useState(false);
  const [handleError, setHandleError] = useState<string | null>(null);

  const pt = insets.top + (Platform.OS === "web" ? 40 : 0);
  const pb = insets.bottom + 24;

  function autoHandle(name: string) {
    return name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 20);
  }

  function onUsernameChange(val: string) {
    setUsername(val);
    if (!handle || handle === autoHandle(username)) {
      setHandle(autoHandle(val));
    }
  }

  function validateHandle(val: string): string | null {
    if (val.length < 3) return "Mínimo 3 caracteres";
    if (val.length > 20) return "Máximo 20 caracteres";
    if (!/^[a-z0-9_]+$/.test(val)) return "Apenas letras minúsculas, números e _";
    return null;
  }

  async function pickImage(source: "camera" | "gallery") {
    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    };
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts);
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  function handlePickPhoto() {
    Alert.alert("Foto de perfil", "Escolha uma opção", [
      { text: "Tirar foto", onPress: () => pickImage("camera") },
      { text: "Galeria", onPress: () => pickImage("gallery") },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  async function handleSave() {
    const err = validateHandle(handle);
    if (err) {
      setHandleError(err);
      return;
    }
    if (!username.trim()) {
      Alert.alert("Nome obrigatório", "Informe seu nome de usuário.");
      return;
    }

    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("handle", handle.toLowerCase())
        .neq("id", user?.id ?? "")
        .maybeSingle();

      if (existing) {
        setHandleError("Este handle já está em uso");
        return;
      }

      let avatarUrl = user?.avatarUrl ?? null;
      if (avatarUri && avatarUri !== user?.avatarUrl) {
        avatarUrl = await uploadAvatar(avatarUri);
      }

      const { error } = await updateProfile({
        username: username.trim(),
        handle: handle.toLowerCase(),
        ...(avatarUrl !== null && { avatarUrl }),
      });

      if (error) {
        Alert.alert("Erro", error);
      } else {
        router.replace("/(tabs)");
      }
    } finally {
      setLoading(false);
    }
  }

  const initials = (username || "L").slice(0, 1).toUpperCase();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{
          paddingTop: pt,
          paddingBottom: pb,
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          Seu perfil
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Como você quer ser visto no Leio?
        </Text>

        {/* Avatar picker */}
        <TouchableOpacity style={styles.avatarWrap} onPress={handlePickPhoto}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarFallback,
                { backgroundColor: colors.volt },
              ]}
            >
              <Text
                style={[
                  styles.avatarInitial,
                  { color: colors.accentForeground },
                ]}
              >
                {initials}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.avatarOverlay,
              { backgroundColor: "rgba(0,0,0,0.45)" },
            ]}
          >
            <Ionicons name="camera-outline" size={22} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Username */}
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          NOME
        </Text>
        <View
          style={[
            styles.inputWrap,
            { borderColor: colors.border, backgroundColor: colors.card },
          ]}
        >
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Seu nome..."
            placeholderTextColor={colors.mutedForeground}
            value={username}
            onChangeText={onUsernameChange}
            maxLength={50}
            autoCapitalize="words"
          />
        </View>

        {/* Handle */}
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          HANDLE
        </Text>
        <View
          style={[
            styles.inputWrap,
            {
              borderColor: handleError ? colors.destructive : colors.border,
              backgroundColor: colors.card,
            },
          ]}
        >
          <Text style={[styles.atSign, { color: colors.mutedForeground }]}>
            @
          </Text>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="seu_handle"
            placeholderTextColor={colors.mutedForeground}
            value={handle}
            onChangeText={(v) => {
              setHandle(v.toLowerCase().replace(/[^a-z0-9_]/g, ""));
              setHandleError(null);
            }}
            maxLength={20}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        {handleError && (
          <Text style={[styles.error, { color: colors.destructive }]}>
            {handleError}
          </Text>
        )}

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.volt }]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.accentForeground} />
          ) : (
            <Text
              style={[styles.saveBtnText, { color: colors.accentForeground }]}
            >
              Continuar
            </Text>
          )}
        </TouchableOpacity>

        {/* Skip */}
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
            Pular por agora
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "900", letterSpacing: -0.5, marginBottom: 8 },
  sub: { fontSize: 15, marginBottom: 32 },
  avatarWrap: {
    alignSelf: "center",
    marginBottom: 32,
    position: "relative",
  },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarFallback: { justifyContent: "center", alignItems: "center" },
  avatarInitial: { fontSize: 36, fontWeight: "900" },
  avatarOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
  },
  inputWrap: {
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  atSign: { fontSize: 16, fontWeight: "600", marginRight: 4 },
  input: { flex: 1, fontSize: 16, paddingVertical: 14 },
  error: { fontSize: 12, marginTop: -12, marginBottom: 8 },
  saveBtn: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: { fontSize: 17, fontWeight: "800" },
  skipBtn: { paddingVertical: 16, alignItems: "center" },
  skipText: { fontSize: 14 },
});
