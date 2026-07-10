import {
  ConfigError,
  NotFoundError,
  RateLimitError,
  UpstreamError,
} from "./errors";
import type { SymbolMatch } from "./types";
import { asString, isRecord, parseNumber } from "./parse";

const BASE_URL = "https://www.alphavantage.co/query";

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
    throw new NotFoundError(payload["Error Message"]);
  }

  return payload;
}

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
    .map(parseSymbolMatch)
    .filter((match): match is SymbolMatch => match !== null);
}

/** Maps one raw `bestMatches` entry (ugly numbered keys) to a clean SymbolMatch. */
function parseSymbolMatch(raw: unknown): SymbolMatch | null {
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
    matchScore: parseNumber(raw["9. matchScore"]),
  };
}
