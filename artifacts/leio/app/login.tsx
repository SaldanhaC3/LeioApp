import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch {
      Alert.alert("Erro", "Não foi possível entrar com Google. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={[colors.background, colors.card]}
      style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
    >
      <View style={styles.header}>
        <Text style={[styles.logo, { color: colors.foreground }]}>leio</Text>
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
          sua biblioteca pessoal
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.googleButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleGoogleSignIn}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color={colors.text} />
              <Text style={[styles.googleButtonText, { color: colors.text }]}>
                Entrar com Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          Ao entrar, você concorda com os nossos termos de uso.
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  header: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    fontSize: 64,
    fontFamily: "Inter_700Bold",
    letterSpacing: -2,
  },
  tagline: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
  },
  footer: {
    gap: 16,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  googleButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  disclaimer: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
});
