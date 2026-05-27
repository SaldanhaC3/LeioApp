import { useBookGroup } from "@/contexts/BookGroupContext";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const EMOJI_OPTIONS = ["📚", "📖", "🌙", "☕", "🌿", "✨", "🔥", "💫", "🎭", "🌊"];

function GroupCard({ group }: { group: import("@/contexts/BookGroupContext").ReadingGroup }) {
  const colors = useColors();
  const { hasCheckedInToday, getStreak, myUsername } = useBookGroup();
  const checkedToday = hasCheckedInToday(group.id);
  const streak = getStreak(group.id, myUsername);

  return (
    <TouchableOpacity
      style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => {
        Haptics.selectionAsync();
        router.push(`/grupos/${group.id}`);
      }}
      activeOpacity={0.85}
    >
      <View style={styles.groupCardLeft}>
        <Text style={styles.groupEmoji}>{group.emoji}</Text>
        <View style={styles.groupCardInfo}>
          <Text style={[styles.groupName, { color: colors.foreground }]} numberOfLines={1}>
            {group.name}
          </Text>
          <Text style={[styles.groupMeta, { color: colors.mutedForeground }]}>
            {group.memberUsernames.length} {group.memberUsernames.length === 1 ? "membro" : "membros"} · streak: {streak} {streak === 1 ? "dia" : "dias"}
          </Text>
        </View>
      </View>
      <View style={styles.groupCardRight}>
        {checkedToday ? (
          <View style={[styles.checkBadge, { backgroundColor: `${colors.volt}20`, borderColor: colors.volt }]}>
            <Ionicons name="checkmark" size={14} color={colors.accentText} />
          </View>
        ) : (
          <View style={[styles.checkBadge, { backgroundColor: "transparent", borderColor: colors.border }]}>
            <View style={[styles.checkEmpty, { borderColor: colors.mutedForeground }]} />
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

export default function GruposScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { groups, myUsername, setMyUsername, joinGroup, createGroup } = useBookGroup();

  const [usernameInput, setUsernameInput] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create group form state
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupEmoji, setNewGroupEmoji] = useState("📚");

  const myGroups = groups.filter((g) => g.memberUsernames.includes(myUsername));

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  function handleSaveUsername() {
    const name = usernameInput.trim();
    if (name.length < 2) {
      Alert.alert("Nome muito curto", "Use pelo menos 2 caracteres.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setMyUsername(name);
  }

  function handleJoinGroup() {
    const code = inviteCode.trim().toUpperCase();
    if (code.length !== 6) {
      Alert.alert("Código inválido", "O código de convite tem 6 caracteres.");
      return;
    }
    const group = joinGroup(code);
    if (!group) {
      Alert.alert("Grupo não encontrado", "Verifique o código e tente novamente.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setInviteCode("");
    router.push(`/grupos/${group.id}`);
  }

  function handleCreateGroup() {
    const name = newGroupName.trim();
    if (name.length < 2) {
      Alert.alert("Nome obrigatório", "Dê um nome ao seu grupo.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const group = createGroup(name, newGroupDesc.trim(), newGroupEmoji);
    setNewGroupName("");
    setNewGroupDesc("");
    setNewGroupEmoji("📚");
    setShowCreateModal(false);
    router.push(`/grupos/${group.id}`);
  }

  if (!myUsername) {
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
        <View style={styles.centerContent}>
          <Text style={styles.welcomeEmoji}>📚</Text>
          <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>
            Bem-vindo ao Book Addictive
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.mutedForeground }]}>
            Antes de começar, escolha um nome de usuário para aparecer nos grupos.
          </Text>
          <View style={[styles.usernameInputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.usernameInput, { color: colors.foreground }]}
              placeholder="Seu nome no grupo..."
              placeholderTextColor={colors.mutedForeground}
              value={usernameInput}
              onChangeText={setUsernameInput}
              maxLength={30}
              autoCapitalize="none"
            />
          </View>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.volt }]}
            onPress={handleSaveUsername}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryBtnText, { color: colors.accentForeground }]}>
              Entrar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (showCreateModal) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{
          paddingTop: topInset + 16,
          paddingBottom: bottomInset + 24,
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => setShowCreateModal(false)}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={colors.foreground} />
          <Text style={[styles.backText, { color: colors.foreground }]}>Voltar</Text>
        </TouchableOpacity>

        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Criar grupo</Text>
        <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
          Configure seu clube de leitura
        </Text>

        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Emoji do grupo</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiScroll}>
          {EMOJI_OPTIONS.map((e) => (
            <TouchableOpacity
              key={e}
              style={[
                styles.emojiOption,
                {
                  borderColor: newGroupEmoji === e ? colors.volt : colors.border,
                  backgroundColor: newGroupEmoji === e ? `${colors.volt}20` : colors.card,
                },
              ]}
              onPress={() => setNewGroupEmoji(e)}
            >
              <Text style={styles.emojiOptionText}>{e}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Nome do grupo *</Text>
        <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Ex: Clube do Machado"
            placeholderTextColor={colors.mutedForeground}
            value={newGroupName}
            onChangeText={setNewGroupName}
            maxLength={50}
          />
        </View>

        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Descrição</Text>
        <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Um parágrafo sobre o grupo..."
            placeholderTextColor={colors.mutedForeground}
            value={newGroupDesc}
            onChangeText={setNewGroupDesc}
            maxLength={200}
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.volt, marginTop: 8 }]}
          onPress={handleCreateGroup}
          activeOpacity={0.85}
        >
          <Text style={[styles.primaryBtnText, { color: colors.accentForeground }]}>
            Criar grupo
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topInset + 16,
        paddingBottom: bottomInset + 32,
        paddingHorizontal: 24,
      }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Book Addictive</Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>Olá, {myUsername} 👋</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.volt }]}
          onPress={() => setShowCreateModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={22} color={colors.accentForeground} />
        </TouchableOpacity>
      </View>

      {/* My Groups */}
      {myGroups.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.emptyEmoji}>📖</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Você ainda não está em nenhum grupo
          </Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Crie um grupo ou entre com um código de convite para começar a ler junto.
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.volt, marginTop: 16 }]}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="add-outline" size={18} color={colors.accentForeground} />
            <Text style={[styles.primaryBtnText, { color: colors.accentForeground }]}>
              Criar grupo
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>MEUS GRUPOS</Text>
          {myGroups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </View>
      )}

      {/* Join Group */}
      <View style={[styles.joinCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.joinTitle, { color: colors.foreground }]}>Entrar em um grupo</Text>
        <Text style={[styles.joinSub, { color: colors.mutedForeground }]}>
          Digite o código de 6 letras compartilhado por alguém do grupo.
        </Text>
        <View style={styles.joinRow}>
          <View style={[styles.joinInputWrap, { borderColor: colors.border, backgroundColor: colors.background, flex: 1 }]}>
            <TextInput
              style={[styles.joinInput, { color: colors.foreground }]}
              placeholder="ABC123"
              placeholderTextColor={colors.mutedForeground}
              value={inviteCode}
              onChangeText={(t) => setInviteCode(t.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
            />
          </View>
          <TouchableOpacity
            style={[styles.joinBtn, { backgroundColor: colors.volt }]}
            onPress={handleJoinGroup}
            activeOpacity={0.85}
          >
            <Text style={[styles.joinBtnText, { color: colors.accentForeground }]}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  welcomeEmoji: { fontSize: 60 },
  welcomeTitle: { fontSize: 24, fontWeight: "900", textAlign: "center", letterSpacing: -0.5 },
  welcomeSubtitle: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  usernameInputWrap: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    width: "100%",
  },
  usernameInput: { fontSize: 16, paddingVertical: 12 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: "100%",
  },
  primaryBtnText: { fontSize: 16, fontWeight: "900" },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 },
  pageTitle: { fontSize: 26, fontWeight: "900", letterSpacing: -0.8 },
  pageSub: { fontSize: 14, marginTop: 2 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionBlock: { marginBottom: 24, gap: 10 },
  sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, marginBottom: 4 },
  groupCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  groupCardLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  groupEmoji: { fontSize: 36 },
  groupCardInfo: { flex: 1, gap: 4 },
  groupName: { fontSize: 16, fontWeight: "800" },
  groupMeta: { fontSize: 13 },
  groupCardRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  checkEmpty: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  emptyState: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  emptyEmoji: { fontSize: 52, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  emptySub: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  joinCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  joinTitle: { fontSize: 16, fontWeight: "800" },
  joinSub: { fontSize: 13, lineHeight: 19 },
  joinRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  joinInputWrap: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4 },
  joinInput: { fontSize: 18, fontWeight: "700", paddingVertical: 10, letterSpacing: 2 },
  joinBtn: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 14 },
  joinBtnText: { fontSize: 15, fontWeight: "800" },
  backRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 24 },
  backText: { fontSize: 16, fontWeight: "600" },
  fieldLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  emojiScroll: { marginBottom: 4 },
  emojiOption: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  emojiOptionText: { fontSize: 26 },
  inputWrap: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  input: { fontSize: 15, paddingVertical: 12 },
});
