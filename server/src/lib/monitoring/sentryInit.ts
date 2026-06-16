import * as Sentry from "@sentry/node";
import {
  getSentryEnvironment,
  isSentryEnabled,
  parseSampleRate,
  scrubSentryEvent,
} from "./sentryConfig";
import { sentryTracker } from "./sentryTracker";

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

export function registerProcessErrorHandlers(): void {
  process.on("unhandledRejection", (reason) => {
    sentryTracker(reason, { source: "unhandledRejection" });
  });

  process.on("uncaughtException", (error) => {
    sentryTracker(error, { source: "uncaughtException" });
  });
}
