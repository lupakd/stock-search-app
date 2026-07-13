"use client";

import { useSyncExternalStore } from "react";

export type Favourite = { symbol: string; name: string };

const STORAGE_KEY = "favourites";
const EMPTY: Favourite[] = [];

// localStorage is an external store, so read it through useSyncExternalStore rather than
// mirroring it into state via an effect. The parse is cached so getSnapshot returns a
// stable reference until the stored string changes (else the hook re-renders forever).
const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedFavourites: Favourite[] = EMPTY;

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function getSnapshot(): Favourite[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedFavourites = parseFavourites(raw);
  }
  return cachedFavourites;
}

// localStorage doesn't exist on the server; start empty and let the client swap in.
function getServerSnapshot(): Favourite[] {
  return EMPTY;
}

function toggle(favourite: Favourite): void {
  const current = getSnapshot();
  const next = current.some((entry) => entry.symbol === favourite.symbol)
    ? current.filter((entry) => entry.symbol !== favourite.symbol)
    : [...current, favourite];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((notify) => notify());
}

// false on the server + first client render, true once mounted — so the list can wait
// for the real localStorage value instead of flashing the empty state.
const noopSubscribe = () => () => {};
const onClient = () => true;
const onServer = () => false;

/** Reactive access to the favourites list, backed by localStorage. Single source of truth. */
export function useFavourites() {
  const favourites = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(noopSubscribe, onClient, onServer);

  return {
    favourites,
    hydrated,
    isFavourite: (symbol: string) =>
      favourites.some((favourite) => favourite.symbol === symbol),
    toggle,
  };
}

/** localStorage is untrusted input — parse defensively and drop anything malformed. */
function parseFavourites(raw: string | null): Favourite[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isFavouriteEntry) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function isFavouriteEntry(value: unknown): value is Favourite {
  return (
    typeof value === "object" &&
    value !== null &&
    "symbol" in value &&
    typeof value.symbol === "string" &&
    "name" in value &&
    typeof value.name === "string"
  );
}
