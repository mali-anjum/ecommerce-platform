import * as Sentry from "@sentry/nextjs";
import {
  getSentryDsn,
  getSentryEnvironment,
  isSentryEnabled,
  parseSampleRate,
  scrubSentryEvent,
} from "./sentryConfig";

let browserInitialized = false;

function baseInitOptions() {
  return {
    dsn: getSentryDsn(),
    environment: getSentryEnvironment(),
    release: process.env.SENTRY_RELEASE ?? process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    tracesSampleRate: parseSampleRate(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ??
        process.env.SENTRY_TRACES_SAMPLE_RATE,
      0.1
    ),
    beforeSend: scrubSentryEvent,
    enabled: isSentryEnabled(),
  };
}

/** Browser bundle — called from sentry.client.config.ts */
export function initSentryBrowser(): void {
  if (browserInitialized || typeof window === "undefined" || !isSentryEnabled()) {
    return;
  }

  Sentry.init({ ...baseInitOptions() });
  browserInitialized = true;
}

/** Next.js server runtime — called from sentry.server.config.ts */
export function initSentryServer(): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.init({ ...baseInitOptions() });
}
