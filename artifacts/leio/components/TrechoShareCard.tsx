import type { Book, Highlight } from "@/contexts/AppContext";
import React, { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import ViewShot, { type ViewShotRef } from "react-native-view-shot";

const CARD_W = 1080;
const CARD_H = 1350;

const VOLT = "#CDFF00";
const BLACK = "#0A0A0A";
const OFF_WHITE = "#F8F8F5";
const CREAM = "#F4E9D8";
const CORAL = "#FF6B5B";
const BROWN = "#8B5E3C";

const PALETTE: Record<Highlight["bgVariant"], { bg: string; fg: string; accent: string }> = {
  volt:  { bg: VOLT,  fg: BLACK,    accent: BLACK },
  noir:  { bg: BLACK, fg: OFF_WHITE, accent: VOLT },
  cream: { bg: CREAM, fg: "#3B2F2F", accent: BROWN },
  coral: { bg: CORAL, fg: OFF_WHITE, accent: BLACK },
};

interface Props {
  highlight: Highlight;
  book: Book;
}

export const TrechoShareCard = forwardRef<ViewShotRef, Props>(({ highlight, book }, ref) => {
  const p = PALETTE[highlight.bgVariant];

  return (
    <ViewShot
      ref={ref}
      options={{ format: "png", quality: 1, width: CARD_W, height: CARD_H }}
      style={styles.shot}
    >
      <View style={[styles.card, { backgroundColor: p.bg }]}>
        <View style={styles.top}>
          <View style={[styles.accentBar, { backgroundColor: p.accent }]} />
          <Text style={[styles.logo, { color: p.accent }]}>leio</Text>
        </View>

        <View style={styles.quoteBlock}>
          <Text style={[styles.openQ, { color: p.accent }]}>"</Text>
          <Text style={[styles.excerpt, { color: p.fg }]} numberOfLines={11}>
            {highlight.text}
          </Text>
          <Text style={[styles.closeQ, { color: p.accent }]}>"</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: p.accent + "55" }]} />

        <View style={styles.attribution}>
          <Text style={[styles.bookTitle, { color: p.fg }]} numberOfLines={2}>
            {book.title}
          </Text>
          <Text style={[styles.bookAuthor, { color: p.fg, opacity: 0.6 }]} numberOfLines={1}>
            {book.author}
          </Text>
        </View>

        <Text style={[styles.brand, { color: p.fg, opacity: 0.35 }]}>caderno · leio</Text>
      </View>
    </ViewShot>
  );
});

TrechoShareCard.displayName = "TrechoShareCard";

const styles = StyleSheet.create({
  shot: { width: CARD_W, height: CARD_H },
  card: {
    width: CARD_W,
    height: CARD_H,
    paddingHorizontal: 96,
    paddingTop: 100,
    paddingBottom: 100,
    justifyContent: "space-between",
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  accentBar: { width: 64, height: 8, borderRadius: 4 },
  logo: { fontSize: 56, fontWeight: "900", letterSpacing: -2 },
  quoteBlock: { flex: 1, justifyContent: "center" },
  openQ: {
    fontSize: 240,
    fontWeight: "900",
    lineHeight: 200,
    height: 160,
    letterSpacing: -8,
    marginBottom: 8,
  },
  excerpt: {
    fontSize: 60,
    fontWeight: "700",
    lineHeight: 82,
    letterSpacing: -1.2,
    marginBottom: 16,
  },
  closeQ: {
    fontSize: 240,
    fontWeight: "900",
    lineHeight: 160,
    height: 120,
    letterSpacing: -8,
    textAlign: "right",
  },
  divider: { height: 2, borderRadius: 1, marginVertical: 40 },
  attribution: { gap: 14 },
  bookTitle: { fontSize: 46, fontWeight: "900", letterSpacing: -1 },
  bookAuthor: { fontSize: 32, fontWeight: "600" },
  brand: { fontSize: 26, fontWeight: "600", letterSpacing: 0.5, marginTop: 20 },
});
