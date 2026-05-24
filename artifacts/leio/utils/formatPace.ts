/**
 * Format a reading pace (pages/min) as a compact 3-digit max string.
 * < 10   → 1 decimal  (e.g. 8.4)
 * 10–99  → 1 decimal  (e.g. 24.4)
 * ≥ 100  → integer    (e.g. 300)
 * ≥ 1000 → capped "999"
 */
export function formatPace(pace: number): string {
  if (!pace || pace <= 0) return "—";
  const capped = Math.min(pace, 999);
  if (capped >= 100) return Math.round(capped).toString();
  return capped.toFixed(1);
}
