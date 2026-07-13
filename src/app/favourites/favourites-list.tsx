"use client";

import Link from "next/link";
import { useFavourites } from "../use-favourites";
import { FavouriteButton } from "../favourite-button";

/** The favourites grid: hydrating → empty → list. */
export function FavouritesList() {
  const { favourites, hydrated } = useFavourites();

  // Until localStorage is read we don't know the list — render nothing rather than
  // flash the empty state. The read is synchronous, so this is a single paint.
  if (!hydrated) {
    return <div className="mt-8 flex-1" />;
  }

  if (favourites.length === 0) {
    return (
      <p className="mt-8 text-muted-foreground">
        No favourites yet — star a stock from its detail page.
      </p>
    );
  }

  return (
    <section className="mt-8 min-h-0 flex-1 overflow-y-auto">
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {favourites.map((favourite) => (
          <li key={favourite.symbol}>
            <div className="glass-card flex items-center justify-between gap-2">
              <Link
                href={`/detail/${encodeURIComponent(favourite.symbol)}`}
                prefetch={false}
                className="flex min-w-0 flex-col gap-1"
              >
                <span className="font-semibold">{favourite.symbol}</span>
                <span className="truncate text-sm text-muted-foreground">
                  {favourite.name}
                </span>
              </Link>
              <FavouriteButton symbol={favourite.symbol} name={favourite.name} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
