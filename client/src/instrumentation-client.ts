// Browser runtime entry point. Sentry config lives in src/lib/monitoring/initSentry.ts.
import * as Sentry from "@sentry/nextjs";
import { initSentryBrowser } from "@/lib/monitoring/initSentry";

initSentryBrowser();

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
