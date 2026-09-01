const COVER_COLORS = [
  "#1A1A2E",
  "#16213E",
  "#0F3460",
  "#533483",
  "#2C3E50",
  "#27AE60",
  "#8E44AD",
  "#E74C3C",
  "#D35400",
  "#1ABC9C",
];

/** Deterministic fallback cover color, used whenever there's no real cover art. */
export function pickCoverColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % COVER_COLORS.length;
  return COVER_COLORS[idx];
}
