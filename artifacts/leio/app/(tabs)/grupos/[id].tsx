import { useBookGroup } from "@/contexts/BookGroupContext";
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
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MOOD_EMOJI: Record<string, string> = {
  amei: "🤩",
  bem: "😊",
  ok: "😐",
  "difícil": "😓",
};

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
  } = useBookGroup();

  const group = getGroupById(id ?? "");
  const today = todayString();
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);

  const todayCheckIns = getCheckInsForGroup(id ?? "", today);
  const myCheckInToday = todayCheckIns.find((c) => c.username === myUsername);
  const checkedIn = hasCheckedInToday(id ?? "");

  const last28Days = useMemo(() => getLast28Days(), []);

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

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
});
