import { DetailShell } from "./detail-shell";

export default function Loading() {
  return (
    <DetailShell>
      <div className="flex animate-pulse flex-col gap-3">
        <div className="h-7 w-48 rounded bg-foreground/10" />
        <div className="h-4 w-32 rounded bg-foreground/10" />
        <div className="mt-4 h-10 w-40 rounded bg-foreground/10" />
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <div className="h-3 w-16 rounded bg-foreground/10" />
              <div className="h-5 w-20 rounded bg-foreground/10" />
            </div>
          ))}
        </div>
      </div>
    </DetailShell>
  );
}
