import * as Sentry from "@sentry/node";
import {
  getSentryEnvironment,
  isSentryEnabled,
  parseSampleRate,
  scrubSentryEvent,
} from "./sentryConfig";

let initialized = false;

export function initSentry(): void {
  if (initialized || !isSentryEnabled()) {
    if (!isSentryEnabled() && process.env.NODE_ENV === "development") {
      console.log("[sentry] Monitoring disabled (local development)");
    }
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: getSentryEnvironment(),
    release: process.env.SENTRY_RELEASE,
    tracesSampleRate: parseSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE, 0.1),
    integrations: [Sentry.httpIntegration(), Sentry.expressIntegration()],
    beforeSend: scrubSentryEvent,
  });

  initialized = true;
  console.log(`[sentry] Initialized (${getSentryEnvironment()})`);
}

/**
 * Sentry's default onUncaughtException/onUnhandledRejection integrations already capture
 * process-level errors, so these handlers must not report again (duplicate events).
 * uncaughtException is deliberately not handled: a listener would keep a corrupted
 * process alive. Sentry flushes and exits, or Node crashes and the host restarts it.
 */
export function registerProcessErrorHandlers(): void {
  process.on("unhandledRejection", (reason) => {
    const message = reason instanceof Error ? reason.stack ?? reason.message : String(reason);
    console.error("[process] Unhandled promise rejection:", message);
  });
}
