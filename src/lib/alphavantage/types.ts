/** A search result from Alphavantage's SYMBOL_SEARCH endpoint, cleaned up. */
export interface SymbolMatch {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}

/** A live quote from Alphavantage's GLOBAL_QUOTE endpoint, cleaned up. */
export interface Quote {
  symbol: string;
  price: number;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  latestTradingDay: string | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
}

/** A company profile from Alphavantage's OVERVIEW endpoint, cleaned up. */
export interface CompanyOverview {
  name: string;
  description: string | null;
  exchange: string | null;
  sector: string | null;
  industry: string | null;
  marketCap: number | null;
  peRatio: number | null;
  dividendYield: number | null;
  week52High: number | null;
  week52Low: number | null;
}

/** One daily close for the price-history chart. */
export interface PricePoint {
  date: string;
  close: number;
}
