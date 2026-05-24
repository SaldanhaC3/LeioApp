import type { Book, Highlight } from "@/contexts/AppContext";
import React, { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import ViewShot, { type ViewShotRef } from "react-native-view-shot";

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;
const VOLT = "#CDFF00";
const BLACK = "#0A0A0A";
const OFF_WHITE = "#FAFAF8";
const CREAM = "#F4E9D8";
const CORAL = "#FF6B5B";

const BG_PALETTE: Record<Highlight["bgVariant"], { bg: string; fg: string; accent: string }> = {
  volt: { bg: VOLT, fg: BLACK, accent: BLACK },
  noir: { bg: BLACK, fg: OFF_WHITE, accent: VOLT },
  cream: { bg: CREAM, fg: BLACK, accent: CORAL },
  coral: { bg: CORAL, fg: OFF_WHITE, accent: BLACK },
};

interface HighlightShareCardProps {
  highlight: Highlight;
  book: Book;
}

export const HighlightShareCard = forwardRef<ViewShotRef, HighlightShareCardProps>(
  ({ highlight, book }, ref) => {
    const palette = BG_PALETTE[highlight.bgVariant];
    return (
      <ViewShot
        ref={ref}
        options={{ format: "png", quality: 1, width: CARD_WIDTH, height: CARD_HEIGHT }}
        style={styles.shotWrapper}
      >
        <View style={[styles.card, { backgroundColor: palette.bg }]}>
          <View style={styles.header}>
            <Text style={[styles.logo, { color: palette.accent }]}>leio</Text>
            <View style={[styles.logoDot, { backgroundColor: palette.accent }]} />
          </View>

          <View style={styles.quoteWrapper}>
            <Text style={[styles.openQuote, { color: palette.accent }]}>"</Text>
            <Text style={[styles.quote, { color: palette.fg }]} numberOfLines={14}>
              {highlight.text}
            </Text>
          </View>

          <View style={styles.attribution}>
            <View style={[styles.attrDivider, { backgroundColor: palette.accent }]} />
            <Text style={[styles.attrTitle, { color: palette.fg }]} numberOfLines={2}>
              {book.title}
            </Text>
            <Text style={[styles.attrAuthor, { color: palette.fg, opacity: 0.7 }]} numberOfLines={1}>
              {book.author}
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerLabel, { color: palette.fg, opacity: 0.6 }]}>
              destacado no
            </Text>
            <Text style={[styles.footerBrand, { color: palette.accent }]}>leio</Text>
          </View>
        </View>
      </ViewShot>
    );
  }
);

HighlightShareCard.displayName = "HighlightShareCard";

const styles = StyleSheet.create({
  shotWrapper: { width: CARD_WIDTH, height: CARD_HEIGHT },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    paddingHorizontal: 100,
    paddingTop: 140,
    paddingBottom: 120,
    justifyContent: "space-between",
  },
  header: { flexDirection: "row", alignItems: "center", gap: 16 },
  logo: { fontSize: 96, fontWeight: "900", letterSpacing: -4 },
  logoDot: { width: 24, height: 24, borderRadius: 12, marginTop: 60 },
  quoteWrapper: { flex: 1, justifyContent: "center", gap: 12 },
  openQuote: {
    fontSize: 220,
    fontWeight: "900",
    lineHeight: 180,
    height: 120,
    letterSpacing: -8,
  },
  quote: {
    fontSize: 62,
    fontWeight: "700",
    lineHeight: 80,
    letterSpacing: -1.5,
  },
  attribution: { gap: 14, marginBottom: 40 },
  attrDivider: { width: 80, height: 4, borderRadius: 2 },
  attrTitle: { fontSize: 44, fontWeight: "900", letterSpacing: -1 },
  attrAuthor: { fontSize: 32, fontWeight: "600" },
  footer: { flexDirection: "row", alignItems: "baseline", justifyContent: "flex-end", gap: 12 },
  footerLabel: { fontSize: 28, fontWeight: "600" },
  footerBrand: { fontSize: 48, fontWeight: "900", letterSpacing: -2 },
});
