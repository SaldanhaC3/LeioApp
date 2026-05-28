import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BookRankingEntry {
  title: string;
  author: string;
  genre: string | null;
  reader_count: number;
  total_pages_read: number;
  avg_pace: number | null;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function RankingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<BookRankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);

  const fetchRanking = useCallback(async () => {
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: rows } = await supabase
        .from("book_rankings")
        .select("*")
        .limit(20);
      setData((rows as BookRankingEntry[]) ?? []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRanking(); }, [fetchRanking]);

  function onRefresh() {
    setRefreshing(true);
    fetchRanking();
  }

  function renderItem({ item, index }: { item: BookRankingEntry; index: number }) {
    const isTop3 = index < 3;
    const position = index + 1;

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: isTop3 ? colors.volt : colors.border,
            borderWidth: isTop3 ? 1.5 : 1,
          },
        ]}
      >
        <View style={[styles.positionBadge, { backgroundColor: isTop3 ? colors.volt : colors.secondary }]}>
          {isTop3 ? (
            <Text style={styles.medalEmoji}>{MEDALS[index]}</Text>
          ) : (
            <Text style={[styles.positionNumber, { color: colors.mutedForeground }]}>#{position}</Text>
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.bookTitle, { color: colors.foreground }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.bookAuthor, { color: colors.mutedForeground }]} numberOfLines={1}>
            {item.author}
          </Text>
          {item.genre && (
            <View style={[styles.genreTag, { backgroundColor: `${colors.volt}20` }]}>
              <Text style={[styles.genreTagText, { color: colors.accentText ?? colors.volt }]}>
                {item.genre}
              </Text>
            </View>
          )}
          <Text style={[styles.stats, { color: colors.mutedForeground }]}>
            {item.reader_count} {item.reader_count === 1 ? "leitor" : "leitores"} · {(item.total_pages_read ?? 0).toLocaleString("pt-BR")} páginas lidas
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 16, paddingHorizontal: 20, paddingBottom: 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Mais Lidos</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>últimos 30 dias</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.volt} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, i) => `${item.title}_${i}`}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.volt} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📖</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                Sem dados ainda
              </Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                Seja o primeiro a registrar suas leituras!
              </Text>
            </View>
          }
          ListFooterComponent={
            data.length > 0 ? (
              <View style={styles.footer}>
                <Ionicons name="lock-closed-outline" size={12} color={colors.mutedForeground} />
                <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
                  Dados agregados e anônimos. Nenhum dado pessoal é compartilhado.
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { padding: 4 },
  headerText: {},
  headerTitle: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  headerSub: { fontSize: 12, marginTop: 2 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { paddingHorizontal: 20, paddingTop: 8 },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  positionBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  medalEmoji: { fontSize: 22 },
  positionNumber: { fontSize: 13, fontWeight: "800" },
  cardContent: { flex: 1, gap: 3 },
  bookTitle: { fontSize: 16, fontWeight: "800" },
  bookAuthor: { fontSize: 13 },
  genreTag: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 4 },
  genreTagText: { fontSize: 11, fontWeight: "700" },
  stats: { fontSize: 12, marginTop: 4 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: "800", textAlign: "center" },
  emptySub: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  footer: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", paddingVertical: 16 },
  footerText: { fontSize: 11, flex: 1, flexWrap: "wrap" },
});
