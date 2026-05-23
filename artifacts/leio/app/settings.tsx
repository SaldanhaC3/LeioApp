import { CapiMascot } from "@/components/CapiMascot";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import {
  cancelAllReminders,
  requestNotificationPermission,
  scheduleDailyReminder,
} from "@/services/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
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

const NOTIF_ENABLED_KEY = "leio:notifications-enabled";

function SpotifySection() {
  const colors = useColors();
  const {
    spotifyEnabled,
    spotifyConnected,
    connectSpotify,
    disconnectSpotify,
  } = useApp();
  const [busy, setBusy] = useState(false);

  if (!spotifyEnabled) {
    return (
      <View
        style={[
          styles.toggleCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.toggleLabel, { color: colors.foreground }]}>
            Spotify desligado
          </Text>
          <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>
            Configure EXPO_PUBLIC_SPOTIFY_CLIENT_ID pra deixar a Capi dançar conforme a música.
          </Text>
        </View>
      </View>
    );
  }

  async function handleConnect() {
    if (busy) return;
    Haptics.selectionAsync();
    setBusy(true);
    const ok = await connectSpotify();
    setBusy(false);
    if (!ok) {
      Alert.alert(
        "Deu ruim",
        "O Spotify não atendeu. Tenta de novo daqui a pouco."
      );
    }
  }

  async function handleDisconnect() {
    if (busy) return;
    Alert.alert(
      "Desligar Spotify",
      "A Capi vai parar de reagir à sua trilha. Topa?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desconectar",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            await disconnectSpotify();
            setBusy(false);
          },
        },
      ]
    );
  }

  return (
    <View
      style={[
        styles.toggleCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={[styles.toggleLabel, { color: colors.foreground }]}>
          Spotify {spotifyConnected ? "conectado" : ""}
        </Text>
        <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>
          {spotifyConnected
            ? "A Capi dança conforme a música durante a leitura."
            : "Deixa o clima da sessão acompanhar sua trilha."}
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.spotifyBtn,
          {
            backgroundColor: spotifyConnected ? colors.secondary : colors.volt,
            opacity: busy ? 0.5 : 1,
          },
        ]}
        onPress={spotifyConnected ? handleDisconnect : handleConnect}
        disabled={busy}
      >
        <Text
          style={[
            styles.spotifyBtnText,
            {
              color: spotifyConnected
                ? colors.foreground
                : colors.accentForeground,
            },
          ]}
        >
          {spotifyConnected ? "Desconectar" : "Conectar"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const CAPI_VARIANTS: Array<{ id: CapiVariant; label: string; desc: string }> = [
  { id: "default", label: "Capi Padrão", desc: "A capivara original — sem firula" },
  { id: "vampire", label: "Capi Vampira", desc: "Para noites longas com Stoker e Anne Rice" },
  { id: "erudite", label: "Capi Erudita", desc: "Pra quem só lê com Machado debaixo do braço" },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, folego } = useApp();
  const [notifEnabled, setNotifEnabled] = useState(false);

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  useEffect(() => {
    AsyncStorage.getItem(NOTIF_ENABLED_KEY)
      .then((val) => setNotifEnabled(val === "true"))
      .catch(() => undefined);
  }, []);

  function parseNotifTime(): { hour: number; minute: number } {
    const [h, m] = (settings.notificationTime ?? "19:00")
      .split(":")
      .map((v) => parseInt(v, 10));
    return {
      hour: Number.isFinite(h) ? h : 19,
      minute: Number.isFinite(m) ? m : 0,
    };
  }

  async function handleToggleNotifications() {
    Haptics.selectionAsync();
    if (Platform.OS === "web") {
      Alert.alert(
        "Só no celular",
        "Notificações locais não rolam no navegador. Abre o Leio no celular pra ligar."
      );
      return;
    }
    if (!notifEnabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          "Permissão negada",
          "Sem permissão, a Capi fica muda. Libera nas configurações do sistema."
        );
        return;
      }
      const { hour, minute } = parseNotifTime();
      await scheduleDailyReminder(hour, minute, folego);
      await AsyncStorage.setItem(NOTIF_ENABLED_KEY, "true");
      setNotifEnabled(true);
    } else {
      await cancelAllReminders();
      await AsyncStorage.setItem(NOTIF_ENABLED_KEY, "false");
      setNotifEnabled(false);
    }
  }

  function handleChangeTime() {
    Haptics.selectionAsync();
    if (Platform.OS === "web") {
      const input = window.prompt(
        "Que horas a Capi te cutuca? (HH:MM)",
        settings.notificationTime ?? "19:00"
      );
      if (input) applyNewTime(input);
      return;
    }
    Alert.prompt?.(
      "Mudar horário",
      "Que horas a Capi te lembra? Use HH:MM",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salvar",
          onPress: (value?: string) => {
            if (value) applyNewTime(value);
          },
        },
      ],
      "plain-text",
      settings.notificationTime ?? "19:00"
    );
  }

  async function applyNewTime(value: string) {
    const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) {
      Alert.alert("Horário esquisito", "Vai no formato HH:MM (ex: 19:00).");
      return;
    }
    const hour = Math.min(23, Math.max(0, parseInt(match[1], 10)));
    const minute = Math.min(59, Math.max(0, parseInt(match[2], 10)));
    const formatted = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    updateSettings({ notificationTime: formatted });
    if (notifEnabled && Platform.OS !== "web") {
      await scheduleDailyReminder(hour, minute, folego);
    }
  }

  function handleDeleteAccount() {
    Alert.alert(
      "Apagar conta",
      "Vai sumir com tudo — dados, livros, conquistas. Sem volta, tipo Bentinho na lápide. Certeza?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir tudo",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Alert.alert("Dados embora", "Conta apagada. Vai fazer falta — volta quando quiser.");
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

      {/* Tema */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Tema
        </Text>
        <View style={styles.themeRow}>
          {([
            { id: "light", label: "Papel", desc: "Claro feito manhã de Drummond", bg: "#F6EFE0", fg: "#2A2118", border: "#DCCFB1" },
            { id: "dark", label: "Couro", desc: "Escuro como capa de clássico", bg: "#14110D", fg: "#F2EBDA", border: "#3A2F22" },
          ] as const).map((opt) => {
            const active = settings.theme === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.themeCard,
                  {
                    borderColor: active ? colors.accentBorder : colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  updateSettings({ theme: opt.id });
                }}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.themeSwatch,
                    { backgroundColor: opt.bg, borderColor: opt.border },
                  ]}
                >
                  <Text style={[styles.themeSwatchA, { color: opt.fg }]}>Aa</Text>
                  <View style={[styles.themeSwatchDot, { backgroundColor: colors.volt }]} />
                </View>
                <Text style={[styles.themeLabel, { color: colors.foreground }]}>{opt.label}</Text>
                <Text style={[styles.themeDesc, { color: colors.mutedForeground }]}>{opt.desc}</Text>
                {active && (
                  <View style={[styles.themeCheck, { backgroundColor: colors.volt }]}>
                    <Ionicons name="checkmark" size={14} color={colors.accentForeground} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

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
                    ? colors.accentBorder
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
              <Ionicons name="checkmark-circle" size={22} color={colors.accentText} />
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
Página virando, conquista batendo, esse tipo de coisa.
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
        <View
          style={[
            styles.toggleCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={[styles.toggleLabel, { color: colors.foreground }]}>
              Lembretes diários
            </Text>
            <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>
Capi te cutuca todo dia às {settings.notificationTime ?? "19:00"} — sem charme
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.toggle,
              {
                backgroundColor: notifEnabled ? colors.volt : colors.secondary,
              },
            ]}
            onPress={handleToggleNotifications}
          >
            <View
              style={[
                styles.toggleThumb,
                {
                  backgroundColor: notifEnabled
                    ? colors.accentForeground
                    : colors.mutedForeground,
                  transform: [{ translateX: notifEnabled ? 20 : 2 }],
                },
              ]}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[
            styles.actionRow,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              marginTop: 10,
              opacity: notifEnabled ? 1 : 0.6,
            },
          ]}
          onPress={handleChangeTime}
          disabled={!notifEnabled}
        >
          <Ionicons name="time-outline" size={20} color={colors.foreground} />
          <Text style={[styles.actionText, { color: colors.foreground }]}>
            Alterar horário
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.mutedForeground}
          />
        </TouchableOpacity>
      </View>

      {/* Spotify */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Trilha sonora
        </Text>
        <SpotifySection />
      </View>

      {/* LGPD */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Seus dados
        </Text>
        <TouchableOpacity
          style={[styles.actionRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => Alert.alert("Em breve", "A exportação de dados tá no forno. Espera o próximo capítulo.")}
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
Leio v1.0.0 · Feito com café preto e marcador de página
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
  spotifyBtn: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  spotifyBtnText: { fontSize: 13, fontWeight: "800" },
  about: { alignItems: "center", paddingTop: 20 },
  aboutText: { fontSize: 12, textAlign: "center" },
  themeRow: { flexDirection: "row", gap: 12 },
  themeCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    alignItems: "flex-start",
    gap: 8,
    position: "relative",
  },
  themeSwatch: {
    width: "100%",
    height: 64,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  themeSwatchA: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  themeSwatchDot: { width: 12, height: 12, borderRadius: 6 },
  themeLabel: { fontSize: 15, fontWeight: "700" },
  themeDesc: { fontSize: 12 },
  themeCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
});
