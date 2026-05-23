import {
  CARD_HEIGHT,
  CARD_WIDTH,
  ShareCard,
  type ShareTemplateId,
} from "@/components/ShareCard";
import { useApp, type SharedCard } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { router } from "expo-router";
import { captureRef, type ViewShotRef } from "react-native-view-shot";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const isWeb = Platform.OS === "web";

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
const SCREEN_W = Dimensions.get("window").width;
const THUMB_COLS = 2;
const THUMB_GAP = 12;
const THUMB_W = (SCREEN_W - 32 - THUMB_GAP) / THUMB_COLS;
const THUMB_H = THUMB_W * (CARD_HEIGHT / CARD_WIDTH);

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}min`;
  return `${m}min ${s}s`;
}

export default function MeusCardsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sharedCards } = useApp();

  const topInset = insets.top + (isWeb ? 67 : 0);
  const bottomInset = insets.bottom + (isWeb ? 34 : 0);

  const [selected, setSelected] = useState<SharedCard | null>(null);

  const handleTap = useCallback((card: SharedCard) => {
    Haptics.selectionAsync();
    setSelected(card);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset }]}>
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
          Meus Cards
        </Text>
        <View style={styles.topBtn} />
      </View>

      {sharedCards.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="images-outline" size={56} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Nenhum card ainda
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            Compartilhe sua próxima sessão e ela vai aparecer aqui.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sharedCards}
          keyExtractor={(item) => item.id}
          numColumns={THUMB_COLS}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: bottomInset + 24 },
          ]}
          columnWrapperStyle={{ gap: THUMB_GAP }}
          ItemSeparatorComponent={() => <View style={{ height: THUMB_GAP }} />}
          renderItem={({ item }) => (
            <CardThumb card={item} colors={colors} onPress={() => handleTap(item)} />
          )}
        />
      )}

      {selected && (
        <CardModal
          card={selected}
          colors={colors}
          insets={insets}
          onClose={() => setSelected(null)}
        />
      )}
    </View>
  );
}

function CardThumb({
  card,
  colors,
  onPress,
}: {
  card: SharedCard;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.thumb,
        {
          width: THUMB_W,
          height: THUMB_H,
          backgroundColor: card.bookCoverColor,
          borderColor: colors.border,
        },
      ]}
    >
      {card.thumbnailUri ? (
        <Image
          source={{ uri: card.thumbnailUri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.thumbFallback]}>
          <Text style={[styles.thumbTitle, { color: "#fff" }]} numberOfLines={2}>
            {card.bookTitle}
          </Text>
          <Text style={[styles.thumbPages, { color: "rgba(255,255,255,0.7)" }]}>
            {card.pages} págs
          </Text>
        </View>
      )}
      <View style={[styles.thumbOverlay, { backgroundColor: "rgba(0,0,0,0.45)" }]}>
        <Text style={styles.thumbDate}>{formatDate(card.sharedAt)}</Text>
        <Text style={styles.thumbBookName} numberOfLines={1}>
          {card.bookTitle}
        </Text>
      </View>
    </Pressable>
  );
}

const MODAL_SCALE = 0.72;

function CardModal({
  card,
  colors,
  insets,
  onClose,
}: {
  card: SharedCard;
  colors: ReturnType<typeof useColors>;
  insets: ReturnType<typeof useSafeAreaInsets>;
  onClose: () => void;
}) {
  const shareCardRef = useRef<ViewShotRef>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const topInset = insets.top + (isWeb ? 67 : 0);
  const bottomInset = insets.bottom + (isWeb ? 34 : 0);

  const captureCard = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 80));
    return await captureRef(shareCardRef, { format: "png", quality: 1 });
  }, []);

  const getUri = useCallback(async () => {
    return card.thumbnailUri ?? await captureCard();
  }, [card, captureCard]);

  const handleShare = useCallback(async () => {
    if (busyAction) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBusyAction("share");
    try {
      const uri = await getUri();
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
    } catch {
      Alert.alert("Ops", "Não rolou compartilhar agora.");
    } finally {
      setBusyAction(null);
    }
  }, [busyAction, getUri]);

  const handleCopy = useCallback(async () => {
    if (busyAction) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBusyAction("copy");
    try {
      const uri = await getUri();
      if (isWeb) {
        await Clipboard.setStringAsync(uri);
      } else {
        const b64 = uri.startsWith("data:") ? uri.split(",")[1] : await toBase64(uri);
        await Clipboard.setImageAsync(b64);
      }
      Alert.alert("Copiado!", "Card copiado para a área de transferência.");
    } catch {
      Alert.alert("Ops", "Não rolou copiar o card.");
    } finally {
      setBusyAction(null);
    }
  }, [busyAction, getUri]);

  const handleDownload = useCallback(async () => {
    if (busyAction) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBusyAction("download");
    try {
      if (isWeb) {
        Alert.alert("Disponível no app", "Salvar na galeria funciona só no app.");
        return;
      }
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Galeria bloqueada", "Libera o acesso à galeria pra salvar o card.");
        return;
      }
      const uri = await getUri();
      await MediaLibrary.saveToLibraryAsync(uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Salvo!", "Card salvo na sua galeria.");
    } catch {
      Alert.alert("Ops", "Não rolou salvar o card.");
    } finally {
      setBusyAction(null);
    }
  }, [busyAction, getUri]);

  const handleMore = useCallback(async () => {
    if (busyAction) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBusyAction("more");
    try {
      const uri = await getUri();
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
    } catch {
      Alert.alert("Ops", "Não rolou abrir o menu de compartilhamento.");
    } finally {
      setBusyAction(null);
    }
  }, [busyAction, getUri]);

  const previewScale = MODAL_SCALE;
  const previewW = CARD_WIDTH * previewScale;
  const previewH = CARD_HEIGHT * previewScale;

  const dummyBook = {
    id: card.bookId,
    title: card.bookTitle,
    author: card.bookAuthor,
    authorGender: undefined,
    authorNationality: undefined,
    genre: "",
    totalPages: 0,
    currentPage: 0,
    status: "read" as const,
    coverColor: card.bookCoverColor,
    addedAt: card.sharedAt,
  };

  return (
    <Modal
      visible
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.modalContainer,
          {
            backgroundColor: colors.background,
            paddingTop: topInset + 8,
            paddingBottom: bottomInset + 12,
          },
        ]}
      >
        {/* Modal top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.topBtn}
            hitSlop={12}
          >
            <Ionicons name="close" size={26} color={colors.foreground} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.topTitle, { color: colors.foreground }]}>
              {card.bookTitle}
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
              {formatDate(card.sharedAt)} · {card.pages} págs · {formatDuration(card.durationSeconds)}
            </Text>
          </View>
          <View style={styles.topBtn} />
        </View>

        {/* Card preview */}
        <View style={styles.modalPreviewWrap}>
          {card.thumbnailUri ? (
            <View
              style={{
                width: previewW,
                height: previewH,
                borderRadius: 18,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Image
                source={{ uri: card.thumbnailUri }}
                style={{ width: previewW, height: previewH }}
                contentFit="cover"
              />
            </View>
          ) : (
            <View
              style={{
                width: previewW,
                height: previewH,
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
                  template={card.template as ShareTemplateId}
                  book={dummyBook}
                  pages={card.pages}
                  durationSeconds={card.durationSeconds}
                  pace={card.pace}
                  motivationalPhrase="Leitura concluída. Ego inflado."
                />
              </View>
            </View>
          )}
        </View>

        {/* Actions bar */}
        <View
          style={[
            styles.actionsBar,
            { borderTopColor: colors.border, backgroundColor: colors.background },
          ]}
        >
          <ModalActionBtn
            icon="logo-instagram"
            label="Stories"
            loading={busyAction === "share"}
            onPress={handleShare}
            colors={colors}
            primary
          />
          <ModalActionBtn
            icon="copy-outline"
            label="Copiar"
            loading={busyAction === "copy"}
            onPress={handleCopy}
            colors={colors}
          />
          <ModalActionBtn
            icon="download-outline"
            label="Baixar"
            loading={busyAction === "download"}
            onPress={handleDownload}
            colors={colors}
          />
          <ModalActionBtn
            icon="ellipsis-horizontal"
            label="Mais"
            loading={busyAction === "more"}
            onPress={handleMore}
            colors={colors}
          />
        </View>

        {/* Hidden full-size card for capture (fallback when no saved URI) */}
        {!card.thumbnailUri && (
          <View style={styles.hiddenShareCard} pointerEvents="none">
            <ShareCard
              ref={shareCardRef}
              template={card.template as ShareTemplateId}
              book={dummyBook}
              pages={card.pages}
              durationSeconds={card.durationSeconds}
              pace={card.pace}
              motivationalPhrase="Leitura concluída. Ego inflado."
            />
          </View>
        )}
      </View>
    </Modal>
  );
}

function ModalActionBtn({
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
  topTitle: { fontSize: 17, fontWeight: "800", textAlign: "center" },
  modalSubtitle: { fontSize: 12, fontWeight: "500", textAlign: "center", marginTop: 2 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", textAlign: "center" },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  grid: { paddingHorizontal: 16, paddingTop: 8 },
  thumb: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    justifyContent: "flex-end",
  },
  thumbFallback: {
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  thumbTitle: { fontSize: 13, fontWeight: "800", textAlign: "center" },
  thumbPages: { fontSize: 11, fontWeight: "600" },
  thumbOverlay: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  thumbDate: { fontSize: 10, fontWeight: "600", color: "rgba(255,255,255,0.7)" },
  thumbBookName: { fontSize: 13, fontWeight: "800", color: "#fff" },
  modalContainer: { flex: 1 },
  modalPreviewWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
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
});
