import { CapiMascot } from "@/components/CapiMascot";
import { useBookGroup, type ChallengeType, type Challenge, type ChallengeScore } from "@/contexts/BookGroupContext";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MOOD_EMOJI: Record<string, string> = {
  amei: "🤩",
  bem: "😊",
  ok: "😐",
  "difícil": "😓",
};

const CHALLENGE_TYPE_LABELS: Record<ChallengeType, string> = {
  pages: "Mais páginas",
  sessions: "Mais sessões",
  minutes: "Mais minutos",
};

const CHALLENGE_UNIT: Record<ChallengeType, string> = {
  pages: "págs",
  sessions: "sessões",
  minutes: "min",
};

const CHALLENGE_ICONS: Record<ChallengeType, string> = {
  pages: "document-text",
  sessions: "timer",
  minutes: "hourglass",
};

const DURATION_OPTIONS = [3, 5, 7] as const;

function getCountdown(endDate: string): string {
  const remaining = Math.max(0, new Date(endDate).getTime() - Date.now());
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (remaining === 0) return "Encerrado";
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

function getCapiMotivation(scores: ChallengeScore[], myUsername: string, type: ChallengeType): string {
  const sorted = [...scores].sort((a, b) => b.value - a.value);
  const myIdx = sorted.findIndex((s) => s.memberName === myUsername);
  const unit = CHALLENGE_UNIT[type];
  if (myIdx === -1) return "Registre uma sessão para entrar no placar!";
  if (sorted[myIdx].value === 0 && myIdx === 0) return "Ainda no empate — quem lê primeiro sai na frente!";
  if (myIdx === 0) {
    const gap = sorted[0].value - (sorted[1]?.value ?? 0);
    return gap > 0
      ? `Na frente! ${gap} ${unit} de vantagem sobre ${sorted[1]?.memberName ?? "os outros"}.`
      : "Empatado na liderança — não dá pra relaxar!";
  }
  const above = sorted[myIdx - 1];
  const gap = above.value - sorted[myIdx].value;
  return `Você está em ${myIdx + 1}º — só ${gap} ${unit} para ultrapassar ${above.memberName}!`;
}

const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

function getLast28Days(): string[] {
  const days: string[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function todayString() {
  return new Date().toISOString().split("T")[0];
}

export default function GroupDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getGroupById,
    getCheckInsForGroup,
    hasCheckedInToday,
    getStreak,
    myUsername,
    leaveGroup,
    createChallenge,
    getActiveChallenge,
    getFinishedChallenge,
    dismissChallenge,
  } = useBookGroup();
  const { earnXP } = useApp();

  const group = getGroupById(id ?? "");
  const today = todayString();
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<ChallengeType>("pages");
  const [createDuration, setCreateDuration] = useState<3 | 5 | 7>(7);
  const [createDesc, setCreateDesc] = useState("");
  const [podiumDismissed, setPodiumDismissed] = useState(false);

  const todayCheckIns = getCheckInsForGroup(id ?? "", today);
  const myCheckInToday = todayCheckIns.find((c) => c.username === myUsername);
  const checkedIn = hasCheckedInToday(id ?? "");

  const last28Days = useMemo(() => getLast28Days(), []);

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const activeChallenge = getActiveChallenge(id ?? "");
  const finishedChallenge = !podiumDismissed ? getFinishedChallenge(id ?? "") : null;

  const sortedScores = activeChallenge
    ? [...activeChallenge.scores].sort((a, b) => b.value - a.value)
    : [];
  const finishedSorted = finishedChallenge
    ? [...finishedChallenge.scores].sort((a, b) => b.value - a.value)
    : [];
  const isWinner = finishedChallenge && finishedSorted[0]?.memberName === myUsername;

  function handleCreateChallenge() {
    createChallenge(id ?? "", createType, createDuration, createDesc.trim() || undefined);
    setShowCreateModal(false);
    setCreateDesc("");
    setCreateType("pages");
    setCreateDuration(7);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function handleDismissPodium() {
    if (finishedChallenge) {
      if (isWinner) earnXP(150);
      dismissChallenge(finishedChallenge.id);
    }
    setPodiumDismissed(true);
  }

  if (!group) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset + 16, paddingHorizontal: 24 }]}>
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={colors.foreground} />
          <Text style={[styles.backText, { color: colors.foreground }]}>Voltar</Text>
        </TouchableOpacity>
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Grupo não encontrado.</Text>
      </View>
    );
  }

  async function handleCopyCode() {
    await Clipboard.setStringAsync(group!.inviteCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Copiado!", `Código ${group!.inviteCode} copiado para a área de transferência.`);
  }

  function handleLeave() {
    Alert.alert(
      "Sair do grupo",
      `Tem certeza que quer sair de "${group!.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: () => {
            leaveGroup(group!.id);
            router.back();
          },
        },
      ]
    );
  }

  function handleCheckIn() {
    Haptics.selectionAsync();
    router.push(`/grupos/checkin?groupId=${group!.id}`);
  }

  // Build check-in map: username -> Set<date>
  const allGroupCheckIns = getCheckInsForGroup(group.id);
  const checkInMap: Record<string, Set<string>> = {};
  for (const ci of allGroupCheckIns) {
    if (!checkInMap[ci.username]) checkInMap[ci.username] = new Set();
    checkInMap[ci.username].add(ci.date);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topInset + 8,
        paddingBottom: bottomInset + 32,
        paddingHorizontal: 24,
      }}
    >
      {/* ── Pódio / Resultado do desafio ── */}
      <Modal visible={!!finishedChallenge} transparent animationType="fade" onRequestClose={handleDismissPodium}>
        <View style={styles.podiumOverlay}>
          <Animated.View
            entering={FadeInDown.springify().damping(18)}
            style={[styles.podiumSheet, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.podiumTitle, { color: colors.foreground }]}>🏆 Desafio encerrado!</Text>
            {finishedChallenge?.description ? (
              <Text style={[styles.podiumDesc, { color: colors.mutedForeground }]}>{finishedChallenge.description}</Text>
            ) : null}
            <View style={styles.podiumStage}>
              {[1, 0, 2].map((pos) => {
                const entry = finishedSorted[pos];
                if (!entry) return null;
                const heights = [80, 110, 60];
                const barH = heights[pos];
                return (
                  <Animated.View
                    key={pos}
                    entering={FadeInDown.delay(pos === 0 ? 150 : pos === 1 ? 0 : 300).springify().damping(16)}
                    style={styles.podiumColumn}
                  >
                    <Text style={styles.podiumMedal}>{["🥇", "🥈", "🥉"][pos]}</Text>
                    <Text style={[styles.podiumName, { color: colors.foreground }]} numberOfLines={1}>
                      {entry.memberName}
                    </Text>
                    <Text style={[styles.podiumScore, { color: colors.accentText }]}>
                      {entry.value} {finishedChallenge ? CHALLENGE_UNIT[finishedChallenge.type] : ""}
                    </Text>
                    <View
                      style={[
                        styles.podiumBar,
                        { height: barH, backgroundColor: MEDAL_COLORS[pos] },
                      ]}
                    >
                      <Text style={styles.podiumPos}>{pos + 1}º</Text>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
            {isWinner ? (
              <View style={[styles.podiumXpBadge, { backgroundColor: `${colors.volt}20`, borderColor: colors.volt }]}>
                <Ionicons name="star" size={16} color={colors.accentText} />
                <Text style={[styles.podiumXpText, { color: colors.accentText }]}>+150 XP de bônus por vencer!</Text>
              </View>
            ) : null}
            <TouchableOpacity
              style={[styles.podiumBtn, { backgroundColor: colors.volt }]}
              onPress={handleDismissPodium}
              activeOpacity={0.85}
            >
              <Text style={[styles.podiumBtnText, { color: colors.accentForeground }]}>
                {isWinner ? "Resgatar XP" : "Fechar"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* ── Criar desafio ── */}
      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <Pressable style={styles.modalBg} onPress={() => setShowCreateModal(false)}>
          <Pressable style={[styles.createSheet, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.createTitle, { color: colors.foreground }]}>Novo desafio</Text>

            <Text style={[styles.createLabel, { color: colors.mutedForeground }]}>TIPO</Text>
            <View style={styles.createTypeRow}>
              {(["pages", "sessions", "minutes"] as ChallengeType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeChip,
                    { borderColor: createType === t ? colors.accentText : colors.border },
                    createType === t && { backgroundColor: `${colors.volt}20` },
                  ]}
                  onPress={() => setCreateType(t)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={CHALLENGE_ICONS[t] as any}
                    size={14}
                    color={createType === t ? colors.accentText : colors.mutedForeground}
                  />
                  <Text style={[styles.typeChipText, { color: createType === t ? colors.accentText : colors.mutedForeground }]}>
                    {CHALLENGE_TYPE_LABELS[t]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.createLabel, { color: colors.mutedForeground }]}>DURAÇÃO</Text>
            <View style={styles.createDurRow}>
              {DURATION_OPTIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.durChip,
                    { borderColor: createDuration === d ? colors.accentText : colors.border },
                    createDuration === d && { backgroundColor: `${colors.volt}20` },
                  ]}
                  onPress={() => setCreateDuration(d as 3 | 5 | 7)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.durChipText, { color: createDuration === d ? colors.accentText : colors.mutedForeground }]}>
                    {d} dias
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.createLabel, { color: colors.mutedForeground }]}>DESCRIÇÃO (opcional)</Text>
            <TextInput
              style={[styles.createInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Ex: quem lê mais páginas esta semana"
              placeholderTextColor={colors.mutedForeground}
              value={createDesc}
              onChangeText={setCreateDesc}
              maxLength={80}
            />

            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: colors.volt }]}
              onPress={handleCreateChallenge}
              activeOpacity={0.85}
            >
              <Ionicons name="trophy-outline" size={18} color={colors.accentForeground} />
              <Text style={[styles.createBtnText, { color: colors.accentForeground }]}>Criar desafio</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Photo lightbox */}
      <Modal
        visible={!!lightboxUri}
        transparent
        animationType="fade"
        onRequestClose={() => setLightboxUri(null)}
      >
        <TouchableOpacity
          style={styles.lightboxOverlay}
          activeOpacity={1}
          onPress={() => setLightboxUri(null)}
        >
          {lightboxUri ? (
            <Image
              source={{ uri: lightboxUri }}
              style={styles.lightboxImage}
              contentFit="contain"
            />
          ) : null}
        </TouchableOpacity>
      </Modal>
      {/* Back */}
      <TouchableOpacity style={styles.backRow} onPress={() => router.back()} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={20} color={colors.foreground} />
        <Text style={[styles.backText, { color: colors.foreground }]}>Grupos</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.headerBlock}>
        <Text style={styles.groupEmoji}>{group.emoji}</Text>
        <View style={styles.headerInfo}>
          <Text style={[styles.groupName, { color: colors.foreground }]}>{group.name}</Text>
          {group.description ? (
            <Text style={[styles.groupDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
              {group.description}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={[styles.leaveBtn, { borderColor: colors.border }]}
          onPress={handleLeave}
          activeOpacity={0.7}
        >
          <Ionicons name="exit-outline" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Invite Code */}
      <TouchableOpacity
        style={[styles.inviteCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={handleCopyCode}
        activeOpacity={0.85}
      >
        <View>
          <Text style={[styles.inviteLabel, { color: colors.mutedForeground }]}>CÓDIGO DE CONVITE</Text>
          <Text style={[styles.inviteCode, { color: colors.accentText }]}>{group.inviteCode}</Text>
        </View>
        <View style={[styles.copyBtn, { backgroundColor: `${colors.volt}20`, borderColor: colors.volt }]}>
          <Ionicons name="copy-outline" size={16} color={colors.accentText} />
          <Text style={[styles.copyBtnText, { color: colors.accentText }]}>Copiar</Text>
        </View>
      </TouchableOpacity>

      {/* ── Desafio ── */}
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>DESAFIO DO GRUPO</Text>
      {activeChallenge ? (
        <View style={[styles.challengeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.challengeHeader}>
            <View style={[styles.challengeTypeBadge, { backgroundColor: `${colors.volt}20`, borderColor: colors.volt }]}>
              <Ionicons name={CHALLENGE_ICONS[activeChallenge.type] as any} size={12} color={colors.accentText} />
              <Text style={[styles.challengeTypeTxt, { color: colors.accentText }]}>
                {CHALLENGE_TYPE_LABELS[activeChallenge.type].toUpperCase()}
              </Text>
            </View>
            <View style={styles.countdownRow}>
              <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
              <Text style={[styles.countdownTxt, { color: colors.mutedForeground }]}>
                {getCountdown(activeChallenge.endDate)} restantes
              </Text>
            </View>
          </View>
          {activeChallenge.description ? (
            <Text style={[styles.challengeDesc, { color: colors.mutedForeground }]}>{activeChallenge.description}</Text>
          ) : null}
          {/* Leaderboard */}
          <View style={styles.leaderboard}>
            {sortedScores.map((entry, idx) => {
              const isMe = entry.memberName === myUsername;
              const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
              return (
                <View
                  key={entry.memberName}
                  style={[
                    styles.lbRow,
                    isMe && { backgroundColor: `${colors.volt}15` },
                    { borderColor: colors.border },
                  ]}
                >
                  <Text style={styles.lbMedal}>{medal ?? `${idx + 1}`}</Text>
                  <Text style={[styles.lbName, { color: isMe ? colors.accentText : colors.foreground }]} numberOfLines={1}>
                    {entry.memberName}{isMe ? " (você)" : ""}
                  </Text>
                  <Text style={[styles.lbScore, { color: isMe ? colors.accentText : colors.foreground }]}>
                    {entry.value} <Text style={{ color: colors.mutedForeground, fontWeight: "400" }}>{CHALLENGE_UNIT[activeChallenge.type]}</Text>
                  </Text>
                </View>
              );
            })}
          </View>
          {/* Capi motivação */}
          <View style={styles.capiRow}>
            <CapiMascot state="motivating" size={56} />
            <View style={[styles.capiBubble, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Text style={[styles.capiBubbleTxt, { color: colors.foreground }]}>
                {getCapiMotivation(activeChallenge.scores, myUsername, activeChallenge.type)}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.createChallengeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowCreateModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="trophy-outline" size={20} color={colors.accentText} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.createChallengeBtnTitle, { color: colors.foreground }]}>Criar desafio</Text>
            <Text style={[styles.createChallengeBtnSub, { color: colors.mutedForeground }]}>Quem lê mais no grupo esta semana?</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}

      {/* Check-in de hoje */}
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>CHECK-IN DE HOJE</Text>
      {checkedIn && myCheckInToday ? (
        <View style={[styles.myCheckInCard, { backgroundColor: `${colors.volt}15`, borderColor: colors.volt }]}>
          <View style={styles.myCheckInHeader}>
            <Ionicons name="checkmark-circle" size={22} color={colors.accentText} />
            <Text style={[styles.myCheckInTitle, { color: colors.accentText }]}>Check-in feito!</Text>
            <Text style={styles.moodEmoji}>{MOOD_EMOJI[myCheckInToday.mood]}</Text>
          </View>
          <Text style={[styles.myCheckInPages, { color: colors.foreground }]}>
            {myCheckInToday.pagesRead} páginas lidas
            {myCheckInToday.bookTitle ? ` · ${myCheckInToday.bookTitle}` : ""}
          </Text>
          {myCheckInToday.comment ? (
            <Text style={[styles.myCheckInComment, { color: colors.mutedForeground }]}>
              "{myCheckInToday.comment}"
            </Text>
          ) : null}
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.checkInBtn, { backgroundColor: colors.volt }]}
          onPress={handleCheckIn}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={22} color={colors.accentForeground} />
          <Text style={[styles.checkInBtnText, { color: colors.accentForeground }]}>
            Fazer check-in
          </Text>
        </TouchableOpacity>
      )}

      {/* Atividade de hoje */}
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ATIVIDADE HOJE</Text>
      {todayCheckIns.length === 0 ? (
        <View style={[styles.emptyActivity, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.emptyActivityText, { color: colors.mutedForeground }]}>
            Nenhum membro fez check-in ainda hoje. Seja o primeiro!
          </Text>
        </View>
      ) : (
        <View style={styles.activityList}>
          {todayCheckIns.map((ci) => (
            <View
              key={ci.id}
              style={[styles.activityItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.avatar, { backgroundColor: colors.muted }]}>
                <Text style={[styles.avatarText, { color: colors.foreground }]}>
                  {ci.username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.activityContent}>
                <View style={styles.activityRow}>
                  <Text style={[styles.activityUsername, { color: colors.foreground }]}>
                    {ci.username}
                  </Text>
                  <Text style={styles.activityMood}>{MOOD_EMOJI[ci.mood]}</Text>
                  <Text style={[styles.activityPages, { color: colors.accentText }]}>
                    {ci.pagesRead} págs
                  </Text>
                  {ci.photoUri ? (
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.selectionAsync();
                        setLightboxUri(ci.photoUri!);
                      }}
                      activeOpacity={0.85}
                    >
                      <Image
                        source={{ uri: ci.photoUri }}
                        style={styles.activityThumb}
                        contentFit="cover"
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>
                {ci.bookTitle ? (
                  <Text style={[styles.activityBook, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {ci.bookTitle}
                  </Text>
                ) : null}
                {ci.comment ? (
                  <Text style={[styles.activityComment, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {ci.comment}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Calendário de streaks */}
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ÚLTIMAS 4 SEMANAS</Text>
      <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Day of week labels */}
        <View style={styles.calendarRow}>
          {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
            <View key={i} style={styles.calendarCell}>
              <Text style={[styles.calDayLabel, { color: colors.mutedForeground }]}>{d}</Text>
            </View>
          ))}
        </View>
        {group.memberUsernames.map((username) => (
          <View key={username} style={styles.memberCalRow}>
            <Text style={[styles.calMemberName, { color: colors.mutedForeground }]} numberOfLines={1}>
              {username.length > 6 ? username.slice(0, 5) + "…" : username}
            </Text>
            <View style={styles.calDots}>
              {last28Days.map((date) => {
                const hasCheckIn = checkInMap[username]?.has(date) ?? false;
                const isToday = date === today;
                return (
                  <View
                    key={date}
                    style={[
                      styles.calDot,
                      {
                        backgroundColor: hasCheckIn
                          ? colors.volt
                          : colors.muted,
                        borderWidth: isToday ? 1.5 : 0,
                        borderColor: isToday ? colors.accentText : "transparent",
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>
        ))}
      </View>

      {/* Membros */}
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>MEMBROS</Text>
      <View style={[styles.membersCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {group.memberUsernames.map((username, idx) => {
          const streak = getStreak(group.id, username);
          const isMe = username === myUsername;
          const isCreator = username === group.createdBy;
          return (
            <View
              key={username}
              style={[
                styles.memberRow,
                idx < group.memberUsernames.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View style={[styles.memberAvatar, { backgroundColor: isMe ? `${colors.volt}30` : colors.muted }]}>
                <Text style={[styles.memberAvatarText, { color: isMe ? colors.accentText : colors.foreground }]}>
                  {username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: colors.foreground }]}>
                  {username}
                  {isMe ? " (você)" : ""}
                  {isCreator ? " 👑" : ""}
                </Text>
              </View>
              <View style={styles.memberStreak}>
                <Text style={styles.memberStreakFire}>🔥</Text>
                <Text style={[styles.memberStreakCount, { color: colors.accentText }]}>
                  {streak}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 16 },
  backText: { fontSize: 16, fontWeight: "600" },
  errorText: { fontSize: 16, textAlign: "center", marginTop: 40 },
  headerBlock: { flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 20 },
  groupEmoji: { fontSize: 48, lineHeight: 58 },
  headerInfo: { flex: 1, gap: 4 },
  groupName: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  groupDesc: { fontSize: 13, lineHeight: 18 },
  leaveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  inviteCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 28,
  },
  inviteLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1.2, marginBottom: 4 },
  inviteCode: { fontSize: 24, fontWeight: "900", letterSpacing: 4 },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  copyBtnText: { fontSize: 13, fontWeight: "700" },
  sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, marginBottom: 10, marginTop: 4 },
  myCheckInCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 8,
    marginBottom: 28,
  },
  myCheckInHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  myCheckInTitle: { fontSize: 15, fontWeight: "800", flex: 1 },
  moodEmoji: { fontSize: 22 },
  myCheckInPages: { fontSize: 14, fontWeight: "600" },
  myCheckInComment: { fontSize: 13, fontStyle: "italic" },
  checkInBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 16,
    paddingVertical: 18,
    marginBottom: 28,
  },
  checkInBtnText: { fontSize: 17, fontWeight: "900" },
  emptyActivity: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    marginBottom: 28,
  },
  emptyActivityText: { fontSize: 14, textAlign: "center" },
  activityList: { gap: 10, marginBottom: 28 },
  activityItem: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "800" },
  activityContent: { flex: 1, gap: 4 },
  activityRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  activityUsername: { fontSize: 14, fontWeight: "700", flex: 1 },
  activityMood: { fontSize: 18 },
  activityPages: { fontSize: 13, fontWeight: "700" },
  activityBook: { fontSize: 12 },
  activityComment: { fontSize: 13, fontStyle: "italic" },
  activityThumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  lightboxImage: {
    width: "100%",
    height: "80%",
  },
  calendarCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    marginBottom: 28,
  },
  calendarRow: { flexDirection: "row", paddingLeft: 64 },
  calendarCell: { flex: 1, alignItems: "center" },
  calDayLabel: { fontSize: 10, fontWeight: "700" },
  memberCalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  calMemberName: { width: 56, fontSize: 11, fontWeight: "600" },
  calDots: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 3 },
  calDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  membersCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 16,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: { fontSize: 16, fontWeight: "800" },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: "600" },
  memberStreak: { flexDirection: "row", alignItems: "center", gap: 4 },
  memberStreakFire: { fontSize: 16 },
  memberStreakCount: { fontSize: 16, fontWeight: "800" },

  /* ── Challenge section ── */
  challengeCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginBottom: 28,
  },
  challengeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  challengeTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  challengeTypeTxt: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8 },
  countdownRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  countdownTxt: { fontSize: 12, fontWeight: "600" },
  challengeDesc: { fontSize: 13, fontStyle: "italic" },
  leaderboard: { gap: 6 },
  lbRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  lbMedal: { fontSize: 18, minWidth: 28, textAlign: "center" },
  lbName: { flex: 1, fontSize: 14, fontWeight: "600" },
  lbScore: { fontSize: 14, fontWeight: "800" },
  capiRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  capiBubble: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  capiBubbleTxt: { fontSize: 13, lineHeight: 18 },
  createChallengeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 28,
    borderStyle: "dashed",
  },
  createChallengeBtnTitle: { fontSize: 15, fontWeight: "700" },
  createChallengeBtnSub: { fontSize: 12, marginTop: 2 },

  /* ── Create challenge modal ── */
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  createSheet: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    paddingBottom: 36,
    gap: 12,
    margin: 8,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  createTitle: { fontSize: 20, fontWeight: "900", marginBottom: 4 },
  createLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginTop: 4 },
  createTypeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typeChipText: { fontSize: 13, fontWeight: "700" },
  createDurRow: { flexDirection: "row", gap: 8 },
  durChip: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
  },
  durChipText: { fontSize: 14, fontWeight: "800" },
  createInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
  },
  createBtnText: { fontSize: 16, fontWeight: "900" },

  /* ── Pódio modal ── */
  podiumOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  podiumSheet: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    gap: 16,
    alignItems: "center",
  },
  podiumTitle: { fontSize: 22, fontWeight: "900" },
  podiumDesc: { fontSize: 13, fontStyle: "italic", textAlign: "center" },
  podiumStage: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    height: 200,
  },
  podiumColumn: { flex: 1, alignItems: "center", gap: 4 },
  podiumMedal: { fontSize: 24 },
  podiumName: { fontSize: 11, fontWeight: "700", textAlign: "center" },
  podiumScore: { fontSize: 11, fontWeight: "800", textAlign: "center" },
  podiumBar: {
    width: "100%",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 20,
  },
  podiumPos: { fontSize: 18, fontWeight: "900", color: "#fff" },
  podiumXpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  podiumXpText: { fontSize: 15, fontWeight: "800" },
  podiumBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 4,
  },
  podiumBtnText: { fontSize: 16, fontWeight: "900" },
});
