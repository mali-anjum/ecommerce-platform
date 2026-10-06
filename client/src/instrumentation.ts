import * as Sentry from "@sentry/nextjs";
import { initSentryServer } from "@/lib/monitoring/initSentry";

// Runs once per server runtime ("nodejs" and "edge"); the browser uses instrumentation-client.ts.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    initSentryServer();
  }
}

export const onRequestError = Sentry.captureRequestError;
