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

/** Network failure, a non-2xx response, or an unparseable body from Alphavantage. */
export class UpstreamError extends AlphavantageError {}

/** Alphavantage's rate limit / daily quota was hit (its `Note` / `Information` field). */
export class RateLimitError extends AlphavantageError {}

/** The requested symbol has no data (empty payload or an `Error Message`). */
export class NotFoundError extends AlphavantageError {}
