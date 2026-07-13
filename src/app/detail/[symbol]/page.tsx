import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getDailyHistory,
  getOverview,
  getQuote,
} from "@/lib/alphavantage/client";
import { toUserMessage } from "@/lib/alphavantage/errors";
import {
  formatChange,
  formatChangePercent,
  formatCurrency,
  formatMarketCap,
  formatNumber,
  formatRatio,
} from "@/lib/alphavantage/format";
import type { CompanyOverview, Quote } from "@/lib/alphavantage/types";
import { mockDailyHistory } from "@/lib/alphavantage/mock";
import { FavouriteButton } from "@/app/favourite-button";
import { DetailShell } from "./detail-shell";
import { PriceChart } from "./price-chart";

type DetailProps = {
  params: Promise<{ symbol: string }>;
};

export async function generateMetadata({
  params,
}: DetailProps): Promise<Metadata> {
  const { symbol } = await params;
  return {
    title: `${symbol.toUpperCase()} · Stock Search`,
  };
}

export default async function Detail({ params }: DetailProps) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();

  // Serial, NOT parallel: Alphavantage's free tier throttles a burst of concurrent
  // requests (the later ones come back rate-limited), so we space the three out.
  // Quote is the spine; overview + history enrich (best-effort → null on failure).
  let quote: Quote | null;
  try {
    quote = await getQuote(symbol);
  } catch (error) {
    return (
      <DetailShell>
        <p className="glass-error">{toUserMessage(error)}</p>
      </DetailShell>
    );
  }

  if (quote === null) {
    notFound();
  }

  const overview = await getOverview(symbol).catch(() => null);
  // Best-effort: fall back to labelled sample data when the quota is spent, so the
  // chart (and the live demo) survive instead of going blank.
  const realHistory = await getDailyHistory(symbol).catch(() => null);
  const history = realHistory ?? mockDailyHistory(symbol);
  const isSampleHistory = realHistory === null;

  return (
    <DetailShell>
      <div className="flex flex-col gap-6">
        <div className="glass-panel flex flex-col gap-6 lg:flex-1">
          <header className="flex flex-col gap-1">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                {overview?.name ?? quote.symbol}
              </h1>
              <FavouriteButton
                symbol={quote.symbol}
                name={overview?.name ?? quote.symbol}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {[quote.symbol, overview?.exchange, overview?.sector]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </header>

          <section className="flex flex-col gap-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Quote
            </h2>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-semibold tabular-nums">
                {formatCurrency(quote.price)}
              </span>
              {quote.change !== null && (
                <span
                  className={`text-sm font-medium tabular-nums ${quote.change < 0 ? "text-destructive" : "text-positive"
                    }`}
                >
                  {formatChange(quote.change)} (
                  {formatChangePercent(quote.changePercent)})
                </span>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Stat label="Open" value={formatCurrency(quote.open)} />
              <Stat label="High" value={formatCurrency(quote.high)} />
              <Stat label="Low" value={formatCurrency(quote.low)} />
              <Stat
                label="Prev close"
                value={formatCurrency(quote.previousClose)}
              />
              <Stat label="Volume" value={formatNumber(quote.volume)} />
              <Stat label="Latest day" value={quote.latestTradingDay ?? "—"} />
            </dl>
          </section>

          {overview && <CompanyDetails overview={overview} />}
        </div>

        <div className="glass-panel flex flex-col gap-4 lg:flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Price history
            </h2>
            {isSampleHistory && (
              <span className="text-xs text-muted-foreground">Sample data</span>
            )}
          </div>
          <PriceChart series={history} />
        </div>
      </div>
    </DetailShell>
  );
}

function CompanyDetails({ overview }: { overview: CompanyOverview }) {
  return (
    <section className="flex flex-col gap-4 border-t border-foreground/10 pt-6">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Company
      </h2>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Market cap" value={formatMarketCap(overview.marketCap)} />
        <Stat label="P/E ratio" value={formatNumber(overview.peRatio)} />
        <Stat label="Dividend yield" value={formatRatio(overview.dividendYield)} />
        <Stat label="52-wk high" value={formatCurrency(overview.week52High)} />
        <Stat label="52-wk low" value={formatCurrency(overview.week52Low)} />
        <Stat label="Industry" value={overview.industry ?? "—"} />
      </dl>
      {overview.description && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {overview.description}
        </p>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
