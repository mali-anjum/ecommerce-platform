// Must be imported before express/http: @sentry/node patches modules at load time,
// so initializing later silently disables request tracing and per-request scopes.
import "./config/loadEnv";
import { initSentry } from "./lib/monitoring/sentryInit";

initSentry();
