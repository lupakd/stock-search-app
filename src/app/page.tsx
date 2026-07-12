import Link from "next/link";
import { searchSymbols } from "@/lib/alphavantage/client";
import { toUserMessage } from "@/lib/alphavantage/errors";
import type { SymbolMatch } from "@/lib/alphavantage/types";
import { SearchBox } from "./search-box";

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
    <main className="mx-auto flex min-h-0 max-h-dvh w-full max-w-2xl flex-col gap-8 px-4 py-12 lg:max-w-4xl">
      <div className="glass-panel flex min-h-0 flex-1 flex-col">
        <header className="flex shrink-0 flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Stock Search</h1>
          <p className="text-muted-foreground">
            Search for a stock by symbol or company name.
          </p>
        </header>

        <form action="/" className="mt-8 flex shrink-0 flex-col gap-2 sm:flex-row">
          <SearchBox defaultValue={query} />
          <button type="submit" className="glass-button">
            Search
          </button>
        </form>

        <section
          className={`mt-5 min-h-0 flex-1 py-5 overflow-y-auto${matches.length > 0 ? " scroll-fade" : ""
            }`}
        >
          {errorMessage ? (
            <p className="glass-error">{errorMessage}</p>
          ) : !query ? (
            <p className="text-muted-foreground">
              Start typing a symbol or name above.
            </p>
          ) : matches.length === 0 ? (
            <p className="text-muted-foreground">No matches for “{query}”.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {matches.map((match) => (
                <li key={match.symbol}>
                  <Link
                    href={`/detail/${encodeURIComponent(match.symbol)}`}
                    prefetch={false}
                    className="glass-card flex flex-col gap-1 transition hover:border-foreground/25"
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
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
