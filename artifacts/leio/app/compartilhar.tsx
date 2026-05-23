import { BadgeToast } from "@/components/BadgeToast";
import { CapiMascot } from "@/components/CapiMascot";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  SHARE_TEMPLATES,
  ShareCard,
  type ShareTemplateId,
} from "@/components/ShareCard";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { useStatPreferences } from "@/hooks/useStatPreferences";
import { ALL_STATS } from "@/utils/statPreferences";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef, type ViewShotRef } from "react-native-view-shot";

const SHARE_PHRASES = [
  "Mais um livro pra coleção do Capi.",
  "Cabeça cheia, copo vazio (de cerveja).",
  "Lendo igual gente grande.",
  "O algoritmo chora, eu leio.",
  "Menos scroll, mais página virada.",
  "Capi aprovou essa sessão.",
  "Tô construindo um cérebro melhor, devagarinho.",
  "Hoje o foco venceu o feed.",
  "Página por página, vou virando outra pessoa.",
  "Leitura concluída. Ego inflado.",
];

const isWeb = Platform.OS === "web";

export default function CompartilharScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    bookId: string;
    pages: string;
    durationSeconds: string;
    pace: string;
  }>();
  const { getBookById, progressShareMission, folego } = useApp();
  const { selected: selectedStats, toggle: toggleStat } = useStatPreferences();

  const book = getBookById(params.bookId ?? "");
  const pages = parseInt(params.pages ?? "0", 10);
  const duration = parseInt(params.durationSeconds ?? "0", 10);
  const pace = parseFloat(params.pace ?? "0");
  const percentComplete =
    book && book.totalPages > 0
      ? (book.currentPage / book.totalPages) * 100
      : 0;

  const [template, setTemplate] = useState<ShareTemplateId>("storiesPhoto");
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("back");
  const [statsSheetOpen, setStatsSheetOpen] = useState(false);
  const [badgeToastVisible, setBadgeToastVisible] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const shareCardRef = useRef<ViewShotRef>(null);
  const hasSharedThisSession = useRef(false);

  const motivationalPhrase = useMemo(
    () => SHARE_PHRASES[Math.floor(Math.random() * SHARE_PHRASES.length)],
    []
  );

  const topInset = insets.top + (isWeb ? 67 : 0);
  const bottomInset = insets.bottom + (isWeb ? 34 : 0);

  const captureCard = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 80));
    return await captureRef(shareCardRef, { format: "png", quality: 1 });
  }, []);

  const handleTakePhoto = useCallback(async () => {
    Haptics.selectionAsync();
    if (isWeb) {
      Alert.alert("Disponível no app", "A câmera funciona só no app iOS/Android.");
      return;
    }
    if (!cameraPermission?.granted) {
      const res = await requestCameraPermission();
      if (!res.granted) {
        Alert.alert(
          "Câmera bloqueada",
          "Sem problema! Você ainda pode escolher da galeria ou usar um fundo padrão."
        );
        return;
      }
    }
    setCameraOpen(true);
  }, [cameraPermission, requestCameraPermission]);

  const handleCapturePhoto = useCallback(async () => {
    if (!cameraRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });
      if (photo?.uri) {
        setPhotoUri(photo.uri);
        setCameraOpen(false);
      }
    } catch {
      Alert.alert("Ops", "Não rolou tirar a foto. Tenta de novo.");
    }
  }, []);

  const handlePickFromGallery = useCallback(async () => {
    Haptics.selectionAsync();
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Galeria bloqueada",
          "Sem problema! Use a câmera ou um fundo padrão."
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.9,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Ops", "Não rolou abrir a galeria.");
    }
  }, []);

  const handleNoPhoto = useCallback(() => {
    Haptics.selectionAsync();
    setPhotoUri(undefined);
  }, []);

  const handleShareStories = useCallback(async () => {
    if (busyAction || !book) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBusyAction("stories");
    try {
      const uri = await captureCard();
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert("Indisponível", "Compartilhamento nativo não disponível aqui.");
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Compartilhar sessão de leitura",
        UTI: "public.png",
      });
      if (!hasSharedThisSession.current) {
        hasSharedThisSession.current = true;
        const badgeUnlocked = progressShareMission();
        if (badgeUnlocked) setBadgeToastVisible(true);
      }
    } catch {
      Alert.alert("Ops", "Não rolou compartilhar agora.");
    } finally {
      setBusyAction(null);
    }
  }, [busyAction, book, captureCard]);

  const handleCopy = useCallback(async () => {
    if (busyAction || !book) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBusyAction("copy");
    try {
      const uri = await captureCard();
      if (isWeb) {
        await Clipboard.setStringAsync(uri);
      } else {
        await Clipboard.setImageAsync(
          uri.startsWith("data:") ? uri.split(",")[1] : await toBase64(uri)
        );
      }
      Alert.alert("Copiado!", "Card copiado para a área de transferência.");
      if (!hasSharedThisSession.current) {
        hasSharedThisSession.current = true;
        const badgeUnlocked = progressShareMission();
        if (badgeUnlocked) setBadgeToastVisible(true);
      }
    } catch {
      Alert.alert("Ops", "Não rolou copiar o card.");
    } finally {
      setBusyAction(null);
    }
  }, [busyAction, book, captureCard]);

  const handleDownload = useCallback(async () => {
    if (busyAction || !book) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBusyAction("download");
    try {
      if (isWeb) {
        Alert.alert("Disponível no app", "Salvar na galeria funciona só no app.");
        return;
      }
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Galeria bloqueada",
          "Libera o acesso à galeria pra salvar o card."
        );
        return;
      }
      const uri = await captureCard();
      await MediaLibrary.saveToLibraryAsync(uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Salvo!", "Card salvo na sua galeria.");
      if (!hasSharedThisSession.current) {
        hasSharedThisSession.current = true;
        const badgeUnlocked = progressShareMission();
        if (badgeUnlocked) setBadgeToastVisible(true);
      }
    } catch {
      Alert.alert("Ops", "Não rolou salvar o card.");
    } finally {
      setBusyAction(null);
    }
  }, [busyAction, book, captureCard]);

  if (!book) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Livro não encontrado.</Text>
      </View>
    );
  }

  const previewScale = 0.32;

  const sharedCardProps = {
    book,
    pages,
    durationSeconds: duration,
    pace,
    motivationalPhrase,
    backgroundPhoto: photoUri,
    selectedStats,
    streak: folego,
    percentComplete,
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: topInset + 8,
          paddingBottom: bottomInset + 12,
        },
      ]}
    >
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            router.back();
          }}
          style={styles.topBtn}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={26} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.foreground }]}>
          Compartilhar
        </Text>
        <View style={styles.topBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Background source picker */}
        <View style={styles.sourceRow}>
          <SourceBtn
            icon="camera-outline"
            label="Câmera"
            disabled={isWeb}
            onPress={handleTakePhoto}
            colors={colors}
          />
          <SourceBtn
            icon="images-outline"
            label="Galeria"
            onPress={handlePickFromGallery}
            colors={colors}
          />
          <SourceBtn
            icon="color-fill-outline"
            label="Sem foto"
            active={!photoUri}
            onPress={handleNoPhoto}
            colors={colors}
          />
        </View>

        {/* Preview */}
        <View style={styles.previewWrap}>
          <View
            style={{
              width: CARD_WIDTH * previewScale,
              height: CARD_HEIGHT * previewScale,
              borderRadius: 18,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                transform: [
                  { scale: previewScale },
                  { translateX: -CARD_WIDTH * (1 - previewScale) / 2 / previewScale },
                  { translateY: -CARD_HEIGHT * (1 - previewScale) / 2 / previewScale },
                ],
              }}
            >
              <ShareCard
                ref={shareCardRef}
                template={template}
                {...sharedCardProps}
              />
            </View>
          </View>
        </View>

        {/* Template carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.templatesRow}
        >
          {SHARE_TEMPLATES.map((t) => {
            const active = t.id === template;
            return (
              <Pressable
                key={t.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setTemplate(t.id);
                }}
                style={[
                  styles.templateChip,
                  {
                    borderColor: active ? colors.volt : colors.border,
                    backgroundColor: active ? `${colors.volt}20` : colors.card,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.templateChipText,
                    { color: active ? colors.volt : colors.foreground },
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Edit stats button */}
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setStatsSheetOpen(true);
          }}
          style={[
            styles.editStatsBtn,
            { borderColor: colors.border, backgroundColor: colors.card },
          ]}
        >
          <Ionicons name="options-outline" size={15} color={colors.mutedForeground} />
          <Text style={[styles.editStatsBtnText, { color: colors.mutedForeground }]}>
            Editar stats
          </Text>
          <View style={styles.editStatsBadges}>
            {selectedStats.map((k) => (
              <View
                key={k}
                style={[styles.editStatsDot, { backgroundColor: colors.volt }]}
              />
            ))}
          </View>
        </Pressable>
      </ScrollView>

      {/* Actions bar */}
      <View
        style={[
          styles.actionsBar,
          { borderTopColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <ActionBtn
          icon="logo-instagram"
          label="Stories"
          loading={busyAction === "stories"}
          onPress={handleShareStories}
          colors={colors}
          primary
        />
        <ActionBtn
          icon="copy-outline"
          label="Copiar"
          loading={busyAction === "copy"}
          onPress={handleCopy}
          colors={colors}
        />
        <ActionBtn
          icon="download-outline"
          label="Baixar"
          loading={busyAction === "download"}
          onPress={handleDownload}
          colors={colors}
        />
        <ActionBtn
          icon="ellipsis-horizontal"
          label="Mais"
          loading={false}
          onPress={handleShareStories}
          colors={colors}
        />
      </View>

      {/* Stats picker sheet */}
      <Modal
        visible={statsSheetOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setStatsSheetOpen(false)}
      >
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => setStatsSheetOpen(false)}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
            Editar estatísticas
          </Text>
          <Text style={[styles.sheetSubtitle, { color: colors.mutedForeground }]}>
            Escolha o que aparece no card
          </Text>

          {ALL_STATS.map((stat) => {
            const isOn = selectedStats.includes(stat.key);
            const isLast = !isOn && selectedStats.length === 1;
            return (
              <Pressable
                key={stat.key}
                onPress={() => {
                  if (isLast) return;
                  Haptics.selectionAsync();
                  toggleStat(stat.key);
                }}
                style={[
                  styles.statToggleRow,
                  { borderBottomColor: colors.border, opacity: isLast ? 0.4 : 1 },
                ]}
              >
                <View
                  style={[
                    styles.statToggleIconWrap,
                    {
                      backgroundColor: isOn
                        ? `${colors.volt}22`
                        : colors.secondary,
                    },
                  ]}
                >
                  <Ionicons
                    name={stat.icon as React.ComponentProps<typeof Ionicons>["name"]}
                    size={18}
                    color={isOn ? colors.volt : colors.mutedForeground}
                  />
                </View>
                <View style={styles.statToggleTexts}>
                  <Text style={[styles.statToggleLabel, { color: colors.foreground }]}>
                    {stat.label}
                  </Text>
                  <Text style={[styles.statToggleDesc, { color: colors.mutedForeground }]}>
                    {stat.description}
                  </Text>
                </View>
                <Switch
                  value={isOn}
                  onValueChange={() => {
                    if (isLast) return;
                    Haptics.selectionAsync();
                    toggleStat(stat.key);
                  }}
                  trackColor={{ false: colors.secondary, true: colors.volt }}
                  thumbColor={isOn ? colors.accentForeground : colors.mutedForeground}
                  ios_backgroundColor={colors.secondary}
                />
              </Pressable>
            );
          })}

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setStatsSheetOpen(false);
            }}
            activeOpacity={0.85}
            style={[styles.sheetDoneBtn, { backgroundColor: colors.volt }]}
          >
            <Text style={[styles.sheetDoneBtnText, { color: colors.accentForeground }]}>
              Pronto
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Camera modal */}
      <Modal visible={cameraOpen} animationType="slide" onRequestClose={() => setCameraOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          {!isWeb && cameraPermission?.granted && (
            <CameraView
              ref={cameraRef}
              style={{ flex: 1 }}
              facing={cameraFacing}
            />
          )}
          <View style={[styles.cameraTop, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity
              onPress={() => setCameraOpen(false)}
              style={styles.cameraTopBtn}
              hitSlop={12}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                setCameraFacing((f) => (f === "back" ? "front" : "back"));
              }}
              style={styles.cameraTopBtn}
              hitSlop={12}
            >
              <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={[styles.cameraBottom, { paddingBottom: insets.bottom + 24 }]}>
            <TouchableOpacity
              onPress={handleCapturePhoto}
              style={styles.captureBtn}
              activeOpacity={0.7}
            >
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Hidden full-size card for capture (always rendered at 1080x1920) */}
      <View style={styles.hiddenShareCard} pointerEvents="none">
        <ShareCard
          ref={shareCardRef}
          template={template}
          {...sharedCardProps}
        />
      </View>

      {/* Badge unlock toast — shown once when card_sharer badge is earned */}
      <BadgeToast
        visible={badgeToastVisible}
        badgeName="Trecho no Feed"
        badgeIcon="share-social"
        xpReward={75}
        onHide={() => setBadgeToastVisible(false)}
      />
    </View>
  );
}

async function toBase64(uri: string): Promise<string> {
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1] ?? "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

function SourceBtn({
  icon,
  label,
  onPress,
  active,
  disabled,
  colors,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.sourceBtn,
        {
          backgroundColor: active ? colors.volt : colors.card,
          borderColor: active ? colors.volt : colors.border,
          opacity: disabled ? 0.45 : 1,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={active ? colors.accentForeground : colors.foreground}
      />
      <Text
        style={[
          styles.sourceBtnText,
          { color: active ? colors.accentForeground : colors.foreground },
        ]}
      >
        {disabled ? `${label} (app)` : label}
      </Text>
    </TouchableOpacity>
  );
}

function ActionBtn({
  icon,
  label,
  onPress,
  loading,
  colors,
  primary,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  loading: boolean;
  colors: ReturnType<typeof useColors>;
  primary?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
      style={styles.actionBtn}
    >
      <View
        style={[
          styles.actionIcon,
          {
            backgroundColor: primary ? colors.volt : colors.card,
            borderColor: primary ? colors.volt : colors.border,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={primary ? colors.accentForeground : colors.foreground}
          />
        ) : (
          <Ionicons
            name={icon}
            size={22}
            color={primary ? colors.accentForeground : colors.foreground}
          />
        )}
      </View>
      <Text style={[styles.actionLabel, { color: colors.foreground }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  topBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  topTitle: { fontSize: 17, fontWeight: "800" },
  scroll: { paddingHorizontal: 16, paddingBottom: 16, alignItems: "center" },
  sourceRow: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    marginBottom: 16,
  },
  sourceBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  sourceBtnText: { fontSize: 13, fontWeight: "700" },
  previewWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  templatesRow: {
    paddingVertical: 6,
    gap: 10,
  },
  templateChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  templateChipText: { fontSize: 13, fontWeight: "800" },
  editStatsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  editStatsBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  editStatsBadges: {
    flexDirection: "row",
    gap: 3,
    marginLeft: 2,
  },
  editStatsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  actionsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 14,
    paddingHorizontal: 12,
    borderTopWidth: 1,
  },
  actionBtn: { alignItems: "center", gap: 6, flex: 1 },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { fontSize: 11, fontWeight: "700" },
  hiddenShareCard: {
    position: "absolute",
    top: -20000,
    left: -20000,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    opacity: 0,
  },
  // Stats sheet
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 16,
  },
  statToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statToggleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statToggleTexts: {
    flex: 1,
    gap: 2,
  },
  statToggleLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  statToggleDesc: {
    fontSize: 12,
    fontWeight: "500",
  },
  sheetDoneBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  sheetDoneBtnText: {
    fontSize: 15,
    fontWeight: "800",
  },
  // Camera modal
  cameraTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  cameraTopBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  captureBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 5,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  captureBtnInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
  },
});

void CapiMascot;
