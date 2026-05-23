import type { Book } from "@/contexts/AppContext";
import { LinearGradient } from "expo-linear-gradient";
import React, { forwardRef } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import ViewShot, { type ViewShotRef } from "react-native-view-shot";

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;
const VOLT = "#CDFF00";
const WHITE = "#FFFFFF";
const SOFT_WHITE = "rgba(255,255,255,0.78)";

interface ShareCardPhotoProps {
  book: Book;
  photoUri: string;
  pages: number;
  pace: number;
}

export const ShareCardPhoto = forwardRef<ViewShotRef, ShareCardPhotoProps>(
  ({ book, photoUri, pages, pace }, ref) => {
    const paceStr = pace > 0 ? pace.toFixed(1) : "—";
    return (
      <ViewShot
        ref={ref}
        options={{ format: "png", quality: 1, width: CARD_WIDTH, height: CARD_HEIGHT }}
        style={styles.shotWrapper}
      >
        <View style={styles.card}>
          <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />

          {/* Top gradient for logo legibility */}
          <LinearGradient
            colors={["rgba(0,0,0,0.55)", "rgba(0,0,0,0)"]}
            style={styles.topGradient}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />

          {/* Bottom gradient for stats legibility */}
          <LinearGradient
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.45)", "rgba(0,0,0,0.92)"]}
            locations={[0, 0.45, 1]}
            style={styles.bottomGradient}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />

          {/* Top brand badge */}
          <View style={styles.topBar}>
            <View style={styles.brandPill}>
              <View style={styles.brandDot} />
              <Text style={styles.brandText}>leio</Text>
            </View>
          </View>

          {/* Bottom content */}
          <View style={styles.bottomContent}>
            {/* Book strip */}
            <View style={styles.bookStrip}>
              <Text style={styles.bookLabel}>LIVRO</Text>
              <Text style={styles.bookTitle} numberOfLines={2}>
                {book.title}
              </Text>
              <Text style={styles.bookAuthor} numberOfLines={1}>
                {book.author}
              </Text>
            </View>

            {/* Sport-style stat row */}
            <View style={styles.statRow}>
              <View style={styles.paceBlock}>
                <View style={styles.paceHeader}>
                  <View style={styles.speedTick} />
                  <View style={[styles.speedTick, styles.speedTickMid]} />
                  <View style={styles.speedTick} />
                  <Text style={styles.paceLabel}>PACE</Text>
                </View>
                <View style={styles.paceValueRow}>
                  <Text style={styles.paceValue}>{paceStr}</Text>
                  <Text style={styles.paceUnit}>pg/min</Text>
                </View>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.pagesBlock}>
                <Text style={styles.pagesLabel}>PÁGINAS</Text>
                <Text style={styles.pagesValue}>{pages}</Text>
                <Text style={styles.pagesUnit}>lidas hoje</Text>
              </View>
            </View>
          </View>
        </View>
      </ViewShot>
    );
  }
);

ShareCardPhoto.displayName = "ShareCardPhoto";

const styles = StyleSheet.create({
  shotWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: "#0A0A0A",
    overflow: "hidden",
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 360,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1100,
  },
  topBar: {
    position: "absolute",
    top: 96,
    left: 80,
    right: 80,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 36,
    paddingVertical: 22,
    borderRadius: 999,
  },
  brandDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: VOLT,
  },
  brandText: {
    color: WHITE,
    fontSize: 56,
    fontWeight: "900",
    letterSpacing: -2,
  },
  bottomContent: {
    position: "absolute",
    bottom: 110,
    left: 80,
    right: 80,
  },
  bookStrip: {
    marginBottom: 60,
  },
  bookLabel: {
    color: VOLT,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 6,
    marginBottom: 18,
  },
  bookTitle: {
    color: WHITE,
    fontSize: 72,
    fontWeight: "900",
    letterSpacing: -2.5,
    lineHeight: 78,
    marginBottom: 14,
  },
  bookAuthor: {
    color: SOFT_WHITE,
    fontSize: 36,
    fontWeight: "600",
  },
  statRow: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "rgba(205,255,0,0.35)",
    paddingVertical: 44,
    paddingHorizontal: 40,
  },
  paceBlock: {
    flex: 1.2,
    justifyContent: "center",
    gap: 18,
  },
  paceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  speedTick: {
    width: 10,
    height: 24,
    borderRadius: 2,
    backgroundColor: VOLT,
    opacity: 0.7,
  },
  speedTickMid: {
    height: 32,
    opacity: 1,
  },
  paceLabel: {
    color: VOLT,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 4,
    marginLeft: 12,
  },
  paceValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 14,
  },
  paceValue: {
    color: WHITE,
    fontSize: 110,
    fontWeight: "900",
    letterSpacing: -5,
    fontStyle: "italic",
  },
  paceUnit: {
    color: SOFT_WHITE,
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  statDivider: {
    width: 2,
    marginHorizontal: 32,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  pagesBlock: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 6,
  },
  pagesLabel: {
    color: VOLT,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 4,
    marginBottom: 8,
  },
  pagesValue: {
    color: WHITE,
    fontSize: 110,
    fontWeight: "900",
    letterSpacing: -5,
    fontStyle: "italic",
  },
  pagesUnit: {
    color: SOFT_WHITE,
    fontSize: 26,
    fontWeight: "600",
  },
});
