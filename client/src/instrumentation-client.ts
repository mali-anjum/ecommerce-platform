import * as Sentry from "@sentry/nextjs";
import { initSentryBrowser } from "@/lib/monitoring/initSentry";

initSentryBrowser();

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
