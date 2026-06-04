import * as Sentry from "@sentry/nextjs";
import { isSentryEnabled } from "./sentryConfig";

export type SentryTrackerContext = {
  source?: string;
  route?: string;
  method?: string;
  userId?: string | null;
  extra?: Record<string, unknown>;
};

/** Convert any thrown value into a JavaScript Error. */

function ensureErrorTypes(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  } else {
    if (typeof value !== "object" || value === null) {
      return new Error(value ? String(value) : "Unknown error");
    }

    const obj = value as Record<string, unknown>;
    const message =
      typeof obj.message === "string"
        ? obj.message
        : typeof obj.error === "string"
          ? obj.error
          : JSON.stringify(value);

    return new Error(message);
  }
}

/** Report every failure to Sentry (when enabled). Use in catch blocks. */
export function sentryTracker(
  error: unknown,
  context: SentryTrackerContext = {},
): void {
  if (!isSentryEnabled()) return;

  const err = ensureErrorTypes(error);

  Sentry.withScope((scope) => {
    if (context.source) scope.setTag("source", context.source);
    if (context.route) scope.setTag("route", context.route);
    if (context.method) scope.setTag("method", context.method);
    if (context.userId) scope.setUser({ id: context.userId });
    if (context.extra) scope.setContext("details", context.extra);

    const withMeta = err as Error & { statusCode?: number };
    if (typeof withMeta.statusCode === "number") {
      scope.setTag("status_code", String(withMeta.statusCode));
    }
    if (err.name) scope.setTag("error_name", err.name);

    Sentry.captureException(err);
  });
}
