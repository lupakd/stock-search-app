/**
 * Error types thrown by the Alphavantage client, so callers (server components,
 * route handlers) can map each failure to the right UI state / HTTP status.
 */
export class AlphavantageError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

/** The API key is missing or misconfigured. */
export class ConfigError extends AlphavantageError {}

/** Network failure, a non-2xx, a bad body, or an `Error Message` from Alphavantage. */
export class UpstreamError extends AlphavantageError {}

/** Alphavantage's rate limit / daily quota was hit (its `Note` / `Information` field). */
export class RateLimitError extends AlphavantageError {}

/**
 * Turns any thrown error into a short, human message for the UI — the one place
 * that maps our error taxonomy to copy, so search and detail stay consistent.
 */
export function toUserMessage(error: unknown): string {
  if (error instanceof RateLimitError) {
    return "Alphavantage's rate limit was hit — try again in a minute.";
  }
  if (error instanceof ConfigError) {
    return "The app is missing its Alphavantage API key.";
  }
  if (error instanceof AlphavantageError) {
    return "Couldn't reach Alphavantage right now — please try again.";
  }
  return "Something went wrong — please try again.";
}
