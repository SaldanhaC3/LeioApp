import { CapiMascot } from "@/components/CapiMascot";
import { ShareCard } from "@/components/ShareCard";
import { ShareCardPhoto } from "@/components/ShareCardPhoto";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef, type ViewShotRef } from "react-native-view-shot";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}min`;
  return `${m}min ${s}s`;
}

const FOCUS_MESSAGES = [
  "Sessão 100% focada! Você arrasou.",
  "Capi está orgulhosa de você.",
  "Isso é disciplina de verdade.",
];

const ABANDON_MESSAGES = [
  "Sem julgamento — acontece com todo mundo.",
  "Tá bom pra hoje. Amanhã mais!",
  "O importante é ter lido.",
];

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

export default function ConclusaoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    bookId: string;
    startPage: string;
    endPage: string;
    durationSeconds: string;
    pace: string;
    focusMode: string;
    focusExitSeconds: string;
  }>();
  const { getBookById, badges, freeBooks, progressShareMission } = useApp();

  const book = getBookById(params.bookId ?? "");
  const endPage = parseInt(params.endPage ?? "0", 10);
  const startPage = parseInt(params.startPage ?? "0", 10);
  const pages = endPage - startPage;
  const duration = parseInt(params.durationSeconds ?? "0", 10);
  const pace = parseFloat(params.pace ?? "0");
  const isFocusMode = params.focusMode === "1";
  const focusExitSeconds = parseInt(params.focusExitSeconds ?? "0", 10);
  const isFocusClean = isFocusMode && focusExitSeconds === 0;

  const newlyUnlocked = badges.filter(
    (b) => b.unlocked && b.unlockedAt &&
    Date.now() - new Date(b.unlockedAt).getTime() < 60000
  );

  const pagesAnim = useRef(new Animated.Value(0)).current;
  const durationAnim = useRef(new Animated.Value(0)).current;
  const [displayPages, setDisplayPages] = useState(0);
  const [displayDuration, setDisplayDuration] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const shareCardRef = useRef<ViewShotRef>(null);
  const photoCardRef = useRef<ViewShotRef>(null);

  const motivationalPhrase = useMemo(
    () => SHARE_PHRASES[Math.floor(Math.random() * SHARE_PHRASES.length)],
    []
  );

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  useEffect(() => {
    Haptics.notificationAsync(
      isFocusClean
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Success
    );

    Animated.timing(pagesAnim, {
      toValue: pages,
      duration: 800,
      useNativeDriver: false,
    }).start();
    Animated.timing(durationAnim, {
      toValue: duration,
      duration: 900,
      useNativeDriver: false,
    }).start();

    pagesAnim.addListener(({ value }) => setDisplayPages(Math.round(value)));
    durationAnim.addListener(({ value }) => setDisplayDuration(Math.round(value)));

    return () => {
      pagesAnim.removeAllListeners();
      durationAnim.removeAllListeners();
    };
  }, []);

  async function handlePickPhoto() {
    Haptics.selectionAsync();
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Sem permissão",
          "Pra escolher uma foto, libera o acesso à galeria nas configurações."
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.9,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Ops", "Não consegui abrir a galeria agora.");
    }
  }

  function handleRemovePhoto() {
    Haptics.selectionAsync();
    setPhotoUri(null);
  }

  async function handleShare() {
    if (isSharing || !book) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSharing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 80));
      const targetRef = photoUri ? photoCardRef : shareCardRef;
      const uri = await captureRef(targetRef, {
        format: "png",
        quality: 1,
      });
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          "Compartilhamento indisponível",
          "Seu dispositivo não suporta compartilhamento nativo."
        );
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Compartilhar sessão de leitura",
        UTI: "public.png",
      });
      progressShareMission();
    } catch {
      Alert.alert("Ops", "Não rolou compartilhar agora. Tenta de novo daqui a pouco.");
    } finally {
      setIsSharing(false);
    }
  }

  const focusMessage =
    FOCUS_MESSAGES[Math.floor(Math.random() * FOCUS_MESSAGES.length)];
  const abandonMessage =
    ABANDON_MESSAGES[Math.floor(Math.random() * ABANDON_MESSAGES.length)];

  const isBookFinished = book && endPage >= book.totalPages;

  const suggestedBook = freeBooks[0];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: topInset + 16,
          paddingBottom: bottomInset + 16,
          paddingHorizontal: 24,
        },
      ]}
    >
      {/* Capi */}
      <View style={styles.capiSection}>
        <CapiMascot
          state={pages === 0 ? "sad" : isFocusClean ? "celebrating" : "celebrating"}
          size={100}
        />
        <Text style={[styles.mainMessage, { color: colors.foreground }]}>
          {isBookFinished
            ? "Livro concluído!"
            : pages === 0
            ? abandonMessage
            : isFocusClean
            ? focusMessage
            : "Sessão registrada!"}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statVal, { color: colors.volt }]}>
            {displayPages}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            páginas
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statVal, { color: colors.volt }]}>
            {formatDuration(displayDuration)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            duração
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statVal, { color: colors.volt }]}>
            {pace > 0 ? pace.toFixed(1) : "—"}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            págs/min
          </Text>
        </View>
      </View>

      {/* Focus Summary */}
      {isFocusMode && (
        <View
          style={[
            styles.focusSummary,
            {
              backgroundColor: isFocusClean
                ? `${colors.volt}15`
                : `${colors.coral}15`,
              borderColor: isFocusClean ? colors.volt : colors.coral,
            },
          ]}
        >
          <Ionicons
            name={isFocusClean ? "shield-checkmark" : "eye-off-outline"}
            size={16}
            color={isFocusClean ? colors.volt : colors.coral}
          />
          <Text
            style={[
              styles.focusSummaryText,
              { color: isFocusClean ? colors.volt : colors.coral },
            ]}
          >
            {isFocusClean
              ? "Sessão 100% focada!"
              : `${Math.floor(focusExitSeconds / 60)}min ${focusExitSeconds % 60}s fora do app`}
          </Text>
        </View>
      )}

      {/* New Badges */}
      {newlyUnlocked.length > 0 && (
        <View style={[styles.badgeSection, { backgroundColor: `${colors.volt}15`, borderColor: colors.volt }]}>
          <Text style={[styles.badgeHeader, { color: colors.volt }]}>
            Conquistas desbloqueadas!
          </Text>
          {newlyUnlocked.map((badge) => (
            <View key={badge.id} style={styles.badgeRow}>
              <Ionicons name={badge.icon as never} size={18} color={colors.volt} />
              <Text style={[styles.badgeName, { color: colors.foreground }]}>
                {badge.name}
              </Text>
              <Text style={[styles.badgeXP, { color: colors.volt }]}>
                +{badge.xpReward}XP
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Next Book suggestion */}
      {suggestedBook && (
        <View style={[styles.nextBookCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.nextBookLabel, { color: colors.mutedForeground }]}>
            Próxima leitura?
          </Text>
          <Text style={[styles.nextBookTitle, { color: colors.foreground }]} numberOfLines={1}>
            {suggestedBook.title}
          </Text>
          <Text style={[styles.nextBookAuthor, { color: colors.mutedForeground }]}>
            {suggestedBook.author} · grátis
          </Text>
        </View>
      )}

      {/* Photo picker */}
      {book && (
        photoUri ? (
          <View style={[styles.photoPreview, { backgroundColor: colors.card, borderColor: colors.volt }]}>
            <Image source={{ uri: photoUri }} style={styles.photoThumb} />
            <View style={styles.photoPreviewText}>
              <Text style={[styles.photoPreviewTitle, { color: colors.foreground }]}>
                Foto adicionada
              </Text>
              <Text style={[styles.photoPreviewSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                Vira capa do card ao compartilhar
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleRemovePhoto}
              style={[styles.photoRemoveBtn, { borderColor: colors.border }]}
              hitSlop={8}
            >
              <Ionicons name="close" size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.photoPickBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={handlePickPhoto}
            activeOpacity={0.85}
          >
            <Ionicons name="image-outline" size={18} color={colors.foreground} />
            <Text style={[styles.photoPickText, { color: colors.foreground }]}>
              Adicionar foto da galeria
            </Text>
          </TouchableOpacity>
        )
      )}

      {/* Actions */}
      <TouchableOpacity
        style={[
          styles.shareBtn,
          { backgroundColor: colors.volt, opacity: isSharing ? 0.7 : 1 },
        ]}
        onPress={handleShare}
        activeOpacity={0.85}
        disabled={isSharing}
      >
        {isSharing ? (
          <ActivityIndicator size="small" color={colors.accentForeground} />
        ) : (
          <Ionicons
            name="share-social-outline"
            size={20}
            color={colors.accentForeground}
          />
        )}
        <Text style={[styles.shareBtnText, { color: colors.accentForeground }]}>
          {isSharing ? "Gerando card..." : "Compartilhar sessão"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.homeBtn, { borderColor: colors.border }]}
        onPress={() => {
          Haptics.selectionAsync();
          router.replace("/(tabs)");
        }}
        activeOpacity={0.8}
      >
        <Text style={[styles.homeBtnText, { color: colors.foreground }]}>
          Voltar para o início
        </Text>
      </TouchableOpacity>

      {book && (
        <View style={styles.hiddenShareCard} pointerEvents="none">
          <ShareCard
            ref={shareCardRef}
            book={book}
            pages={pages}
            durationSeconds={duration}
            pace={pace}
            motivationalPhrase={motivationalPhrase}
          />
        </View>
      )}

      {book && photoUri && (
        <View style={styles.hiddenShareCard} pointerEvents="none">
          <ShareCardPhoto
            ref={photoCardRef}
            book={book}
            photoUri={photoUri}
            pages={pages}
            pace={pace}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  capiSection: { alignItems: "center", gap: 12, marginBottom: 28 },
  mainMessage: {
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.8,
  },
  statsGrid: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  statVal: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  statLabel: { fontSize: 11 },
  focusSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  focusSummaryText: { fontSize: 13, fontWeight: "700" },
  badgeSection: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    marginBottom: 16,
  },
  badgeHeader: { fontSize: 14, fontWeight: "800" },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  badgeName: { flex: 1, fontSize: 14, fontWeight: "600" },
  badgeXP: { fontSize: 12, fontWeight: "700" },
  nextBookCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    gap: 4,
  },
  nextBookLabel: { fontSize: 11, letterSpacing: 0.5 },
  nextBookTitle: { fontSize: 15, fontWeight: "700" },
  nextBookAuthor: { fontSize: 12 },
  photoPickBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  photoPickText: { fontSize: 14, fontWeight: "700" },
  photoPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  photoThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#000",
  },
  photoPreviewText: { flex: 1, gap: 2 },
  photoPreviewTitle: { fontSize: 13, fontWeight: "800" },
  photoPreviewSub: { fontSize: 11 },
  photoRemoveBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 16,
    padding: 18,
    marginBottom: 10,
  },
  shareBtnText: { fontSize: 16, fontWeight: "900" },
  homeBtn: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  homeBtnText: { fontSize: 15, fontWeight: "700" },
  hiddenShareCard: {
    position: "absolute",
    top: -10000,
    left: -10000,
    width: 1080,
    height: 1920,
    opacity: 0,
  },
});
