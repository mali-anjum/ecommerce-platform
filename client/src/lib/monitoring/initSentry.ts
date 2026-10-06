import * as Sentry from "@sentry/nextjs";
import {
  getSentryDsn,
  getSentryEnvironment,
  isSentryEnabled,
  parseSampleRate,
  scrubSentryEvent,
} from "./sentryConfig";

/**
 * Single source of Sentry.init() settings for every runtime (browser, Node, Edge).
 * Do not call Sentry.init() anywhere else — use initSentryBrowser/initSentryServer.
 */
export function baseInitOptions() {
  return {
    dsn: getSentryDsn(),
    environment: getSentryEnvironment(),
    release: process.env.SENTRY_RELEASE ?? process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    // % of requests traced for speed (0.1 = 10%); keeps cost down
    tracesSampleRate: parseSampleRate(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ??
        process.env.SENTRY_TRACES_SAMPLE_RATE,
      0.1
    ),
    enableLogs: true,
    // Scrub tokens/cookies/passwords before anything leaves the process
    beforeSend: scrubSentryEvent,
    enabled: isSentryEnabled(),
  };
}

/** Called once from instrumentation-client.ts. */
export function initSentryBrowser(): void {
  if (typeof window === "undefined" || !isSentryEnabled() || Sentry.isInitialized()) {
    return;
  }

  Sentry.init({
    ...baseInitOptions(),
    integrations: [Sentry.replayIntegration()],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

/** Called once per server runtime (nodejs and edge) from instrumentation.ts. */
export function initSentryServer(): void {
  if (!isSentryEnabled() || Sentry.isInitialized()) {
    return;
  }

  Sentry.init(baseInitOptions());
}
