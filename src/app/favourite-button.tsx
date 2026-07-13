"use client";

import { useFavourites, type Favourite } from "./use-favourites";
import { StarIcon } from "./star-icon";

/** Star toggle for one stock. Reads/writes the shared favourites list. */
export function FavouriteButton({ symbol, name }: Favourite) {
  const { isFavourite, toggle } = useFavourites();
  const active = isFavourite(symbol);

  return (
    <button
      type="button"
      onClick={() => toggle({ symbol, name })}
      aria-pressed={active}
      aria-label={
        active ? `Remove ${symbol} from favourites` : `Add ${symbol} to favourites`
      }
      className={`shrink-0 rounded-lg p-2 transition hover:bg-foreground/5 ${
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <StarIcon filled={active} />
    </button>
  );
}
