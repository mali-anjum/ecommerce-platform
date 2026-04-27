import type { InternalAxiosRequestConfig } from "axios";

export type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const AUTH_MUTATION_PATHS = ["/login", "/register", "/refresh-token", "/logout"];

export function isAuthMutationRequest(url: string): boolean {
  return AUTH_MUTATION_PATHS.some((path) => url.includes(path));
}

export function shouldRetryUnauthorizedRequest(
  status: number | undefined,
  requestConfig: RetryableRequestConfig
): boolean {
  if (status !== 401 || requestConfig._retry) {
    return false;
  }

  const requestUrl = String(requestConfig.url || "");
  return !isAuthMutationRequest(requestUrl);
}
