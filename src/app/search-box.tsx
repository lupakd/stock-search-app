"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { SymbolMatch } from "@/lib/alphavantage/types";

/**
 * The search input, enhanced with a debounced type-ahead dropdown. Stays a plain
 * `name="q"` field inside the native form, so submitting still does the SSR search;
 * the dropdown is an additive fast path straight to a stock's detail page.
 */
export function SearchBox({ defaultValue = "" }: { defaultValue?: string }) {
  const [query, setQuery] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query.trim(), 500);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: async ({ signal }): Promise<SymbolMatch[]> => {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(debouncedQuery)}`,
        { signal },
      );
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Couldn't load suggestions.");
      }
      return res.json();
    },
    enabled: debouncedQuery.length > 0,
    placeholderData: keepPreviousData,
  });

  // Close the dropdown when the pointer goes down outside the box.
  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const showDropdown = open && debouncedQuery.length > 0;

  return (
    <div ref={containerRef} className="relative flex-1">
      <input
        type="search"
        name="q"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        placeholder="e.g. AAPL or Apple"
        required
        autoComplete="off"
        className="glass-input w-full"
      />

      <div
        data-open={showDropdown}
        className="glass-dropdown absolute z-10 mt-2 w-full"
      >
        {isPending ? (
          <p className="px-4 py-3 text-sm text-muted-foreground">Searching…</p>
        ) : error ? (
          <p className="px-4 py-3 text-sm text-destructive">{error.message}</p>
        ) : !data || data.length === 0 ? (
          <p className="px-4 py-3 text-sm text-muted-foreground">No matches.</p>
        ) : (
          <ul className="no-scrollbar max-h-[min(20rem,calc(100dvh-16rem))] overflow-y-auto py-1">
            {data.map((match) => (
              <SuggestionRow
                key={match.symbol}
                match={match}
                onSelect={() => setOpen(false)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** One light suggestion row — a fast path straight to the stock's detail page. */
function SuggestionRow({
  match,
  onSelect,
}: {
  match: SymbolMatch;
  onSelect: () => void;
}) {
  return (
    <li>
      <Link
        href={`/detail/${encodeURIComponent(match.symbol)}`}
        prefetch={false}
        onClick={onSelect}
        className="flex items-baseline justify-between gap-3 px-4 py-2 transition hover:bg-foreground/5"
      >
        <span className="font-medium">{match.symbol}</span>
        <span className="truncate text-sm text-muted-foreground">
          {match.name}
        </span>
      </Link>
    </li>
  );
}

/** Returns `value` only after it has stopped changing for `delay` ms. */
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
