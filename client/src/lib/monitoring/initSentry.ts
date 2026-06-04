import * as Sentry from "@sentry/nextjs";
import {
  getSentryDsn,
  getSentryEnvironment,
  isSentryEnabled,
  parseSampleRate,
  scrubSentryEvent,
} from "./sentryConfig";

let browserInitialized = false;

/** Shared Sentry.init() settings for browser and Next server. */
function baseInitOptions() {
  return {
    // Where to send events (your Sentry project URL)
    dsn: getSentryDsn(),
    environment: getSentryEnvironment(),
    release: process.env.SENTRY_RELEASE ?? process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    // % of requests traced for speed (0.1 = 10%); keeps cost down
    tracesSampleRate: parseSampleRate(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ??
        process.env.SENTRY_TRACES_SAMPLE_RATE,
      0.1
    ),
    // Before sending the event to Sentry, scrub sensitive data
    beforeSend: scrubSentryEvent,
    enabled: isSentryEnabled(),
  };
}

export function initSentryBrowser(): void {
  if (browserInitialized || typeof window === "undefined" || !isSentryEnabled()) {
    return;
  }

  Sentry.init({ ...baseInitOptions() });
  browserInitialized = true;
}

export function initSentryServer(): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.init({ ...baseInitOptions() });
}
