import type { PricePoint } from "./types";

/**
 * A deterministic ~90-session sample price series, seeded by the symbol, used as a
 * graceful fallback when Alphavantage's free-tier quota is spent — so the chart (and
 * the live demo) stay alive instead of going blank. Always labelled as sample data in
 * the UI; never passed off as real.
 */
export function mockDailyHistory(symbol: string): PricePoint[] {
  let seed = [...symbol].reduce((sum, char) => sum + char.charCodeAt(0), 7);
  const next = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  const points: PricePoint[] = [];
  let price = 60 + next() * 180; // 60–240
  const today = new Date();
  for (let daysAgo = 89; daysAgo >= 0; daysAgo--) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - daysAgo);
    price = Math.max(5, price * (1 + (next() - 0.5) * 0.04)); // ±2% step
    points.push({
      date: date.toISOString().slice(0, 10),
      close: Number(price.toFixed(2)),
    });
  }
  return points;
}
