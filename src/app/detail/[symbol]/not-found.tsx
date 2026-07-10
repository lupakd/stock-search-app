import { DetailShell } from "./detail-shell";

export default function DetailNotFound() {
  return (
    <DetailShell>
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Symbol not found</h1>
        <p className="text-muted-foreground">
          We couldn’t find a quote for that symbol. Try another search.
        </p>
      </div>
    </DetailShell>
  );
}
