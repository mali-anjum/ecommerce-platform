import jwt from "jsonwebtoken";
import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../types/express";

jest.mock("../../lib/monitoring", () => ({ sentryTracker: jest.fn() }));

import { authenticateJwt, isSuperAdmin } from "../authMiddleware";
import { optionalAuthenticateJwt } from "../optionalAuthMiddleware";

const SECRET = "test-jwt-secret-for-middleware";
const claims = { userId: "user-1", email: "a@test.dev", role: "USER" };

function makeReq(
  init: { cookie?: string; authorization?: string; user?: AuthenticatedRequest["user"] } = {},
): AuthenticatedRequest {
  return {
    cookies: init.cookie ? { accessToken: init.cookie } : {},
    headers: init.authorization ? { authorization: init.authorization } : {},
    user: init.user,
  } as unknown as AuthenticatedRequest;
}

function makeRes() {
  const res = {} as Response & { status: jest.Mock; json: jest.Mock };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// Assigning undefined to process.env stores the string "undefined", so delete instead.
function restoreSecret(value: string | undefined) {
  if (value === undefined) Reflect.deleteProperty(process.env, "JWT_SECRET");
  else process.env.JWT_SECRET = value;
}

const sign = (payload: object, secret = SECRET, opts: jwt.SignOptions = {}) =>
  jwt.sign(payload, secret, { expiresIn: "15m", ...opts });

describe("authenticateJwt", () => {
  const originalSecret = process.env.JWT_SECRET;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    process.env.JWT_SECRET = SECRET;
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    restoreSecret(originalSecret);
    errorSpy.mockRestore();
  });

  async function run(req: AuthenticatedRequest) {
    const res = makeRes();
    const next = jest.fn() as unknown as NextFunction & jest.Mock;
    await authenticateJwt(req, res, next);
    return { res, next };
  }

  function expectRejected(res: ReturnType<typeof makeRes>, next: jest.Mock, error: string) {
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error });
  }

  it("accepts a valid cookie token and attaches only the expected claims", async () => {
    const req = makeReq({ cookie: sign({ ...claims, extra: "ignored" }) });
    const { res, next } = await run(req);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(req.user).toEqual(claims);
  });

  it("accepts a Bearer token when no cookie is present", async () => {
    const req = makeReq({ authorization: `Bearer ${sign(claims)}` });
    const { next } = await run(req);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual(claims);
  });

  it("prefers the cookie over the Authorization header", async () => {
    const req = makeReq({
      cookie: sign(claims),
      authorization: `Bearer ${sign({ ...claims, userId: "header-user" })}`,
    });
    await run(req);

    expect(req.user?.userId).toBe("user-1");
  });

  it("returns 401 'Authentication required' when no token is sent", async () => {
    const { res, next } = await run(makeReq());
    expectRejected(res, next, "Authentication required");
  });

  it("returns 401 for an empty Bearer header", async () => {
    const { res, next } = await run(makeReq({ authorization: "Bearer " }));
    expectRejected(res, next, "Authentication required");
  });

  it("rejects a token signed with a different secret", async () => {
    const req = makeReq({ cookie: sign(claims, "attacker-secret") });
    const { res, next } = await run(req);
    expectRejected(res, next, "Invalid or expired token");
    expect(req.user).toBeUndefined();
  });

  it("rejects an expired token", async () => {
    const expired = jwt.sign(
      { ...claims, exp: Math.floor(Date.now() / 1000) - 60 },
      SECRET,
    );
    const { res, next } = await run(makeReq({ cookie: expired }));
    expectRejected(res, next, "Invalid or expired token");
  });

  it("rejects an unsigned (alg: none) token", async () => {
    const unsigned = jwt.sign(claims, "", { algorithm: "none" });
    const { res, next } = await run(makeReq({ cookie: unsigned }));
    expectRejected(res, next, "Invalid or expired token");
  });

  it("rejects a token signed with a non-HS256 algorithm", async () => {
    const hs512 = sign(claims, SECRET, { algorithm: "HS512" });
    const { res, next } = await run(makeReq({ cookie: hs512 }));
    expectRejected(res, next, "Invalid or expired token");
  });

  it("rejects a tampered payload", async () => {
    const [header, , signature] = sign(claims).split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({ ...claims, role: "SUPER_ADMIN" }),
    ).toString("base64url");
    const { res, next } = await run(
      makeReq({ cookie: `${header}.${forgedPayload}.${signature}` }),
    );
    expectRejected(res, next, "Invalid or expired token");
  });

  it.each([
    ["userId", { email: claims.email, role: claims.role }],
    ["role", { userId: claims.userId, email: claims.email }],
    ["email", { userId: claims.userId, role: claims.role }],
    ["non-string userId", { ...claims, userId: 123 }],
  ])("rejects a validly signed token missing %s", async (_label, payload) => {
    const req = makeReq({ cookie: sign(payload) });
    const { res, next } = await run(req);
    expectRejected(res, next, "Invalid or expired token");
    expect(req.user).toBeUndefined();
  });

  it("fails closed when JWT_SECRET is not configured", async () => {
    const forged = sign(claims, "undefined");
    Reflect.deleteProperty(process.env, "JWT_SECRET");

    const { res, next } = await run(makeReq({ cookie: forged }));
    expectRejected(res, next, "Invalid or expired token");
  });

  it("does not log the raw token on failure", async () => {
    const badToken = sign(claims, "attacker-secret");
    await run(makeReq({ cookie: badToken }));

    const logged = JSON.stringify(errorSpy.mock.calls);
    expect(logged).not.toContain(badToken);
  });
});

describe("optionalAuthenticateJwt", () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = SECRET;
  });

  afterEach(() => {
    restoreSecret(originalSecret);
  });

  async function run(req: AuthenticatedRequest) {
    const res = makeRes();
    const next = jest.fn();
    await optionalAuthenticateJwt(req, res, next as unknown as NextFunction);
    return { res, next };
  }

  it("attaches the user for a valid token", async () => {
    const req = makeReq({ cookie: sign(claims) });
    const { next } = await run(req);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual(claims);
  });

  it("continues as guest without a token", async () => {
    const req = makeReq();
    const { res, next } = await run(req);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it("continues as guest (no user attached) for a forged token", async () => {
    const req = makeReq({ cookie: sign(claims, "attacker-secret") });
    const { res, next } = await run(req);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it("continues as guest when JWT_SECRET is missing", async () => {
    const forged = sign(claims, "undefined");
    Reflect.deleteProperty(process.env, "JWT_SECRET");
    const req = makeReq({ cookie: forged });
    const { next } = await run(req);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toBeUndefined();
  });
});

describe("isSuperAdmin", () => {
  it.each(["USER", "SELLER", "super_admin", undefined])(
    "returns 403 for role %p",
    (role) => {
      const res = makeRes();
      const next = jest.fn();
      isSuperAdmin(
        makeReq({ user: { userId: "u", email: "e", role } }),
        res,
        next,
      );
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    },
  );

  it("returns 403 when there is no user", () => {
    const res = makeRes();
    const next = jest.fn();
    isSuperAdmin(makeReq(), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("calls next for SUPER_ADMIN", () => {
    const res = makeRes();
    const next = jest.fn();
    isSuperAdmin(
      makeReq({ user: { userId: "u", email: "e", role: "SUPER_ADMIN" } }),
      res,
      next,
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
