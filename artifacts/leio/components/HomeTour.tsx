import React from "react";
import {
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type MeasureCallback = (x: number, y: number, width: number, height: number) => void;

// No react-native-web, measureInWindow não reflete o scroll de um ancestral
// scrollável — devolve a posição como se a página nunca tivesse rolado. No web o
// ref de um componente RN aponta pro nó DOM de verdade, então getBoundingClientRect
// (que já é relativo à viewport, scroll incluso) resolve. Nativo usa measureInWindow
// normalmente, que já funciona certo lá.
function measureTarget(target: any, cb: MeasureCallback) {
  if (Platform.OS === "web" && typeof target.getBoundingClientRect === "function") {
    const r = target.getBoundingClientRect();
    cb(r.left, r.top, r.width, r.height);
    return;
  }
  target.measureInWindow?.(cb);
}

export interface TourStep {
  ref: React.RefObject<View | null>;
  title: string;
  text: string;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface HomeTourProps {
  visible: boolean;
  steps: TourStep[];
  scrollRef: React.RefObject<any>;
  scrollYRef: React.RefObject<number>;
  colors: any;
  onFinish: () => void;
}

// App-tour da home (post-it note-5): ilumina cada parte da tela, uma de cada vez,
// escurecendo o resto, com um texto curto e didático. Some pra sempre depois da
// primeira vez que o usuário fecha ou termina (ver AsyncStorage em index.tsx).
//
// Usa só measureInWindow + scrollTo (em vez de measureLayout, que no react-native-web
// mede a posição ANTES do scroll assentar e joga o tooltip pra fora da tela) — mede a
// posição atual do alvo, calcula quanto falta rolar a partir do scrollY já conhecido, e
// remede depois do scroll pra desenhar o destaque no lugar certo.
export function HomeTour({ visible, steps, scrollRef, scrollYRef, colors, onFinish }: HomeTourProps) {
  const [index, setIndex] = React.useState(0);
  const [rect, setRect] = React.useState<Rect | null>(null);
  const screen = Dimensions.get("window");

  React.useEffect(() => {
    if (visible) setIndex(0);
  }, [visible]);

  React.useEffect(() => {
    if (!visible) return;
    const step = steps[index];
    const target = step?.ref.current as any;
    if (!target) return;

    let cancelled = false;
    setRect(null);
    const desiredTop = 120;

    // Logo após montar (ex: o 1º passo, sem precisar rolar nada), o layout pode
    // ainda não ter assentado — tenta de novo em vez de desistir na largura 0.
    function measureWithRetry(attempt = 0) {
      measureTarget(target, (x: number, y: number, width: number, height: number) => {
        if (cancelled) return;
        if (width === 0 && attempt < 6) {
          setTimeout(() => measureWithRetry(attempt + 1), 120);
          return;
        }
        onMeasured(x, y, width, height);
      });
    }

    function onMeasured(x: number, y: number, width: number, height: number) {
      if (cancelled || width === 0) return;
      const delta = y - desiredTop;
      if (Math.abs(delta) > 24 && scrollRef.current?.scrollTo) {
        const newY = Math.max(0, (scrollYRef.current ?? 0) + delta);
        scrollRef.current.scrollTo({ y: newY, animated: true });
        const remeasure = () =>
          measureTarget(target, (x2: number, y2: number, w2: number, h2: number) => {
            if (!cancelled && w2 > 0) setRect({ x: x2, y: y2, width: w2, height: h2 });
          });
        setTimeout(remeasure, 380);
        setTimeout(remeasure, 700);
      } else {
        setRect({ x, y, width, height });
      }
    }

    measureWithRetry();

    return () => {
      cancelled = true;
    };
  }, [index, visible, steps, scrollRef, scrollYRef]);

  if (!visible || steps.length === 0) return null;
  const step = steps[index];
  const isLast = index === steps.length - 1;
  const pad = 8;
  const top = rect ? Math.max(0, rect.y - pad) : 0;
  const left = rect ? Math.max(0, rect.x - pad) : 0;
  const width = rect ? rect.width + pad * 2 : 0;
  const height = rect ? rect.height + pad * 2 : 0;
  const tooltipBelow = !rect || rect.y < screen.height * 0.55;

  // Altura estimada do tooltip (título + texto + linha de botões) — usada só pra
  // travar a posição dentro da tela mesmo se a medição do alvo vier imprecisa
  // (ex: no preview web, onde o scroll animado às vezes ainda não assentou).
  const TOOLTIP_H = 190;
  const clampTop = (value: number) =>
    Math.min(Math.max(24, value), Math.max(24, screen.height - TOOLTIP_H - 24));
  const tooltipTop = rect
    ? tooltipBelow
      ? clampTop(top + height + 16)
      : clampTop(top - TOOLTIP_H)
    : clampTop(screen.height / 2 - TOOLTIP_H / 2);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onFinish}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        {rect ? (
          <>
            <View style={[styles.dim, { top: 0, left: 0, right: 0, height: top }]} />
            <View style={[styles.dim, { top: top + height, left: 0, right: 0, bottom: 0 }]} />
            <View style={[styles.dim, { top, left: 0, width: left, height }]} />
            <View style={[styles.dim, { top, left: left + width, right: 0, height }]} />
            <View
              pointerEvents="none"
              style={[styles.highlightBorder, { top, left, width, height, borderColor: colors.volt }]}
            />
          </>
        ) : (
          <View style={[styles.dim, StyleSheet.absoluteFillObject]} />
        )}

        <View
          style={[
            styles.tooltip,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              top: tooltipTop,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>{step.title}</Text>
          <Text style={[styles.text, { color: colors.mutedForeground }]}>{step.text}</Text>
          <View style={styles.row}>
            <TouchableOpacity onPress={onFinish} hitSlop={8}>
              <Text style={[styles.skip, { color: colors.mutedForeground }]}>Pular</Text>
            </TouchableOpacity>
            <View style={styles.dots}>
              {steps.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, { backgroundColor: i === index ? colors.volt : colors.border }]}
                />
              ))}
            </View>
            <TouchableOpacity
              onPress={() => (isLast ? onFinish() : setIndex((i) => i + 1))}
              style={[styles.nextBtn, { backgroundColor: colors.volt }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.nextText, { color: colors.accentForeground }]}>
                {isLast ? "Entendi" : "Próximo"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: { position: "absolute", backgroundColor: "rgba(0,0,0,0.72)" },
  highlightBorder: { position: "absolute", borderWidth: 3, borderRadius: 16 },
  tooltip: {
    position: "absolute",
    left: 20,
    right: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  title: { fontSize: 16, fontWeight: "800" },
  text: { fontSize: 13, lineHeight: 18 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  skip: { fontSize: 13, fontWeight: "600" },
  dots: { flexDirection: "row", gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  nextBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  nextText: { fontSize: 13, fontWeight: "800" },
});
