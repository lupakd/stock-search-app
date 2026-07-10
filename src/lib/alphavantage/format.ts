/**
 * Presentation formatters for Alphavantage's numbers. Pure and locale-aware
 * (Intl), so a price / percent / market cap looks the same wherever it renders.
 * A null (a gap in the upstream data) always shows as an em dash.
 */

const DASH = "—";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatCurrency(value: number | null): string {
  return value === null ? DASH : currency.format(value);
}

const signedCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  signDisplay: "exceptZero",
});

/** The day's change in price, with an explicit + or − sign. */
export function formatChange(value: number | null): string {
  return value === null ? DASH : signedCurrency.format(value);
}

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const signedPercent = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});

/** GLOBAL_QUOTE sends "change percent" as a whole number (0.52 → "+0.52%"). */
export function formatChangePercent(value: number | null): string {
  return value === null ? DASH : signedPercent.format(value / 100);
}

/** OVERVIEW sends ratios (e.g. dividend yield) as a fraction (0.0052 → "0.52%"). */
export function formatRatio(value: number | null): string {
  return value === null ? DASH : percent.format(value);
}

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

export function formatMarketCap(value: number | null): string {
  return value === null ? DASH : `$${compact.format(value)}`;
}

const decimal = new Intl.NumberFormat("en-US");

export function formatNumber(value: number | null): string {
  return value === null ? DASH : decimal.format(value);
}
