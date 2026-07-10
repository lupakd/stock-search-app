/** A search result from Alphavantage's SYMBOL_SEARCH endpoint, cleaned up. */
export interface SymbolMatch {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
  matchScore: number | null;
}
