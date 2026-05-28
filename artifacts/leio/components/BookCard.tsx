import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Book } from "@/contexts/AppContext";

function getETA(book: Book): string {
  if (!book.pace || book.pace === 0) return "";
  const remaining = book.totalPages - book.currentPage;
  if (remaining <= 0) return "";
  const minutes = remaining / book.pace;
  if (minutes < 60) return `${Math.round(minutes)}min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

interface BookCardProps {
  book: Book;
  onPress: () => void;
  onEdit?: () => void;
  compact?: boolean;
}

export function BookCard({ book, onPress, onEdit, compact }: BookCardProps) {
  const colors = useColors();
  const progress =
    book.totalPages > 0 ? book.currentPage / book.totalPages : 0;
  const eta = getETA(book);
  const isAbandoned = (() => {
    if (book.status !== "reading" || !book.lastSessionAt) return false;
    const days =
      (Date.now() - new Date(book.lastSessionAt).getTime()) /
      (1000 * 60 * 60 * 24);
    return days >= 14;
  })();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        compact && styles.cardCompact,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.cover, { backgroundColor: book.coverColor }]}>
        {book.coverImage ? (
          <Image
            source={{ uri: book.coverImage }}
            style={styles.coverImage}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <Ionicons name="book" size={24} color="rgba(255,255,255,0.4)" />
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, { color: colors.foreground }]}
            numberOfLines={2}
          >
            {book.title}
          </Text>
          {onEdit && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.editBtn}
            >
              <Ionicons name="pencil-outline" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
        <Text
          style={[styles.author, { color: colors.mutedForeground }]}
          numberOfLines={1}
        >
          {book.author}
        </Text>

        {book.status === "reading" && (
          <>
            <View
              style={[styles.progressBar, { backgroundColor: colors.border }]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: isAbandoned ? colors.coral : colors.volt,
                    width: `${Math.round(progress * 100)}%`,
                  },
                ]}
              />
            </View>
            <View style={styles.meta}>
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                {book.currentPage}/{book.totalPages} págs
              </Text>
              {eta !== "" && !isAbandoned && (
                <Text style={[styles.eta, { color: colors.accentText }]}>
                  {eta} restantes
                </Text>
              )}
              {isAbandoned && (
                <Text style={[styles.eta, { color: colors.coral }]}>
                  parado há dias
                </Text>
              )}
            </View>
          </>
        )}

        {book.status === "read" && (
          <View style={styles.doneRow}>
            <Ionicons name="checkmark-circle" size={14} color={colors.accentText} />
            <Text style={[styles.doneText, { color: colors.accentText }]}>
              Concluído
            </Text>
          </View>
        )}

        {book.status === "want" && (
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {book.totalPages} páginas
          </Text>
        )}

        {book.status === "abandoned" && (
          <Text style={[styles.metaText, { color: colors.coral }]}>
            Abandonado
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    gap: 12,
    alignItems: "center",
  },
  cardCompact: {
    padding: 8,
  },
  cover: {
    width: 52,
    height: 72,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  editBtn: {
    marginTop: 1,
    flexShrink: 0,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  author: {
    fontSize: 12,
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
    marginTop: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  metaText: {
    fontSize: 11,
  },
  eta: {
    fontSize: 11,
    fontWeight: "700",
  },
  doneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  doneText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
