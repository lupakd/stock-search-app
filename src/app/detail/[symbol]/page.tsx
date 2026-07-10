import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOverview, getQuote } from "@/lib/alphavantage/client";
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
import { DetailShell } from "./detail-shell";

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

  // Fire both in parallel; the overview only enriches, so it swallows its own
  // error to null (also null for ETFs / crypto / unknown symbols).
  const quotePromise = getQuote(symbol);
  const overviewPromise = getOverview(symbol).catch(() => null);

  let quote: Quote | null;

  try {
    quote = await quotePromise;
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

  const overview = await overviewPromise;

  return (
    <DetailShell>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {overview?.name ?? quote.symbol}
          </h1>
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
            <Stat label="Prev close" value={formatCurrency(quote.previousClose)} />
            <Stat label="Volume" value={formatNumber(quote.volume)} />
            <Stat label="Latest day" value={quote.latestTradingDay ?? "—"} />
          </dl>
        </section>

        {overview && <CompanyDetails overview={overview} />}
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
