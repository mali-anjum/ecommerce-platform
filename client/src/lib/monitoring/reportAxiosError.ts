import { type AxiosError, type AxiosInstance } from "axios";
import { sentryTracker } from "./sentryTracker";

/** Attach Sentry reporting to any axios instance (browser or server). */
export function attachAxiosErrorReporting(
  instance: AxiosInstance,
  source: string
): void {
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      sentryTracker(error, {
        source,
        route: error.config?.url,
        method: error.config?.method?.toUpperCase(),
      });
      return Promise.reject(error);
    }
  );
}
