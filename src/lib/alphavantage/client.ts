import type { CompanyOverview, PricePoint, Quote, SymbolMatch } from "./types";
import { ConfigError, RateLimitError, UpstreamError } from "./errors";

const BASE_URL = "https://www.alphavantage.co/query";

// ─── Transport ────────────────────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.ALPHAVANTAGE_API_KEY;
  if (!key) {
    throw new ConfigError("ALPHAVANTAGE_API_KEY is not set");
  }
  return key;
}

/**
 * Calls Alphavantage and returns the parsed JSON object. Alphavantage signals
 * trouble *inside* a 200 response two ways — a rate-limit note and an error
 * message — so we detect both here and turn them into typed errors.
 */
async function fetchAlphavantage(
  params: Record<string, string>,
  revalidate: number,
): Promise<Record<string, unknown>> {
  const url = new URL(BASE_URL);
  url.search = new URLSearchParams({
    ...params,
    apikey: getApiKey(),
  }).toString();

  let response: Response;

  try {
    response = await fetch(url, { next: { revalidate } });
  } catch (cause) {
    throw new UpstreamError("Failed to reach Alphavantage", { cause });
  }

  if (!response.ok) {
    throw new UpstreamError(`Alphavantage responded with ${response.status}`);
  }

  let payload: unknown;
  try {
    payload = await response.json();

  } catch (cause) {
    throw new UpstreamError("Alphavantage returned invalid JSON", { cause });
  }

  if (!isRecord(payload)) {
    throw new UpstreamError("Alphavantage returned an unexpected shape");
  }

  const note = payload["Note"] ?? payload["Information"];
  if (typeof note === "string") {
    throw new RateLimitError(note);
  }
  if (typeof payload["Error Message"] === "string") {
    throw new UpstreamError(payload["Error Message"]);
  }

  return payload;
}

// ─── Search ───────────────────────────────────────────────────────────────────

/** Searches Alphavantage by symbol or company name. Returns [] for a blank query. */
export async function searchSymbols(query: string): Promise<SymbolMatch[]> {
  const keywords = query.trim();
  if (!keywords) {
    return [];
  }

  const data = await fetchAlphavantage(
    { function: "SYMBOL_SEARCH", keywords },
    3600,
  );

  const matches = data["bestMatches"];
  if (!Array.isArray(matches)) {
    return [];
  }

  return matches
    .map(mapSymbolMatch)
    .filter((match): match is SymbolMatch => match !== null);
}

/** One raw `bestMatches` entry (ugly numbered keys) → SymbolMatch. */
function mapSymbolMatch(raw: unknown): SymbolMatch | null {
  if (!isRecord(raw)) {
    return null;
  }
  const symbol = asString(raw["1. symbol"]);
  if (!symbol) {
    return null;
  }
  return {
    symbol,
    name: asString(raw["2. name"]),
    type: asString(raw["3. type"]),
    region: asString(raw["4. region"]),
    currency: asString(raw["8. currency"]),
  };
}

// ─── Quote ────────────────────────────────────────────────────────────────────

/**
 * Current price + day stats for one symbol. Returns null when Alphavantage has no
 * quote — an unknown or delisted symbol comes back as an empty `Global Quote`,
 * not an error. Cached 60s: quotes move, but not within a page view.
 */
export async function getQuote(symbol: string): Promise<Quote | null> {
  const data = await fetchAlphavantage({ function: "GLOBAL_QUOTE", symbol }, 60);
  return mapQuote(data["Global Quote"]);
}

/** The `Global Quote` object → Quote. Null for an empty (unknown/delisted) quote. */
function mapQuote(raw: unknown): Quote | null {
  if (!isRecord(raw)) {
    return null;
  }
  const symbol = asString(raw["01. symbol"]);
  const price = parseNumber(raw["05. price"]);
  if (!symbol || price === null) {
    return null;
  }
  return {
    symbol,
    price,
    open: parseNumber(raw["02. open"]),
    high: parseNumber(raw["03. high"]),
    low: parseNumber(raw["04. low"]),
    volume: parseNumber(raw["06. volume"]),
    latestTradingDay: asString(raw["07. latest trading day"]) || null,
    previousClose: parseNumber(raw["08. previous close"]),
    change: parseNumber(raw["09. change"]),
    changePercent: parseNumber(raw["10. change percent"]),
  };
}

// ─── Overview ─────────────────────────────────────────────────────────────────

/**
 * Company profile for one symbol. Returns null when there's no profile — OVERVIEW
 * comes back as an empty object for ETFs, crypto, and unknown symbols. Cached 24h:
 * a company's sector and description barely change.
 */
export async function getOverview(
  symbol: string,
): Promise<CompanyOverview | null> {
  const data = await fetchAlphavantage({ function: "OVERVIEW", symbol }, 86400);
  return mapOverview(data);
}

/** The OVERVIEW payload → CompanyOverview. Null when empty (ETF/crypto/unknown). */
function mapOverview(raw: unknown): CompanyOverview | null {
  if (!isRecord(raw)) {
    return null;
  }
  const name = asString(raw["Name"]);
  if (!name) {
    return null;
  }
  return {
    name,
    description: asString(raw["Description"]) || null,
    exchange: asString(raw["Exchange"]) || null,
    sector: asString(raw["Sector"]) || null,
    industry: asString(raw["Industry"]) || null,
    marketCap: parseNumber(raw["MarketCapitalization"]),
    peRatio: parseNumber(raw["PERatio"]),
    dividendYield: parseNumber(raw["DividendYield"]),
    week52High: parseNumber(raw["52WeekHigh"]),
    week52Low: parseNumber(raw["52WeekLow"]),
  };
}

// ─── Daily history ──────────────────────────────────────────────────────────────

/**
 * Daily closes for one symbol (last ~90 sessions, oldest → newest). Returns null when
 * there's no series. Cached 1h — daily bars only really move at the close.
 */
export async function getDailyHistory(
  symbol: string,
): Promise<PricePoint[] | null> {
  const data = await fetchAlphavantage(
    { function: "TIME_SERIES_DAILY", symbol },
    3600,
  );

  return mapDailyHistory(data);
}

/** The `Time Series (Daily)` object → chronological PricePoint[]. Null when empty. */
function mapDailyHistory(raw: unknown): PricePoint[] | null {
  const series = isRecord(raw) ? raw["Time Series (Daily)"] : undefined;
  if (!isRecord(series)) {
    return null;
  }
  const points: PricePoint[] = [];
  for (const [date, bar] of Object.entries(series)) {
    const close = isRecord(bar) ? parseNumber(bar["4. close"]) : null;
    if (close !== null) {
      points.push({ date, close });
    }
  }
  if (points.length === 0) {
    return null;
  }
  points.sort((a, b) => a.date.localeCompare(b.date)); // ISO dates sort chronologically
  return points.slice(-90);
}

// ─── Coercion primitives ────────────────────────────────────────────────────────
// Alphavantage's JSON is stringly-typed (numbers as strings; "None" / "-" / "" for
// gaps), so every mapper above leans on these to pull a clean value out of unknown.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function parseNumber(value: unknown): number | null {
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
