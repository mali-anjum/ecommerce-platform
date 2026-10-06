import type { Request, Response } from "express";

const consume = jest.fn();
const setSessionCookies = jest.fn();
const getProvider = jest.fn();
const start = jest.fn();
const handleCallback = jest.fn();
const queryRaw = jest.fn();

jest.mock("../../lib/monitoring", () => ({ sentryTracker: jest.fn() }));
jest.mock("../../services/auth/tokenService", () => ({
  setSessionCookies: (...a: unknown[]) => setSessionCookies(...a),
}));
jest.mock("../../services/oauth", () => ({
  oauthExchangeStore: { consume: (...a: unknown[]) => consume(...a) },
  mapProviderId: jest.requireActual("../../services/oauth/internal/helpers/providerId").mapProviderId,
  oauthService: {
    getProvider: (...a: unknown[]) => getProvider(...a),
    start: (...a: unknown[]) => start(...a),
    handleCallback: (...a: unknown[]) => handleCallback(...a),
  },
}));
jest.mock("../../lib/prisma", () => ({ prisma: { $queryRaw: (...a: unknown[]) => queryRaw(...a) } }));

import { exchangeOAuthCode } from "../oauthController";
import {
  googleOAuthCallbackHandler,
  oauthCallbackHandler,
  startGoogleOAuthHandler,
  startOAuthHandler,
} from "../oauthProviderController";
import { warmUp } from "../warmController";

type FakeRes = Response & { status: jest.Mock; json: jest.Mock };
function buildRes(): FakeRes {
  const res = {} as FakeRes;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}
const req = (parts: Record<string, unknown>) => ({ params: {}, query: {}, ...parts }) as unknown as Request;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => undefined);
  jest.spyOn(console, "log").mockImplementation(() => undefined);
  getProvider.mockReturnValue({ isConfigured: () => true, displayName: "GitHub" });
});
afterEach(() => jest.restoreAllMocks());

describe("exchangeOAuthCode", () => {
  it("requires a code", async () => {
    const res = buildRes();
    await exchangeOAuthCode(req({}), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(consume).not.toHaveBeenCalled();
  });

  it("rejects unknown or already-used codes", async () => {
    consume.mockReturnValueOnce(null);
    const res = buildRes();
    await exchangeOAuthCode(req({ query: { code: "used" } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(setSessionCookies).not.toHaveBeenCalled();
  });

  it("sets cookies and returns the user once", async () => {
    consume.mockReturnValueOnce({ accessToken: "at", refreshToken: "rt", user: { id: "u1" }, redirectTo: "/home" });
    const res = buildRes();
    await exchangeOAuthCode(req({ query: { code: "c1" } }), res);
    expect(setSessionCookies).toHaveBeenCalledWith(res, "at", "rt");
    expect(res.json.mock.calls[0][0]).toEqual({ success: true, message: "OAuth login successful", user: { id: "u1" }, redirectTo: "/home" });
    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain("rt");
  });

  it("returns a generic 500 without leaking error details", async () => {
    consume.mockImplementationOnce(() => {
      throw new Error("secret store at redis://10.0.0.1");
    });
    const res = buildRes();
    await exchangeOAuthCode(req({ query: { code: "c1" } }), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].error).toBe("OAuth exchange failed");
  });
});

describe("OAuth provider handlers", () => {
  it("returns 404 for unknown providers", async () => {
    const res = buildRes();
    startOAuthHandler(req({ params: { provider: "myspace" } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(start).not.toHaveBeenCalled();

    const cb = buildRes();
    await oauthCallbackHandler(req({ params: { provider: "myspace" } }), cb);
    expect(cb.status).toHaveBeenCalledWith(404);
  });

  it("returns 503 when the provider is not configured", async () => {
    getProvider.mockReturnValue({ isConfigured: () => false, displayName: "GitHub" });
    const res = buildRes();
    startOAuthHandler(req({ params: { provider: "github" } }), res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(start).not.toHaveBeenCalled();
  });

  it("starts and completes configured providers", async () => {
    const res = buildRes();
    startOAuthHandler(req({ params: { provider: "github" } }), res);
    expect(start).toHaveBeenCalledWith("github", res);

    const request = req({ params: { provider: "github" }, query: { code: "x" } });
    await oauthCallbackHandler(request, res);
    expect(handleCallback).toHaveBeenCalledWith("github", request, res);
  });

  it("keeps the legacy Google routes working", async () => {
    const res = buildRes();
    startGoogleOAuthHandler(req({}), res);
    expect(start).toHaveBeenCalledWith("google", res);
    await googleOAuthCallbackHandler(req({}), res);
    expect(handleCallback.mock.calls[0][0]).toBe("google");
  });

  it("hides internal errors behind a generic message", async () => {
    start.mockImplementationOnce(() => {
      throw new Error("GITHUB_CLIENT_SECRET missing");
    });
    const res = buildRes();
    startOAuthHandler(req({ params: { provider: "github" } }), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].error).not.toContain("SECRET");

    handleCallback.mockRejectedValueOnce(new Error("token endpoint said no"));
    const cb = buildRes();
    await oauthCallbackHandler(req({ params: { provider: "github" } }), cb);
    expect(cb.json.mock.calls[0][0].error).toBe("Sign-in failed. Please try again.");
  });
});

describe("warmUp", () => {
  it("reports warm when the database answers", async () => {
    queryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);
    const res = buildRes();
    await warmUp(req({}), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0]).toMatchObject({ status: "warm", services: { database: "connected" } });
  });

  it("reports cold with 500 when the database is down", async () => {
    queryRaw.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const res = buildRes();
    await warmUp(req({}), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0]).toMatchObject({ status: "cold", error: "Warmup failed" });
  });
});
