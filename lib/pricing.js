// MK Production pricing rule. Update HYOGO_MIN_WAGE every October.
export const HYOGO_MIN_WAGE = 1172; // yen per hour, from 2026-10-01
export const DEFAULT_YEN_PER_ML = 10;
export const MATERIAL_MARKUP = 1.2;

const num = (v) => (typeof v === "number" && isFinite(v) ? v : 0);

/** Material cost in yen: ml × yen/ml × 1.2 */
export function materialCost(o) {
  const ypm = o.yenPerMl == null || o.yenPerMl === "" ? DEFAULT_YEN_PER_ML : num(o.yenPerMl);
  return num(o.resinMl) * ypm * MATERIAL_MARKUP;
}

/** Hands-on labour in yen at the Hyogo minimum wage */
export function laborCost(o) {
  return (num(o.handsOnMinutes) / 60) * HYOGO_MIN_WAGE;
}

/** Suggested quote, rounded up to the next 100 yen */
export function suggestedQuote(o) {
  const raw = materialCost(o) + laborCost(o) + num(o.shippingYen);
  if (raw <= 0) return 0;
  return Math.ceil(Math.round(raw * 100) / 100 / 100) * 100;
}

/** Data delete date = shipped date + 90 days (YYYY-MM-DD), or null */
export function dataDeleteDate(shippedDate) {
  if (!shippedDate) return null;
  const d = new Date(shippedDate.slice(0, 10) + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 90);
  return d.toISOString().slice(0, 10);
}

export const yen = (n) => (n == null ? "–" : "¥" + Math.round(n).toLocaleString("ja-JP"));
