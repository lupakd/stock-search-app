/**
 * Generic coercion helpers for Alphavantage's stringly-typed JSON. Pure and
 * endpoint-agnostic — every parser (search, quote, overview, …) leans on these.
 */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Alphavantage sends every number as a string (and "%" / "None" / "-" for gaps). */
export function parseNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim().replace(/%$/, "");
  if (trimmed === "" || trimmed === "None" || trimmed === "-") {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}
