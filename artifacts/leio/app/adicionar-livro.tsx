import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Option = {
  key: "search" | "scan" | "manual";
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: "/buscar-livro" | "/escanear-livro" | "/livro-manual";
};

const OPTIONS: Option[] = [
  {
    key: "search",
    title: "Buscar pelo nome",
    description: "Pesquisa no acervo da Open Library e adiciona com um toque.",
    icon: "search",
    href: "/buscar-livro",
  },
  {
    key: "scan",
    title: "Mirar o código de barras",
    description: "Aponta a câmera pro ISBN da contracapa e pronto.",
    icon: "barcode-outline",
    href: "/escanear-livro",
  },
  {
    key: "manual",
    title: "Cadastrar na mão",
    description: "Tira uma foto da capa e preenche os campos. Trabalho de bibliotecário.",
    icon: "create-outline",
    href: "/livro-manual",
  },
];

export default function AdicionarLivroScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  function go(opt: Option) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(opt.href);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Novo livro na estante</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={[styles.subtitle, { color: colors.muted }]}>Por qual caminho vamos?</Text>

      <View style={styles.list}>
        {OPTIONS.map((opt) => (
          <Pressable
            key={opt.key}
            onPress={() => go(opt)}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.volt + "22" }]}>
              <Ionicons name={opt.icon} size={26} color={colors.foreground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>{opt.title}</Text>
              <Text style={[styles.cardDesc, { color: colors.muted }]}>{opt.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>
        ))}
      </View>

      {Platform.OS === "web" && (
        <Text style={[styles.webNote, { color: colors.muted }]}>
O escâner e a câmera funcionam direito mesmo é no app instalado no celular.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: "700" },
  subtitle: { marginTop: 20, fontSize: 14 },
  list: { marginTop: 16, gap: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardDesc: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  webNote: { marginTop: 24, fontSize: 12, textAlign: "center", lineHeight: 16 },
});
