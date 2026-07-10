import { searchSymbols } from "@/lib/alphavantage/client";
import {
  AlphavantageError,
  ConfigError,
  RateLimitError,
} from "@/lib/alphavantage/errors";
import type { SymbolMatch } from "@/lib/alphavantage/types";

type HomeProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  let matches: SymbolMatch[] = [];
  let errorMessage: string | null = null;
  if (query) {
    try {
      matches = await searchSymbols(query);
    } catch (error) {
      errorMessage = toUserMessage(error);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-12">
      <div className="glass-panel">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Stock Search</h1>
          <p className="text-muted-foreground">
            Search for a stock by symbol or company name.
          </p>
        </header>

        <form action="/" className="mt-8 flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="e.g. AAPL or Apple"
            required
            className="glass-input flex-1"
          />
          <button
            type="submit"
            className="glass-button"
          >
            Search
          </button>
        </form>

        <section className="mt-8">
          {errorMessage ? (
            <p className="glass-error">
              {errorMessage}
            </p>
          ) : !query ? (
            <p className="text-muted-foreground">Start typing a symbol or name above.</p>
          ) : matches.length === 0 ? (
            <p className="text-muted-foreground">No matches for “{query}”.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {matches.map((match) => (
                <li
                  key={match.symbol}
                  className="glass-card flex flex-col gap-1"
                >
                  <span className="font-semibold">{match.symbol}</span>
                  <span className="text-sm text-muted-foreground">
                    {match.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {[match.type, match.region, match.currency]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function toUserMessage(error: unknown): string {
  if (error instanceof RateLimitError) {
    return "Alphavantage's rate limit was hit — try again in a minute.";
  }
  if (error instanceof ConfigError) {
    return "The app is missing its Alphavantage API key.";
  }
  if (error instanceof AlphavantageError) {
    return "Couldn't reach Alphavantage right now — please try again.";
  }
  return "Something went wrong — please try again.";
}