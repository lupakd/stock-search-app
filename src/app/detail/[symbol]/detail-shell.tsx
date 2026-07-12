import type { ReactNode } from "react";
import Link from "next/link";

/** The framed layout for the detail route (main + back-link). Each state supplies its own panel(s). */
export function DetailShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12 lg:max-w-5xl">
      <Link
        href="/"
        className="text-sm text-muted-foreground transition hover:text-foreground"
      >
        ← Back to search
      </Link>
      {children}
    </main>
  );
}
