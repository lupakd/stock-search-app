"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/alphavantage/format";
import type { PricePoint } from "@/lib/alphavantage/types";

/**
 * Daily-close area chart (Recharts). Loaded client-only via next/dynamic (see
 * price-chart.tsx), so it never runs on the server — no hydration mismatch, no
 * mounted-guard needed.
 */
export function PriceChartInner({ series }: { series: PricePoint[] }) {
  // Colour the trend like the quote's change: up = positive, down = destructive.
  const up = series[series.length - 1].close >= series[0].close;
  const color = up ? "rgb(var(--positive))" : "rgb(var(--destructive))";

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="price-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgb(var(--foreground) / 0.08)" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fill: "rgb(var(--muted-foreground))", fontSize: 11 }}
            minTickGap={48}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            orientation="right"
            width={64}
            domain={["auto", "auto"]}
            tickFormatter={(value) => formatCurrency(Number(value))}
            tick={{ fill: "rgb(var(--muted-foreground))", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [formatCurrency(Number(value)), "Close"]}
            labelFormatter={(label) => formatDate(String(label))}
            contentStyle={{
              background: "rgb(var(--background) / 0.9)",
              border: "1px solid rgb(var(--foreground) / 0.12)",
              borderRadius: "0.5rem",
              fontSize: "0.8rem",
            }}
            labelStyle={{ color: "rgb(var(--muted-foreground))" }}
            itemStyle={{ color: "rgb(var(--foreground))" }}
          />
          <Area
            type="monotone"
            dataKey="close"
            stroke={color}
            strokeWidth={2}
            fill="url(#price-fill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
