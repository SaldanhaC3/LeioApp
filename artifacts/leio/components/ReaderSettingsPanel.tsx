import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface ReaderSettings {
  fontSize: number;
  lineHeight: number;
  theme: "light" | "sepia" | "dark";
  fontFamily: "serif" | "sans-serif";
  brightness: number;
  textAlign: "left" | "justify";
}

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  fontSize: 17,
  lineHeight: 1.6,
  theme: "sepia",
  fontFamily: "serif",
  brightness: 1.0,
  textAlign: "justify",
};

interface ReaderSettingsPanelProps {
  visible: boolean;
  settings: ReaderSettings;
  onSettingsChange: (s: ReaderSettings) => void;
  onClose: () => void;
}

const PANEL_THEMES = {
  light: { background: "#FFFFFF", text: "#1A1A1A", surface: "#F5F5F5", border: "#E0E0E0", accent: "#CDFF00", accentFg: "#1A1A1A" },
  sepia: { background: "#F4E9D8", text: "#3B2F2F", surface: "#EDE0C8", border: "#D9CAB0", accent: "#CDFF00", accentFg: "#1A1A1A" },
  dark: { background: "#141414", text: "#E8E8E8", surface: "#1E1E1E", border: "#2A2A2A", accent: "#CDFF00", accentFg: "#141414" },
};

const THEME_CIRCLES: { id: ReaderSettings["theme"]; bg: string; label: string }[] = [
  { id: "light", bg: "#FFFFFF", label: "Claro" },
  { id: "sepia", bg: "#F4E9D8", label: "Sépia" },
  { id: "dark", bg: "#141414", label: "Escuro" },
];

const PANEL_HEIGHT = 330;

export default function ReaderSettingsPanel({
  visible,
  settings,
  onSettingsChange,
  onClose,
}: ReaderSettingsPanelProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(PANEL_HEIGHT + insets.bottom);
  const overlayOpacity = useSharedValue(0);

  const tc = PANEL_THEMES[settings.theme];

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 220 });
      translateY.value = withTiming(0, { duration: 280 });
    } else {
      overlayOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(PANEL_HEIGHT + insets.bottom, { duration: 260 });
    }
  }, [visible]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    pointerEvents: (overlayOpacity.value === 0 ? "none" : "auto") as "none" | "auto",
  }));

  function update(partial: Partial<ReaderSettings>) {
    onSettingsChange({ ...settings, ...partial });
  }

  function clamp(value: number, min: number, max: number, step: number) {
    return Math.min(max, Math.max(min, Math.round(value / step) * step));
  }

  if (!visible) return null;

  return (
    <>
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.45)", zIndex: 10 }, overlayStyle]}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.panel,
          {
            backgroundColor: tc.background,
            borderTopColor: tc.border,
            paddingBottom: insets.bottom + 20,
            zIndex: 11,
          },
          panelStyle,
        ]}
      >
        <View style={[styles.handle, { backgroundColor: tc.border }]} />

        <View style={styles.row}>
          <Text style={[styles.label, { color: tc.text }]}>Tamanho</Text>
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: tc.surface, borderColor: tc.border }]}
              onPress={() => update({ fontSize: clamp(settings.fontSize - 1, 14, 28, 1) })}
            >
              <Text style={[styles.btnText, { color: tc.text, fontSize: 18 }]}>A-</Text>
            </TouchableOpacity>
            <Text style={[styles.sizePreview, { color: tc.text, fontSize: settings.fontSize }]}>Aa</Text>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: tc.surface, borderColor: tc.border }]}
              onPress={() => update({ fontSize: clamp(settings.fontSize + 1, 14, 28, 1) })}
            >
              <Text style={[styles.btnText, { color: tc.text, fontSize: 18 }]}>A+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={[styles.label, { color: tc.text }]}>Espaçamento</Text>
          <View style={styles.controls}>
            {([1.2, 1.6, 2.0] as number[]).map((lh) => (
              <TouchableOpacity
                key={lh}
                style={[
                  styles.segBtn,
                  {
                    backgroundColor: settings.lineHeight === lh ? tc.accent : tc.surface,
                    borderColor: settings.lineHeight === lh ? tc.accent : tc.border,
                  },
                ]}
                onPress={() => update({ lineHeight: lh })}
              >
                <Text style={[styles.segText, { color: settings.lineHeight === lh ? tc.accentFg : tc.text }]}>
                  {lh === 1.2 ? "Compact" : lh === 1.6 ? "Normal" : "Wide"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <Text style={[styles.label, { color: tc.text }]}>Tema</Text>
          <View style={styles.themeRow}>
            {THEME_CIRCLES.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => update({ theme: t.id })}
                style={[
                  styles.themeCircle,
                  { backgroundColor: t.bg },
                  settings.theme === t.id && { borderColor: tc.accent, borderWidth: 3 },
                ]}
              >
                {settings.theme !== t.id && (
                  <View style={[styles.themeCircleBorder, { borderColor: "#888" }]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <Text style={[styles.label, { color: tc.text }]}>Fonte</Text>
          <View style={styles.controls}>
            <TouchableOpacity
              style={[
                styles.segBtn,
                {
                  backgroundColor: settings.fontFamily === "serif" ? tc.accent : tc.surface,
                  borderColor: settings.fontFamily === "serif" ? tc.accent : tc.border,
                },
              ]}
              onPress={() => update({ fontFamily: "serif" })}
            >
              <Text style={[styles.segText, { fontFamily: "serif", color: settings.fontFamily === "serif" ? tc.accentFg : tc.text }]}>
                Serifada
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segBtn,
                {
                  backgroundColor: settings.fontFamily === "sans-serif" ? tc.accent : tc.surface,
                  borderColor: settings.fontFamily === "sans-serif" ? tc.accent : tc.border,
                },
              ]}
              onPress={() => update({ fontFamily: "sans-serif" })}
            >
              <Text style={[styles.segText, { color: settings.fontFamily === "sans-serif" ? tc.accentFg : tc.text }]}>
                Sem Serifa
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segBtn,
                {
                  backgroundColor: settings.textAlign === "left" ? tc.accent : tc.surface,
                  borderColor: settings.textAlign === "left" ? tc.accent : tc.border,
                },
              ]}
              onPress={() => update({ textAlign: "left" })}
            >
              <Text style={[styles.segText, { color: settings.textAlign === "left" ? tc.accentFg : tc.text }]}>
                = Esq.
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segBtn,
                {
                  backgroundColor: settings.textAlign === "justify" ? tc.accent : tc.surface,
                  borderColor: settings.textAlign === "justify" ? tc.accent : tc.border,
                },
              ]}
              onPress={() => update({ textAlign: "justify" })}
            >
              <Text style={[styles.segText, { color: settings.textAlign === "justify" ? tc.accentFg : tc.text }]}>
                = Justif.
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    width: 84,
  },
  controls: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  btnText: {
    fontWeight: "700",
  },
  sizePreview: {
    fontWeight: "700",
    minWidth: 32,
    textAlign: "center",
  },
  segBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  segText: {
    fontSize: 12,
    fontWeight: "700",
  },
  themeRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  themeCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  themeCircleBorder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    position: "absolute",
  },
});
