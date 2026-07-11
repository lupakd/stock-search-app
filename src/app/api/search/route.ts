import { searchSymbols } from "@/lib/alphavantage/client";
import { toUserMessage } from "@/lib/alphavantage/errors";

/**
 * The client type-ahead's server doorway. A browser component can't call
 * `searchSymbols` directly (that would ship the API key), so it fetches this
 * route instead — a thin controller that delegates to the client and returns JSON.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return Response.json([]);
  }

  try {
    return Response.json(await searchSymbols(q));
  } catch (error) {
    return Response.json({ error: toUserMessage(error) }, { status: 502 });
  }
}
