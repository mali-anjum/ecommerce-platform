import {
  isAuthMutationRequest,
  shouldRetryUnauthorizedRequest,
} from "../shouldRetryAuthRequest";
import type { RetryableRequestConfig } from "../shouldRetryAuthRequest";

function buildConfig(url: string, retry = false): RetryableRequestConfig {
  return {
    url,
    headers: {},
    method: "get",
    _retry: retry,
  } as RetryableRequestConfig;
}

describe("shouldRetryAuthRequest", () => {
  it("detects auth mutation URLs", () => {
    expect(isAuthMutationRequest("/login")).toBe(true);
    expect(isAuthMutationRequest("/register")).toBe(true);
    expect(isAuthMutationRequest("/refresh-token")).toBe(true);
    expect(isAuthMutationRequest("/logout")).toBe(true);
  });

  it("does not mark protected reads as mutations", () => {
    expect(isAuthMutationRequest("/me")).toBe(false);
    expect(isAuthMutationRequest("/session")).toBe(false);
  });

  it("retries first 401 for protected route", () => {
    const config = buildConfig("/me");
    expect(shouldRetryUnauthorizedRequest(401, config)).toBe(true);
  });

  it("does not retry when request was already retried", () => {
    const config = buildConfig("/me", true);
    expect(shouldRetryUnauthorizedRequest(401, config)).toBe(false);
  });

  it("does not retry for auth mutation endpoints", () => {
    const config = buildConfig("/login");
    expect(shouldRetryUnauthorizedRequest(401, config)).toBe(false);
  });

  it("does not retry non-401 errors", () => {
    const config = buildConfig("/me");
    expect(shouldRetryUnauthorizedRequest(500, config)).toBe(false);
    expect(shouldRetryUnauthorizedRequest(undefined, config)).toBe(false);
  });
});
