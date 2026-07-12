"use client";

import dynamic from "next/dynamic";

/**
 * Public chart entry. Recharts is client-only and ~100KB, so we code-split it off the
 * detail route's initial JS with next/dynamic. `ssr: false` keeps it out of the server
 * render entirely (no hydration mismatch → no mounted-guard); the placeholder reserves
 * the layout height while the chunk streams in.
 */
export const PriceChart = dynamic(
  () => import("./price-chart-inner").then((m) => m.PriceChartInner),
  {
    ssr: false,
    loading: () => <div className="h-64 w-full" />,
  },
);
