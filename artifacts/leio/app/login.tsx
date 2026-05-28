import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
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

  const pt = insets.top + (Platform.OS === "web" ? 40 : 0);
  const pb = insets.bottom + 24;

  async function handleGoogle() {
    setLoading(true);
    try {
      await signInWithGoogle();
    } finally {
      setLoading(false);
    }
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: pt, paddingBottom: pb },
      ]}
    >
      <View style={styles.logoBlock}>
        <Text style={[styles.logo, { color: colors.volt }]}>Leio</Text>
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
          Sua jornada literária{"\n"}começa aqui.
        </Text>
      </View>

      <View style={styles.middle}>
        <Text style={[styles.headline, { color: colors.foreground }]}>
          Leia mais.{"\n"}Lembre mais.{"\n"}Compartilhe mais.
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Sessões, biblioteca e grupos sincronizados na nuvem.
        </Text>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.googleBtn, { backgroundColor: colors.volt }]}
          onPress={handleGoogle}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.accentForeground} />
          ) : (
            <>
              <View
                style={[
                  styles.gIcon,
                  { backgroundColor: colors.accentForeground },
                ]}
              >
                <Text style={[styles.gText, { color: colors.volt }]}>G</Text>
              </View>
              <Text
                style={[
                  styles.googleBtnText,
                  { color: colors.accentForeground },
                ]}
              >
                Entrar com Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.tos, { color: colors.mutedForeground }]}>
          Ao entrar, você aceita nossos Termos de Uso e Política de
          Privacidade.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 28 },
  logoBlock: { flex: 0, paddingTop: 24 },
  logo: { fontSize: 52, fontWeight: "900", letterSpacing: -2 },
  tagline: { fontSize: 16, marginTop: 6, lineHeight: 22 },
  middle: { flex: 1, justifyContent: "center" },
  headline: {
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 44,
    marginBottom: 16,
  },
  sub: { fontSize: 16, lineHeight: 22 },
  bottom: { gap: 16 },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderRadius: 16,
    paddingVertical: 18,
  },
  gIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  gText: { fontSize: 15, fontWeight: "900" },
  googleBtnText: { fontSize: 17, fontWeight: "800" },
  tos: { fontSize: 11, textAlign: "center", lineHeight: 16 },
});
