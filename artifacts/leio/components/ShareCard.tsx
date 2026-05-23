import { CapiMascot } from "@/components/CapiMascot";
import type { Book } from "@/contexts/AppContext";
import React, { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import ViewShot, { type ViewShotRef } from "react-native-view-shot";

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;
const VOLT = "#CDFF00";
const BLACK = "#0A0A0A";
const OFF_WHITE = "#FAFAF8";
const MUTED = "#888888";

interface ShareCardProps {
  book: Book;
  pages: number;
  durationSeconds: number;
  pace: number;
  motivationalPhrase: string;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}min`;
  return `${m}min ${s}s`;
}

export const ShareCard = forwardRef<ViewShotRef, ShareCardProps>(
  ({ book, pages, durationSeconds, pace, motivationalPhrase }, ref) => {
    return (
      <ViewShot
        ref={ref}
        options={{ format: "png", quality: 1, width: CARD_WIDTH, height: CARD_HEIGHT }}
        style={styles.shotWrapper}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.logo}>leio</Text>
            <View style={styles.logoDot} />
          </View>

          <View style={styles.coverWrapper}>
            <View style={[styles.cover, { backgroundColor: book.coverColor }]}>
              <Text style={styles.coverTitle} numberOfLines={4}>
                {book.title}
              </Text>
              <Text style={styles.coverAuthor} numberOfLines={2}>
                {book.author}
              </Text>
            </View>
          </View>

          <View style={styles.bookInfo}>
            <Text style={styles.title} numberOfLines={2}>
              {book.title}
            </Text>
            <Text style={styles.author} numberOfLines={1}>
              {book.author}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{pages}</Text>
              <Text style={styles.statLabel}>páginas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{formatDuration(durationSeconds)}</Text>
              <Text style={styles.statLabel}>tempo</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{pace > 0 ? pace.toFixed(1) : "—"}</Text>
              <Text style={styles.statLabel}>págs/min</Text>
            </View>
          </View>

          <View style={styles.phraseWrapper}>
            <Text style={styles.phrase}>{motivationalPhrase}</Text>
          </View>

          <View style={styles.footer}>
            <View style={styles.capiCorner}>
              <CapiMascot state="celebrating" size={180} />
            </View>
            <View style={styles.footerText}>
              <Text style={styles.footerLabel}>registrado no</Text>
              <Text style={styles.footerBrand}>leio</Text>
            </View>
          </View>
        </View>
      </ViewShot>
    );
  }
);

ShareCard.displayName = "ShareCard";

const styles = StyleSheet.create({
  shotWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: BLACK,
    paddingHorizontal: 80,
    paddingTop: 120,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 60,
  },
  logo: {
    color: VOLT,
    fontSize: 96,
    fontWeight: "900",
    letterSpacing: -4,
  },
  logoDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: VOLT,
    marginTop: 60,
  },
  coverWrapper: {
    alignItems: "center",
    marginBottom: 60,
  },
  cover: {
    width: 480,
    height: 720,
    borderRadius: 16,
    padding: 40,
    justifyContent: "space-between",
  },
  coverTitle: {
    color: OFF_WHITE,
    fontSize: 64,
    fontWeight: "900",
    letterSpacing: -2,
    lineHeight: 70,
  },
  coverAuthor: {
    color: OFF_WHITE,
    opacity: 0.8,
    fontSize: 36,
    fontWeight: "600",
  },
  bookInfo: {
    alignItems: "center",
    marginBottom: 60,
    gap: 12,
  },
  title: {
    color: OFF_WHITE,
    fontSize: 64,
    fontWeight: "900",
    letterSpacing: -2,
    textAlign: "center",
  },
  author: {
    color: MUTED,
    fontSize: 40,
    fontWeight: "600",
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#141414",
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 30,
    marginBottom: 60,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    color: VOLT,
    fontSize: 64,
    fontWeight: "900",
    letterSpacing: -2,
  },
  statLabel: {
    color: MUTED,
    fontSize: 28,
    fontWeight: "600",
  },
  statDivider: {
    width: 2,
    height: 80,
    backgroundColor: "#2A2A2A",
  },
  phraseWrapper: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  phrase: {
    color: OFF_WHITE,
    fontSize: 48,
    fontWeight: "700",
    letterSpacing: -1,
    textAlign: "center",
    lineHeight: 60,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  capiCorner: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    alignItems: "flex-end",
  },
  footerLabel: {
    color: MUTED,
    fontSize: 28,
    fontWeight: "600",
  },
  footerBrand: {
    color: VOLT,
    fontSize: 56,
    fontWeight: "900",
    letterSpacing: -2,
  },
});
