import { BadgeItem } from "@/components/BadgeItem";
import { CapiMascot } from "@/components/CapiMascot";
import { useApp, getLevel, Session } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Line as SvgLine, Text as SvgText } from "react-native-svg";

const WEEKDAY_LABELS = ["S", "T", "Q", "Q", "S", "S", "D"];
const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function pagesOf(s: Session): number {
  return Math.max(0, s.endPage - s.startPage);
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  const dow = (out.getDay() + 6) % 7; // Mon=0
  out.setDate(out.getDate() - dow);
  return out;
}

interface WeekBucket {
  weekStart: Date;
  pages: number;
}

function build12WeekTrend(sessions: Session[]): WeekBucket[] {
  const today = new Date();
  const thisWeekStart = startOfWeek(today);
  const buckets: WeekBucket[] = [];
  for (let i = 11; i >= 0; i--) {
    const ws = new Date(thisWeekStart);
    ws.setDate(ws.getDate() - i * 7);
    buckets.push({ weekStart: ws, pages: 0 });
  }
  for (const s of sessions) {
    const sd = new Date(s.date);
    if (isNaN(sd.getTime())) continue;
    const wkStart = startOfWeek(sd);
    const idx = buckets.findIndex(
      (b) => b.weekStart.getTime() === wkStart.getTime()
    );
    if (idx >= 0) buckets[idx].pages += pagesOf(s);
  }
  return buckets;
}

interface CalendarDay {
  day: number;
  date: Date;
  inMonth: boolean;
  pages: number;
  isFuture: boolean;
  isToday: boolean;
}

function buildMonthCalendar(
  sessions: Session[],
  year: number,
  month: number
): CalendarDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pagesByDate = new Map<string, number>();
  for (const s of sessions) {
    const sd = new Date(s.date);
    if (isNaN(sd.getTime())) continue;
    const k = dateKey(sd);
    pagesByDate.set(k, (pagesByDate.get(k) ?? 0) + pagesOf(s));
  }

  const first = new Date(year, month, 1);
  const firstDow = (first.getDay() + 6) % 7; // Mon=0
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - firstDow);

  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push({
      day: d.getDate(),
      date: d,
      inMonth: d.getMonth() === month,
      pages: pagesByDate.get(dateKey(d)) ?? 0,
      isFuture: d.getTime() > today.getTime(),
      isToday: d.getTime() === today.getTime(),
    });
  }
  // Trim trailing empty week
  while (days.length > 35 && days.slice(-7).every((d) => !d.inMonth)) {
    days.length = days.length - 7;
  }
  return days;
}

function computeStreakWeeks(sessions: Session[]): number {
  if (sessions.length === 0) return 0;
  const today = new Date();
  let weekStart = startOfWeek(today);
  const weeksWithReading = new Set<number>();
  for (const s of sessions) {
    const sd = new Date(s.date);
    if (isNaN(sd.getTime())) continue;
    weeksWithReading.add(startOfWeek(sd).getTime());
  }
  let count = 0;
  // include this week even if no reading yet? Strava counts only completed weeks of activity; we count consecutive completed-or-current weeks with ≥1 session
  while (weeksWithReading.has(weekStart.getTime())) {
    count++;
    const prev = new Date(weekStart);
    prev.setDate(prev.getDate() - 7);
    weekStart = prev;
  }
  return count;
}

interface TrendChartProps {
  data: WeekBucket[];
  width: number;
  color: string;
  fill: string;
  axisColor: string;
  labelColor: string;
}

function TrendChart({
  data,
  width,
  color,
  fill,
  axisColor,
  labelColor,
}: TrendChartProps) {
  const height = 160;
  const padLeft = 8;
  const padRight = 44;
  const padTop = 12;
  const padBottom = 24;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const max = Math.max(1, ...data.map((d) => d.pages));
  // Round max for nice axis (e.g. up to nearest 50)
  const niceMax = max <= 50 ? Math.ceil(max / 10) * 10 : Math.ceil(max / 50) * 50;
  const half = niceMax / 2;

  const pts = data.map((d, i) => {
    const x = padLeft + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);
    const y = padTop + chartH - (d.pages / niceMax) * chartH;
    return { x, y };
  });

  let path = "";
  if (pts.length > 0) {
    path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      path += ` L ${pts[i].x} ${pts[i].y}`;
    }
  }
  const areaPath =
    pts.length > 0
      ? `${path} L ${pts[pts.length - 1].x} ${padTop + chartH} L ${pts[0].x} ${
          padTop + chartH
        } Z`
      : "";

  const yLineFull = padTop;
  const yLineHalf = padTop + chartH / 2;
  const yLineZero = padTop + chartH;

  // Month labels: find indices where month changes
  const monthLabels: Array<{ x: number; label: string }> = [];
  let lastMonth = -1;
  data.forEach((d, i) => {
    const m = d.weekStart.getMonth();
    if (m !== lastMonth) {
      lastMonth = m;
      const x = padLeft + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);
      monthLabels.push({ x, label: MONTH_NAMES[m].slice(0, 3).toUpperCase() });
    }
  });

  return (
    <Svg width={width} height={height}>
      {/* horizontal guides */}
      <SvgLine
        x1={padLeft}
        x2={padLeft + chartW}
        y1={yLineFull}
        y2={yLineFull}
        stroke={axisColor}
        strokeWidth={1}
      />
      <SvgLine
        x1={padLeft}
        x2={padLeft + chartW}
        y1={yLineHalf}
        y2={yLineHalf}
        stroke={axisColor}
        strokeWidth={1}
        opacity={0.4}
      />
      <SvgLine
        x1={padLeft}
        x2={padLeft + chartW}
        y1={yLineZero}
        y2={yLineZero}
        stroke={axisColor}
        strokeWidth={1}
        opacity={0.4}
      />
      {/* right-axis labels */}
      <SvgText
        x={padLeft + chartW + 6}
        y={yLineFull + 4}
        fill={labelColor}
        fontSize={10}
        fontWeight="600"
      >
        {`${niceMax} pág`}
      </SvgText>
      <SvgText
        x={padLeft + chartW + 6}
        y={yLineHalf + 4}
        fill={labelColor}
        fontSize={10}
        fontWeight="600"
      >
        {`${half} pág`}
      </SvgText>
      <SvgText
        x={padLeft + chartW + 6}
        y={yLineZero + 4}
        fill={labelColor}
        fontSize={10}
        fontWeight="600"
      >
        0
      </SvgText>
      {/* area + line */}
      {areaPath !== "" && <Path d={areaPath} fill={fill} />}
      {path !== "" && (
        <Path d={path} stroke={color} strokeWidth={2} fill="none" />
      )}
      {/* month labels */}
      {monthLabels.map((m, i) => (
        <SvgText
          key={i}
          x={m.x}
          y={height - 6}
          fill={labelColor}
          fontSize={10}
          fontWeight="700"
          textAnchor="middle"
        >
          {m.label}
        </SvgText>
      ))}
    </Svg>
  );
}

interface MonthlyBarsProps {
  sessions: Session[];
  year: number;
  month: number;
  width: number;
  height: number;
  color: string;
  mutedColor: string;
}

function MonthlyBars({
  sessions,
  year,
  month,
  width,
  height,
  color,
  mutedColor,
}: MonthlyBarsProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const pagesByDay = new Array<number>(daysInMonth).fill(0);
  for (const s of sessions) {
    const sd = new Date(s.date);
    if (isNaN(sd.getTime())) continue;
    if (sd.getFullYear() !== year || sd.getMonth() !== month) continue;
    pagesByDay[sd.getDate() - 1] += pagesOf(s);
  }
  const max = Math.max(1, ...pagesByDay);
  const gap = 3;
  const barW = (width - gap * (daysInMonth - 1)) / daysInMonth;
  const minBarH = 4;
  const today = new Date();
  const todayIdx =
    today.getFullYear() === year && today.getMonth() === month
      ? today.getDate() - 1
      : -1;
  return (
    <Svg width={width} height={height}>
      {pagesByDay.map((p, i) => {
        const h = p > 0 ? Math.max(minBarH, (p / max) * height) : minBarH;
        const x = i * (barW + gap);
        const y = height - h;
        const isToday = i === todayIdx;
        return (
          <Path
            key={i}
            d={`M ${x} ${y} h ${barW} v ${h} h ${-barW} Z`}
            fill={p > 0 ? color : mutedColor}
            opacity={p > 0 ? (isToday ? 1 : 0.85) : 0.35}
          />
        );
      })}
    </Svg>
  );
}

export default function PerfilScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { books, sessions, badges, xp, folego } = useApp();

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = Platform.OS === "web" ? 34 : 0;
  const screenWidth = Dimensions.get("window").width;
  const chartContentWidth = Math.min(screenWidth - 40 - 32, 480);

  const { current: levelInfo, next: nextLevelInfo } = getLevel(xp);
  const progress =
    nextLevelInfo.minXP > levelInfo.minXP
      ? (xp - levelInfo.minXP) / (nextLevelInfo.minXP - levelInfo.minXP)
      : 1;

  const totalPages = sessions.reduce((acc, s) => acc + pagesOf(s), 0);
  const booksRead = books.filter((b) => b.status === "read").length;
  const bestPace = sessions.reduce((max, s) => Math.max(max, s.pace), 0);
  const bestSession = sessions.reduce(
    (max, s) => Math.max(max, pagesOf(s)),
    0
  );

  const featuredBadges = badges.filter((b) => b.unlocked).slice(0, 3);

  // This week metrics
  const today = new Date();
  const thisWeekStart = startOfWeek(today);
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);

  const thisWeekSessions = useMemo(
    () =>
      sessions.filter((s) => {
        const sd = new Date(s.date);
        return (
          !isNaN(sd.getTime()) &&
          sd.getTime() >= thisWeekStart.getTime() &&
          sd.getTime() < thisWeekEnd.getTime()
        );
      }),
    [sessions, thisWeekStart, thisWeekEnd]
  );

  const thisWeekPages = thisWeekSessions.reduce(
    (acc, s) => acc + pagesOf(s),
    0
  );
  const thisWeekTime = thisWeekSessions.reduce(
    (acc, s) => acc + s.durationSeconds,
    0
  );
  const thisWeekCount = thisWeekSessions.length;

  // 12-week trend
  const trend = useMemo(() => build12WeekTrend(sessions), [sessions]);

  // Current month + previous month
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const prevDate = new Date(currentYear, currentMonth - 1, 1);
  const prevMonth = prevDate.getMonth();
  const prevYear = prevDate.getFullYear();

  const monthCalendar = useMemo(
    () => buildMonthCalendar(sessions, currentYear, currentMonth),
    [sessions, currentYear, currentMonth]
  );

  const streakWeeks = useMemo(() => computeStreakWeeks(sessions), [sessions]);
  const monthSessionCount = useMemo(
    () =>
      sessions.filter((s) => {
        const sd = new Date(s.date);
        return (
          !isNaN(sd.getTime()) &&
          sd.getFullYear() === currentYear &&
          sd.getMonth() === currentMonth
        );
      }).length,
    [sessions, currentYear, currentMonth]
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topInset + 16, paddingBottom: 100 + bottomInset },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.profileHeader}>
        <CapiMascot state="waving" size={72} />
        <View style={styles.profileInfo}>
          <Text style={[styles.levelName, { color: colors.accentText }]}>
            {levelInfo.name}
          </Text>
          <View style={[styles.xpBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.xpFill,
                {
                  backgroundColor: colors.volt,
                  width: `${Math.round(progress * 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.xpText, { color: colors.mutedForeground }]}>
            {xp} XP · faltam {nextLevelInfo.minXP - xp} pro próximo nível
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/settings")}>
          <Ionicons
            name="settings-outline"
            size={22}
            color={colors.mutedForeground}
          />
        </TouchableOpacity>
      </View>

      {/* This week trio (Strava-like) */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Esta semana
        </Text>
        <View
          style={[
            styles.weekTrioCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.weekTrio}>
            <View style={styles.weekTrioItem}>
              <Text
                style={[styles.weekTrioLabel, { color: colors.mutedForeground }]}
              >
                Páginas
              </Text>
              <Text style={[styles.weekTrioValue, { color: colors.foreground }]}>
                {thisWeekPages}
              </Text>
            </View>
            <View style={styles.weekTrioItem}>
              <Text
                style={[styles.weekTrioLabel, { color: colors.mutedForeground }]}
              >
                Tempo
              </Text>
              <Text style={[styles.weekTrioValue, { color: colors.foreground }]}>
                {formatDuration(thisWeekTime)}
              </Text>
            </View>
            <View style={styles.weekTrioItem}>
              <Text
                style={[styles.weekTrioLabel, { color: colors.mutedForeground }]}
              >
                Sessões
              </Text>
              <Text style={[styles.weekTrioValue, { color: colors.foreground }]}>
                {thisWeekCount}
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.trendLabel,
              { color: colors.mutedForeground, marginTop: 18 },
            ]}
          >
            Últimas 12 semanas
          </Text>
          <View style={styles.chartWrap}>
            <TrendChart
              data={trend}
              width={chartContentWidth}
              color={colors.accentText}
              fill={`${colors.volt}55`}
              axisColor={colors.border}
              labelColor={colors.mutedForeground}
            />
          </View>
        </View>
      </View>

      {/* Personal Bests */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Seus recordes (e a Capi se orgulha)
        </Text>
        <View style={styles.bests}>
          {[
            { icon: "book", label: "Livros fechados", value: booksRead.toString() },
            {
              icon: "document-text",
              label: "Páginas viradas",
              value: totalPages.toString(),
            },
            {
              icon: "speedometer",
              label: "Maior velocidade",
              value: bestPace > 0 ? `${bestPace >= 100 ? Math.min(999, Math.round(bestPace)) : bestPace.toFixed(1)} pág./min` : "—",
            },
            {
              icon: "trophy",
              label: "Maratona maior",
              value: bestSession > 0 ? `${bestSession} págs` : "—",
            },
            { icon: "flame", label: "Fôlego máximo", value: `${folego} dias` },
          ].map((item, i) => (
            <View
              key={i}
              style={[
                styles.bestCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Ionicons
                name={item.icon as never}
                size={20}
                color={colors.accentText}
              />
              <Text style={[styles.bestValue, { color: colors.foreground }]}>
                {item.value}
              </Text>
              <Text style={[styles.bestLabel, { color: colors.mutedForeground }]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Monthly calendar */}
      <View style={styles.section}>
        <View style={styles.monthHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>
            {MONTH_NAMES[currentMonth]} {currentYear}
          </Text>
          <View
            style={[
              styles.streakPill,
              {
                backgroundColor:
                  streakWeeks > 0 ? `${colors.volt}22` : colors.secondary,
                borderColor:
                  streakWeeks > 0 ? colors.accentBorder : colors.border,
              },
            ]}
          >
            <Ionicons
              name="flame"
              size={12}
              color={streakWeeks > 0 ? colors.accentText : colors.mutedForeground}
            />
            <Text
              style={[
                styles.streakPillText,
                {
                  color:
                    streakWeeks > 0 ? colors.accentText : colors.mutedForeground,
                },
              ]}
            >
              {streakWeeks} {streakWeeks === 1 ? "semana" : "semanas"}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.calendarCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.calendarStatsRow}>
            <View style={styles.calendarStat}>
              <Text
                style={[styles.calendarStatLabel, { color: colors.mutedForeground }]}
              >
                Sua sequência
              </Text>
              <Text
                style={[styles.calendarStatValue, { color: colors.foreground }]}
              >
                {streakWeeks} {streakWeeks === 1 ? "semana" : "semanas"}
              </Text>
            </View>
            <View
              style={[styles.calendarStatDivider, { backgroundColor: colors.border }]}
            />
            <View style={styles.calendarStat}>
              <Text
                style={[styles.calendarStatLabel, { color: colors.mutedForeground }]}
              >
                Sessões no mês
              </Text>
              <Text
                style={[styles.calendarStatValue, { color: colors.foreground }]}
              >
                {monthSessionCount}
              </Text>
            </View>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAY_LABELS.map((l, i) => (
              <Text
                key={i}
                style={[styles.weekdayLabel, { color: colors.mutedForeground }]}
              >
                {l}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {monthCalendar.map((day, i) => {
              const read = day.pages > 0;
              const muted = !day.inMonth || day.isFuture;
              const monthLabel = MONTH_NAMES[day.date.getMonth()];
              const a11yLabel = read
                ? `Dia ${day.day} de ${monthLabel}, ${day.pages} ${
                    day.pages === 1 ? "página lida" : "páginas lidas"
                  }`
                : `Dia ${day.day} de ${monthLabel}${
                    day.isToday ? ", hoje" : ""
                  }${day.isFuture ? ", futuro" : ", sem leitura"}`;
              return (
                <View
                  key={i}
                  style={[
                    styles.calendarCell,
                    muted && styles.calendarCellMuted,
                  ]}
                  accessible
                  accessibilityRole="text"
                  accessibilityLabel={a11yLabel}
                >
                  <View
                    style={[
                      styles.calendarDay,
                      read && {
                        backgroundColor: colors.volt,
                        borderColor: colors.accentBorder,
                      },
                      !read &&
                        day.isToday && {
                          borderColor: colors.accentText,
                          borderWidth: 1.5,
                        },
                      !read &&
                        !day.isToday && {
                          backgroundColor: colors.secondary,
                          borderColor: colors.border,
                        },
                    ]}
                  >
                    {read ? (
                      <Ionicons
                        name="book"
                        size={12}
                        color={colors.accentForeground}
                      />
                    ) : (
                      <Text
                        style={[
                          styles.calendarDayText,
                          {
                            color: muted
                              ? `${colors.mutedForeground}66`
                              : colors.foreground,
                            fontWeight: day.isToday ? "900" : "600",
                          },
                        ]}
                      >
                        {day.day}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Previous month recap */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Retrospectiva
        </Text>
        <View
          style={[
            styles.recapCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.recapHeader}>
            <View>
              <Text style={[styles.recapMonth, { color: colors.accentText }]}>
                {MONTH_NAMES[prevMonth]}
              </Text>
              <Text style={[styles.recapYear, { color: colors.foreground }]}>
                {prevYear}
              </Text>
            </View>
            <MonthlyBars
              sessions={sessions}
              year={prevYear}
              month={prevMonth}
              width={Math.min(chartContentWidth * 0.55, 220)}
              height={80}
              color={colors.accentText}
              mutedColor={colors.border}
            />
          </View>
        </View>
      </View>

      {/* Featured Badges */}
      {featuredBadges.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Medalhas em destaque
          </Text>
          <View style={styles.featuredBadges}>
            {featuredBadges.map((badge) => (
              <BadgeItem key={badge.id} badge={badge} />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 28,
  },
  profileInfo: { flex: 1, gap: 6 },
  levelName: { fontSize: 18, fontWeight: "900", letterSpacing: -0.5 },
  xpBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  xpFill: { height: "100%", borderRadius: 3 },
  xpText: { fontSize: 11 },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  weekTrioCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  weekTrio: { flexDirection: "row", justifyContent: "space-between" },
  weekTrioItem: { flex: 1, gap: 4 },
  weekTrioLabel: { fontSize: 12, fontWeight: "600" },
  weekTrioValue: { fontSize: 22, fontWeight: "900", letterSpacing: -1 },
  trendLabel: { fontSize: 11, fontWeight: "700" },
  chartWrap: { alignItems: "center", marginTop: 4 },
  bests: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  bestCard: {
    width: "47%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  bestValue: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  bestLabel: { fontSize: 11 },
  monthHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  streakPillText: { fontSize: 12, fontWeight: "800" },
  calendarCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  calendarStatsRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  calendarStat: { flex: 1, gap: 2 },
  calendarStatLabel: { fontSize: 11, fontWeight: "600" },
  calendarStatValue: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  calendarStatDivider: { width: 1, height: 36 },
  weekdayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weekdayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 3,
  },
  calendarCellMuted: { opacity: 0.4 },
  calendarDay: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDayText: { fontSize: 12 },
  recapCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  recapHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  recapMonth: { fontSize: 24, fontWeight: "900", letterSpacing: -1 },
  recapYear: { fontSize: 28, fontWeight: "900", letterSpacing: -1 },
  featuredBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
});
