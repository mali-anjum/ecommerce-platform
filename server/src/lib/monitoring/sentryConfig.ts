import type { ErrorEvent, EventHint } from "@sentry/node";

const SENSITIVE_KEYS = [
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "accessToken",
  "refreshToken",
  "stripe",
  "paypal",
];

function containsSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_KEYS.some((part) => lower.includes(part));
}

function scrubValue(value: unknown, depth = 0): unknown {
  if (depth > 4 || value == null) return value;
  if (Array.isArray(value)) {
    return value.map((item) => scrubValue(item, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      out[key] = containsSensitiveKey(key) ? "[Filtered]" : scrubValue(child, depth + 1);
    }
    return out;
  }
  return value;
}

export function scrubSentryEvent(event: ErrorEvent, _hint?: EventHint): ErrorEvent | null {
  if (event.request?.headers) {
    event.request.headers = scrubValue(event.request.headers) as Record<string, string>;
  }
  if (event.extra) {
    event.extra = scrubValue(event.extra) as Record<string, unknown>;
  }
  if (event.contexts) {
    event.contexts = scrubValue(event.contexts) as typeof event.contexts;
  }
  return event;
}

export function parseSampleRate(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const value = Number(raw);
  if (Number.isNaN(value) || value < 0 || value > 1) return fallback;
  return value;
}

/** Enabled in staging/production when DSN is set; off in local dev unless SENTRY_ENABLED=true. */
export function isSentryEnabled(): boolean {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return false;

  if (process.env.SENTRY_ENABLED === "true") return true;
  if (process.env.SENTRY_ENABLED === "false") return false;

  const env = (
    process.env.SENTRY_ENVIRONMENT ??
    process.env.NODE_ENV ??
    "development"
  ).toLowerCase();

  return env === "production" || env === "staging";
}

export function getSentryEnvironment(): string {
  return process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development";
}
