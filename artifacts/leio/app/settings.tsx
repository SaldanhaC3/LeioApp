import { CapiMascot } from "@/components/CapiMascot";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { CapiVariant } from "@/contexts/AppContext";

const CAPI_VARIANTS: Array<{ id: CapiVariant; label: string; desc: string }> = [
  { id: "default", label: "Capi Padrão", desc: "A capivara fofa original" },
  { id: "vampire", label: "Capi Vampira", desc: "Para os amantes do terror" },
  { id: "erudite", label: "Capi Erudita", desc: "Para os leitores de clássicos" },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useApp();

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  function handleDeleteAccount() {
    Alert.alert(
      "Excluir conta",
      "Isso vai apagar todos os seus dados permanentemente. Sem julgamento, mas tem certeza?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir tudo",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Alert.alert("Dados removidos", "Sua conta foi excluída. Que pena ter te perdido!");
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topInset + 16, paddingBottom: 100 + bottomInset },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={colors.foreground} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.foreground }]}>
        Configurações
      </Text>

      {/* Capi Variant */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Variante da Capi
        </Text>
        {CAPI_VARIANTS.map((variant) => (
          <TouchableOpacity
            key={variant.id}
            style={[
              styles.variantRow,
              {
                backgroundColor:
                  settings.capiVariant === variant.id
                    ? `${colors.volt}15`
                    : colors.card,
                borderColor:
                  settings.capiVariant === variant.id
                    ? colors.volt
                    : colors.border,
              },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              updateSettings({ capiVariant: variant.id });
            }}
          >
            <CapiMascot
              variant={variant.id}
              state="waving"
              size={52}
            />
            <View style={styles.variantInfo}>
              <Text style={[styles.variantLabel, { color: colors.foreground }]}>
                {variant.label}
              </Text>
              <Text style={[styles.variantDesc, { color: colors.mutedForeground }]}>
                {variant.desc}
              </Text>
            </View>
            {settings.capiVariant === variant.id && (
              <Ionicons name="checkmark-circle" size={22} color={colors.volt} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Sound */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Audio
        </Text>
        <View style={[styles.toggleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View>
            <Text style={[styles.toggleLabel, { color: colors.foreground }]}>
              Efeitos sonoros
            </Text>
            <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>
              Sons de virada de página, badges, etc.
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.toggle,
              {
                backgroundColor: settings.soundEffects
                  ? colors.volt
                  : colors.secondary,
              },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              updateSettings({ soundEffects: !settings.soundEffects });
            }}
          >
            <View
              style={[
                styles.toggleThumb,
                {
                  backgroundColor: settings.soundEffects
                    ? colors.accentForeground
                    : colors.mutedForeground,
                  transform: [
                    { translateX: settings.soundEffects ? 20 : 2 },
                  ],
                },
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Notificações
        </Text>
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="notifications-outline" size={20} color={colors.volt} />
          <View style={styles.infoText}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>
              Lembrete diário
            </Text>
            <Text style={[styles.infoSub, { color: colors.mutedForeground }]}>
              Configurado para {settings.notificationTime} BRT
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        </View>
      </View>

      {/* LGPD */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Seus dados
        </Text>
        <TouchableOpacity
          style={[styles.actionRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => Alert.alert("Em breve", "A exportação de dados estará disponível em breve!")}
        >
          <Ionicons name="download-outline" size={20} color={colors.foreground} />
          <Text style={[styles.actionText, { color: colors.foreground }]}>
            Exportar meus dados
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionRow, { backgroundColor: colors.card, borderColor: `${colors.destructive}44` }]}
          onPress={handleDeleteAccount}
        >
          <Ionicons name="trash-outline" size={20} color={colors.destructive} />
          <Text style={[styles.actionText, { color: colors.destructive }]}>
            Excluir minha conta
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      {/* About */}
      <View style={styles.about}>
        <Text style={[styles.aboutText, { color: colors.mutedForeground }]}>
          Leio v1.0.0 · Feito com carinho (e muito café)
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  backBtn: { marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "900", letterSpacing: -1, marginBottom: 28 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 12, letterSpacing: -0.3 },
  variantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 10,
  },
  variantInfo: { flex: 1 },
  variantLabel: { fontSize: 15, fontWeight: "700" },
  variantDesc: { fontSize: 12, marginTop: 2 },
  toggleCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  toggleLabel: { fontSize: 15, fontWeight: "600" },
  toggleSub: { fontSize: 12, marginTop: 2 },
  toggle: {
    width: 46,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  infoText: { flex: 1 },
  infoTitle: { fontSize: 15, fontWeight: "600" },
  infoSub: { fontSize: 12, marginTop: 2 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  actionText: { flex: 1, fontSize: 15, fontWeight: "600" },
  about: { alignItems: "center", paddingTop: 20 },
  aboutText: { fontSize: 12, textAlign: "center" },
});
