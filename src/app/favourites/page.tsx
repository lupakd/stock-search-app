import type { Metadata } from "next";
import Link from "next/link";
import { FavouritesList } from "./favourites-list";

export const metadata: Metadata = {
  title: "Favourites · Stock Search",
};

export default function FavouritesPage() {
  return (
    <main className="mx-auto flex min-h-0 max-h-dvh w-full max-w-2xl flex-col gap-8 px-4 py-12 lg:max-w-4xl">
      <div className="glass-panel flex min-h-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">Favourites</h1>
          <Link
            href="/"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            ← Search
          </Link>
        </header>

        <FavouritesList />
      </div>
    </main>
  );
}
