import colors from "@/constants/colors";

/**
 * Design tokens do Leio.
 *
 * Centraliza espaçamento, raios, tipografia e elevação para que as telas
 * parem de repetir números mágicos em cada StyleSheet. A paleta continua
 * vindo de constants/colors.ts (acessível via useColors()); aqui só
 * agregamos a gramática visual ao redor dela.
 */

/** Escala de espaçamento base-4. Use space.md/lg como padrão de respiro. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 48,
} as const;

/** Raios de canto. radii.md (12) é o padrão histórico do app. */
export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

/**
 * Escala tipográfica. O app aplica peso via fontWeight (a família Inter é
 * carregada em _layout nos pesos 400/500/600/700); seguimos a mesma convenção.
 */
export const type = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: "900" as const, letterSpacing: -0.8 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: "800" as const, letterSpacing: -0.5 },
  section: { fontSize: 18, lineHeight: 24, fontWeight: "800" as const, letterSpacing: -0.3 },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "400" as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: "600" as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "500" as const },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: "600" as const },
} as const;

/** Sombras suaves coerentes com a superfície clara (Papel). */
export const elevation = {
  none: {},
  sm: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
} as const;

export const theme = { colors, space, radii, type, elevation } as const;

export default theme;
