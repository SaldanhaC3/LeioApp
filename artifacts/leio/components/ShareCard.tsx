import { CapiMascot } from "@/components/CapiMascot";
import type { Book } from "@/contexts/AppContext";
import { LinearGradient } from "expo-linear-gradient";
import React, { forwardRef } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import ViewShot, { type ViewShotRef } from "react-native-view-shot";

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1920;
const VOLT = "#CDFF00";
const BLACK = "#0A0A0A";
const OFF_WHITE = "#FAFAF8";
const MUTED = "#BBBBBB";

export type ShareTemplateId = "storiesPhoto" | "framed" | "classic";

export interface ShareTemplateMeta {
  id: ShareTemplateId;
  label: string;
}

export const SHARE_TEMPLATES: ShareTemplateMeta[] = [
  { id: "storiesPhoto", label: "Stories" },
  { id: "framed", label: "Moldura" },
  { id: "classic", label: "Clássico" },
];

export interface ShareCardData {
  book: Book;
  pages: number;
  durationSeconds: number;
  pace: number;
  motivationalPhrase: string;
  backgroundPhoto?: string;
}

interface ShareCardProps extends ShareCardData {
  template: ShareTemplateId;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}min`;
  return `${m}min ${s}s`;
}

function StatWithArrow({
  value,
  label,
  arrowSide = "left",
}: {
  value: string;
  label: string;
  arrowSide?: "left" | "right";
}) {
  const isLeft = arrowSide === "left";
  return (
    <View
      style={[
        styles.statArrowRow,
        { flexDirection: isLeft ? "row" : "row-reverse" },
      ]}
    >
      <View style={{ alignItems: isLeft ? "flex-start" : "flex-end" }}>
        <Text style={styles.statArrowValue}>{value}</Text>
        <Text style={styles.statArrowLabel}>{label}</Text>
      </View>
      <View style={styles.arrowWrap}>
        <View
          style={[
            styles.arrowLine,
            isLeft ? { marginLeft: 8 } : { marginRight: 8 },
          ]}
        />
        <View
          style={[
            styles.arrowHead,
            isLeft
              ? { borderRightWidth: 0, borderLeftWidth: 22 }
              : { borderLeftWidth: 0, borderRightWidth: 22 },
          ]}
        />
      </View>
    </View>
  );
}

function StoriesPhotoTemplate({
  book,
  pages,
  durationSeconds,
  pace,
  backgroundPhoto,
}: ShareCardData) {
  return (
    <View style={styles.card}>
      {backgroundPhoto ? (
        <Image
          source={{ uri: backgroundPhoto }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: book.coverColor },
          ]}
        />
      )}
      <LinearGradient
        colors={["rgba(0,0,0,0.55)", "rgba(0,0,0,0.15)", "rgba(0,0,0,0.85)"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.storiesContent}>
        <View style={styles.storiesHeader}>
          <Text style={styles.logoSmall}>leio</Text>
          <View style={styles.logoDotSmall} />
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.storiesStats}>
          <StatWithArrow
            value={String(pages)}
            label="PÁGINAS"
            arrowSide="left"
          />
          <View style={{ height: 50 }} />
          <StatWithArrow
            value={formatDuration(durationSeconds)}
            label="TEMPO"
            arrowSide="right"
          />
          <View style={{ height: 50 }} />
          <StatWithArrow
            value={pace > 0 ? pace.toFixed(1) : "—"}
            label="PÁGS/MIN"
            arrowSide="left"
          />
        </View>

        <View style={styles.storiesBookInfo}>
          <Text style={styles.storiesBookTitle} numberOfLines={2}>
            {book.title}
          </Text>
          <Text style={styles.storiesBookAuthor} numberOfLines={1}>
            {book.author}
          </Text>
        </View>
      </View>
    </View>
  );
}

function FramedTemplate({
  book,
  pages,
  durationSeconds,
  pace,
  backgroundPhoto,
}: ShareCardData) {
  return (
    <View style={[styles.card, { backgroundColor: BLACK }]}>
      <View style={styles.framedCheckerTop}>
        {Array.from({ length: 24 }).map((_, i) => (
          <View
            key={`t-${i}`}
            style={[
              styles.checkerCell,
              { backgroundColor: i % 2 === 0 ? VOLT : BLACK },
            ]}
          />
        ))}
      </View>

      <View style={styles.framedPhotoWrap}>
        {backgroundPhoto ? (
          <Image
            source={{ uri: backgroundPhoto }}
            style={styles.framedPhoto}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[styles.framedPhoto, { backgroundColor: book.coverColor }]}
          >
            <Text style={styles.framedCoverTitle} numberOfLines={3}>
              {book.title}
            </Text>
          </View>
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.6)"]}
          style={styles.framedPhotoOverlay}
        />
      </View>

      <View style={styles.framedCheckerTop}>
        {Array.from({ length: 24 }).map((_, i) => (
          <View
            key={`b-${i}`}
            style={[
              styles.checkerCell,
              { backgroundColor: i % 2 === 0 ? BLACK : VOLT },
            ]}
          />
        ))}
      </View>

      <View style={styles.framedBottom}>
        <Text style={styles.framedBookTitle} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.framedBookAuthor} numberOfLines={1}>
          {book.author}
        </Text>

        <View style={styles.framedStatsRow}>
          <View style={styles.framedStatBox}>
            <Text style={styles.framedStatValue}>{pages}</Text>
            <Text style={styles.framedStatLabel}>páginas</Text>
          </View>
          <View style={styles.framedStatBox}>
            <Text style={styles.framedStatValue}>
              {formatDuration(durationSeconds)}
            </Text>
            <Text style={styles.framedStatLabel}>tempo</Text>
          </View>
          <View style={styles.framedStatBox}>
            <Text style={styles.framedStatValue}>
              {pace > 0 ? pace.toFixed(1) : "—"}
            </Text>
            <Text style={styles.framedStatLabel}>págs/min</Text>
          </View>
        </View>

        <View style={styles.framedFooter}>
          <CapiMascot state="celebrating" size={120} />
          <Text style={styles.framedLogo}>leio</Text>
        </View>
      </View>
    </View>
  );
}

function ClassicTemplate({
  book,
  pages,
  durationSeconds,
  pace,
  motivationalPhrase,
}: ShareCardData) {
  return (
    <View style={[styles.card, { backgroundColor: BLACK, padding: 80, paddingTop: 120, paddingBottom: 100 }]}>
      <View style={styles.classicHeader}>
        <Text style={styles.logo}>leio</Text>
        <View style={styles.logoDot} />
      </View>

      <View style={styles.classicCoverWrap}>
        <View style={[styles.classicCover, { backgroundColor: book.coverColor }]}>
          <Text style={styles.classicCoverTitle} numberOfLines={4}>
            {book.title}
          </Text>
          <Text style={styles.classicCoverAuthor} numberOfLines={2}>
            {book.author}
          </Text>
        </View>
      </View>

      <View style={styles.classicBookInfo}>
        <Text style={styles.classicTitle} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.classicAuthor} numberOfLines={1}>
          {book.author}
        </Text>
      </View>

      <View style={styles.classicStatsRow}>
        <View style={styles.classicStatBox}>
          <Text style={styles.classicStatValue}>{pages}</Text>
          <Text style={styles.classicStatLabel}>páginas</Text>
        </View>
        <View style={styles.classicDivider} />
        <View style={styles.classicStatBox}>
          <Text style={styles.classicStatValue}>{formatDuration(durationSeconds)}</Text>
          <Text style={styles.classicStatLabel}>tempo</Text>
        </View>
        <View style={styles.classicDivider} />
        <View style={styles.classicStatBox}>
          <Text style={styles.classicStatValue}>{pace > 0 ? pace.toFixed(1) : "—"}</Text>
          <Text style={styles.classicStatLabel}>págs/min</Text>
        </View>
      </View>

      <View style={styles.classicPhraseWrap}>
        <Text style={styles.classicPhrase}>{motivationalPhrase}</Text>
      </View>

      <View style={styles.classicFooter}>
        <View style={styles.classicCapi}>
          <CapiMascot state="celebrating" size={180} />
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.classicFooterLabel}>registrado no</Text>
          <Text style={styles.classicFooterBrand}>leio</Text>
        </View>
      </View>
    </View>
  );
}

export const ShareCard = forwardRef<ViewShotRef, ShareCardProps>(
  ({ template, ...data }, ref) => {
    return (
      <ViewShot
        ref={ref}
        options={{ format: "png", quality: 1, width: CARD_WIDTH, height: CARD_HEIGHT }}
        style={styles.shotWrapper}
      >
        {template === "storiesPhoto" && <StoriesPhotoTemplate {...data} />}
        {template === "framed" && <FramedTemplate {...data} />}
        {template === "classic" && <ClassicTemplate {...data} />}
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
    overflow: "hidden",
    backgroundColor: BLACK,
  },

  // Stories Photo template
  storiesContent: {
    flex: 1,
    paddingHorizontal: 80,
    paddingTop: 120,
    paddingBottom: 140,
  },
  storiesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  logoSmall: {
    color: VOLT,
    fontSize: 72,
    fontWeight: "900",
    letterSpacing: -3,
  },
  logoDotSmall: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: VOLT,
    marginTop: 40,
  },
  storiesStats: {
    marginBottom: 80,
  },
  statArrowRow: {
    alignItems: "center",
    gap: 0,
  },
  statArrowValue: {
    color: OFF_WHITE,
    fontSize: 200,
    fontWeight: "900",
    letterSpacing: -8,
    lineHeight: 210,
  },
  statArrowLabel: {
    color: VOLT,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 4,
    marginTop: -4,
  },
  arrowWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  arrowLine: {
    flex: 1,
    height: 8,
    backgroundColor: VOLT,
  },
  arrowHead: {
    width: 0,
    height: 0,
    borderTopWidth: 18,
    borderBottomWidth: 18,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: VOLT,
    borderRightColor: VOLT,
  },
  storiesBookInfo: {
    borderLeftWidth: 6,
    borderLeftColor: VOLT,
    paddingLeft: 24,
  },
  storiesBookTitle: {
    color: OFF_WHITE,
    fontSize: 56,
    fontWeight: "900",
    letterSpacing: -2,
  },
  storiesBookAuthor: {
    color: MUTED,
    fontSize: 36,
    fontWeight: "600",
    marginTop: 8,
  },

  // Framed template
  framedCheckerTop: {
    flexDirection: "row",
    width: CARD_WIDTH,
    height: 60,
  },
  checkerCell: {
    width: CARD_WIDTH / 24,
    height: 60,
  },
  framedPhotoWrap: {
    width: CARD_WIDTH,
    height: 1080,
    position: "relative",
  },
  framedPhoto: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
  },
  framedPhotoOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 240,
  },
  framedCoverTitle: {
    color: OFF_WHITE,
    fontSize: 80,
    fontWeight: "900",
    letterSpacing: -3,
    textAlign: "center",
    lineHeight: 90,
  },
  framedBottom: {
    flex: 1,
    paddingHorizontal: 80,
    paddingTop: 40,
    paddingBottom: 80,
  },
  framedBookTitle: {
    color: OFF_WHITE,
    fontSize: 56,
    fontWeight: "900",
    letterSpacing: -2,
    textAlign: "center",
  },
  framedBookAuthor: {
    color: MUTED,
    fontSize: 32,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 40,
  },
  framedStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: 10,
    marginBottom: 30,
  },
  framedStatBox: {
    alignItems: "center",
    gap: 6,
  },
  framedStatValue: {
    color: VOLT,
    fontSize: 90,
    fontWeight: "900",
    letterSpacing: -3,
  },
  framedStatLabel: {
    color: MUTED,
    fontSize: 26,
    fontWeight: "600",
  },
  framedFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
  },
  framedLogo: {
    color: VOLT,
    fontSize: 72,
    fontWeight: "900",
    letterSpacing: -3,
  },

  // Classic template (legacy)
  classicHeader: {
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
  classicCoverWrap: {
    alignItems: "center",
    marginBottom: 60,
  },
  classicCover: {
    width: 480,
    height: 720,
    borderRadius: 16,
    padding: 40,
    justifyContent: "space-between",
  },
  classicCoverTitle: {
    color: OFF_WHITE,
    fontSize: 64,
    fontWeight: "900",
    letterSpacing: -2,
    lineHeight: 70,
  },
  classicCoverAuthor: {
    color: OFF_WHITE,
    opacity: 0.8,
    fontSize: 36,
    fontWeight: "600",
  },
  classicBookInfo: {
    alignItems: "center",
    marginBottom: 60,
    gap: 12,
  },
  classicTitle: {
    color: OFF_WHITE,
    fontSize: 64,
    fontWeight: "900",
    letterSpacing: -2,
    textAlign: "center",
  },
  classicAuthor: {
    color: MUTED,
    fontSize: 40,
    fontWeight: "600",
    textAlign: "center",
  },
  classicStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#141414",
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 30,
    marginBottom: 60,
  },
  classicStatBox: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  classicStatValue: {
    color: VOLT,
    fontSize: 64,
    fontWeight: "900",
    letterSpacing: -2,
  },
  classicStatLabel: {
    color: MUTED,
    fontSize: 28,
    fontWeight: "600",
  },
  classicDivider: {
    width: 2,
    height: 80,
    backgroundColor: "#2A2A2A",
  },
  classicPhraseWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  classicPhrase: {
    color: OFF_WHITE,
    fontSize: 48,
    fontWeight: "700",
    letterSpacing: -1,
    textAlign: "center",
    lineHeight: 60,
  },
  classicFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  classicCapi: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  classicFooterLabel: {
    color: MUTED,
    fontSize: 28,
    fontWeight: "600",
  },
  classicFooterBrand: {
    color: VOLT,
    fontSize: 56,
    fontWeight: "900",
    letterSpacing: -2,
  },
});
