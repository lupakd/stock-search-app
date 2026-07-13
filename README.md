# Stock Search

Search stocks by symbol or company name; view live quotes, company fundamentals, and a
price-history chart; and star favourites. Built with Next.js and the
[Alpha Vantage](https://www.alphavantage.co/) API.

## Features

- **Search** — a server-rendered results page (works with JS off) plus a debounced type-ahead
  dropdown.
- **Detail page** — live quote and day stats, company profile, and a ~90-day price chart.
- **Favourites** — star a stock; favourites persist per-device and live at `/favourites`.
- Responsive dark UI with proper loading / empty / error / not-found states throughout.

## Tech stack

- **Next.js 16** (App Router) + **React 19**, **TypeScript** (strict)
- **Tailwind CSS v4** (CSS-first, semantic tokens)
- **TanStack Query** — client cache for the type-ahead
- **Recharts** — the price chart (code-split, client-only)

## Getting started

```bash
npm install
```

Get a free API key at <https://www.alphavantage.co/support/#api-key> and add it to `.env.local`
(gitignored):

```
ALPHAVANTAGE_API_KEY=your_key_here
```

The key is **server-only** (no `NEXT_PUBLIC_` prefix) — it never reaches the browser.

```bash
npm run dev        # http://localhost:3000
```

## How it works

Alpha Vantage's free tier is tightly limited (~25 requests/day, ~1 request/second), which shapes
the architecture:

- **All API calls are server-side** — the key stays on the server; the browser only reaches data
  through the app's own route handler (`/api/search`) for the type-ahead.
- **Result-layer caching** (`unstable_cache`) + a **1 request/second throttle** keep it under the
  limits: repeat views come from cache, and a rate-limited response is never cached, so it can't
  poison an endpoint.
- **Graceful degradation** — a spent quota shows a friendly message, and the chart falls back to
  labelled sample data instead of a blank panel.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` / `npm run start` — production build and serve
- `npm run lint` — ESLint
- `npm run format` — Prettier
- `npm run typecheck` — TypeScript type-check (no emit)

## Deployment

Deployed on [Vercel](https://vercel.com/). Set `ALPHAVANTAGE_API_KEY` in the project's environment
variables; no other configuration is needed.
