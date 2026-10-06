import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import type { Request, Response } from "express";

const userFindUnique = jest.fn();
const userFindFirst = jest.fn();
const userCreate = jest.fn();
const userUpdate = jest.fn();
const userUpdateMany = jest.fn();
const sendVerificationEmailSafely = jest.fn();

jest.mock("../../lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...a: unknown[]) => userFindUnique(...a),
      findFirst: (...a: unknown[]) => userFindFirst(...a),
      create: (...a: unknown[]) => userCreate(...a),
      update: (...a: unknown[]) => userUpdate(...a),
      updateMany: (...a: unknown[]) => userUpdateMany(...a),
    },
  },
}));
jest.mock("../../lib/monitoring", () => ({ sentryTracker: jest.fn() }));
jest.mock("../accountController", () => ({
  sendVerificationEmailSafely: (...a: unknown[]) => sendVerificationEmailSafely(...a),
}));

import {
  getCurrentUser,
  heartbeat,
  login,
  logout,
  markProfileComplete,
  refreshAccessToken,
  register,
} from "../authController";

const SECRET = "test-jwt-secret-value";
const sha256 = (v: string) => crypto.createHash("sha256").update(v).digest("hex");

type FakeRes = Response & {
  status: jest.Mock;
  json: jest.Mock;
  cookie: jest.Mock;
  clearCookie: jest.Mock;
};

function buildRes(): FakeRes {
  const res = {} as FakeRes;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
}

const req = (parts: Partial<Request> & { user?: unknown }) => parts as unknown as Request;

let savedSecret: string | undefined;
beforeEach(() => {
  jest.clearAllMocks();
  savedSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = SECRET;
  jest.spyOn(console, "log").mockImplementation(() => undefined);
  jest.spyOn(console, "warn").mockImplementation(() => undefined);
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  if (savedSecret === undefined) Reflect.deleteProperty(process.env, "JWT_SECRET");
  else process.env.JWT_SECRET = savedSecret;
  jest.restoreAllMocks();
});

describe("register", () => {
  it.each([
    [{ email: "a@b.co", password: "secret1" }],
    [{ name: "A", password: "secret1" }],
    [{ name: "A", email: "a@b.co" }],
  ])("returns 400 when a required field is missing (%o)", async (body) => {
    const res = buildRes();
    await register(req({ body }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Name, email, and password are required",
    });
    expect(userCreate).not.toHaveBeenCalled();
  });

  it("returns 400 for passwords shorter than 6 characters", async () => {
    const res = buildRes();
    await register(req({ body: { name: "A", email: "a@b.co", password: "12345" } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].error).toBe("Password must be at least 6 characters");
  });

  it("returns 400 when the email is already registered", async () => {
    userFindUnique.mockResolvedValueOnce({ id: "u1" });
    const res = buildRes();
    await register(req({ body: { name: "A", email: "a@b.co", password: "secret1" } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(userCreate).not.toHaveBeenCalled();
  });

  it("creates a USER with a bcrypt hash and sends verification email", async () => {
    userFindUnique.mockResolvedValueOnce(null);
    userCreate.mockImplementationOnce(async ({ data }) => ({ id: "u1", ...data }));
    const res = buildRes();
    await register(req({ body: { name: "Ann", email: "ann@b.co", password: "secret1" } }), res);

    const data = userCreate.mock.calls[0][0].data;
    expect(data).toMatchObject({ name: "Ann", email: "ann@b.co", role: "USER" });
    expect(data.password).not.toBe("secret1");
    await expect(bcrypt.compare("secret1", data.password)).resolves.toBe(true);
    expect(sendVerificationEmailSafely).toHaveBeenCalledWith({ id: "u1", email: "ann@b.co", name: "Ann" });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "User registered successfully",
      success: true,
      userId: "u1",
    });
  });

  it("returns a safe generic message when the database throws", async () => {
    userFindUnique.mockRejectedValueOnce(new Error("connect ECONNREFUSED 10.1.2.3:5432"));
    const res = buildRes();
    await register(req({ body: { name: "A", email: "a@b.co", password: "secret1" } }), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain("10.1.2.3");
  });
});

describe("login", () => {
  let hash: string;
  beforeAll(async () => {
    hash = await bcrypt.hash("correct-pass", 4);
  });

  it("returns 400 without credentials", async () => {
    const res = buildRes();
    await login(req({ body: { email: "a@b.co" } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(userFindUnique).not.toHaveBeenCalled();
  });

  it("returns 400 for a too-short password without hitting the DB", async () => {
    const res = buildRes();
    await login(req({ body: { email: "a@b.co", password: "123" } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(userFindUnique).not.toHaveBeenCalled();
  });

  it("returns 401 'Invalid credentials' for an unknown email", async () => {
    userFindUnique.mockResolvedValueOnce(null);
    const res = buildRes();
    await login(req({ body: { email: "x@b.co", password: "whatever1" } }), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Invalid credentials" });
  });

  it("returns 401 for OAuth-only accounts without a password", async () => {
    userFindUnique.mockResolvedValueOnce({ id: "u1", email: "a@b.co", password: null, role: "USER" });
    const res = buildRes();
    await login(req({ body: { email: "a@b.co", password: "whatever1" } }), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json.mock.calls[0][0].error).toContain("social sign-in");
  });

  it("returns the same 401 message for a wrong password (no account enumeration)", async () => {
    userFindUnique.mockResolvedValueOnce({ id: "u1", email: "a@b.co", password: hash, role: "USER", isActive: true });
    const res = buildRes();
    await login(req({ body: { email: "a@b.co", password: "wrong-pass" } }), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Invalid credentials" });
    expect(userUpdate).not.toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it("issues httpOnly cookies, stores only the hashed refresh token, and returns the user", async () => {
    userFindUnique.mockResolvedValueOnce({
      id: "u1",
      name: "Ann",
      email: "a@b.co",
      password: hash,
      role: "SELLER",
      isActive: true,
    });
    userUpdate.mockResolvedValueOnce({});
    const res = buildRes();
    await login(req({ body: { email: "a@b.co", password: "correct-pass" } }), res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.user).toEqual({ id: "u1", name: "Ann", email: "a@b.co", role: "SELLER" });
    expect(body).not.toHaveProperty("user.password");
    expect(body.tokenInfo.accessTokenExpiresIn).toBe(900);

    const [accessCall, refreshCall] = res.cookie.mock.calls;
    expect(accessCall[0]).toBe("accessToken");
    expect(accessCall[2]).toMatchObject({ httpOnly: true, path: "/" });
    const claims = jwt.verify(accessCall[1], SECRET) as jwt.JwtPayload;
    expect(claims).toMatchObject({ userId: "u1", email: "a@b.co", role: "SELLER" });

    expect(refreshCall[0]).toBe("refreshToken");
    const stored = userUpdate.mock.calls[0][0].data.refreshToken;
    expect(stored).toBe(sha256(refreshCall[1]));
    expect(stored).not.toBe(refreshCall[1]);
  });

  it("returns 403 for a deactivated account with the right password, without issuing cookies", async () => {
    userFindUnique.mockResolvedValueOnce({ id: "u1", email: "a@b.co", password: hash, role: "USER", isActive: false });
    const res = buildRes();
    await login(req({ body: { email: "a@b.co", password: "correct-pass" } }), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.cookie).not.toHaveBeenCalled();
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("does not reveal deactivation to someone with the wrong password", async () => {
    userFindUnique.mockResolvedValueOnce({ id: "u1", email: "a@b.co", password: hash, role: "USER", isActive: false });
    const res = buildRes();
    await login(req({ body: { email: "a@b.co", password: "wrong-pass" } }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 500 with a generic message when the DB fails", async () => {
    userFindUnique.mockRejectedValueOnce(new Error("db down"));
    const res = buildRes();
    await login(req({ body: { email: "a@b.co", password: "correct-pass" } }), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Login failed - please try again" });
  });
});

describe("getCurrentUser", () => {
  const token = () => jwt.sign({ userId: "u1", email: "a@b.co", role: "USER" }, SECRET);

  it("returns 401 without a token", async () => {
    const res = buildRes();
    await getCurrentUser(req({ cookies: {}, headers: {} }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns the user for a valid cookie token", async () => {
    userFindFirst.mockResolvedValueOnce({ id: "u1", email: "a@b.co" });
    const res = buildRes();
    await getCurrentUser(req({ cookies: { accessToken: token() }, headers: {} }), res);
    expect(userFindFirst.mock.calls[0][0].where).toEqual({ id: "u1", isActive: true });
    expect(userFindFirst.mock.calls[0][0].select).not.toHaveProperty("password");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ user: { id: "u1", email: "a@b.co" } });
  });

  it("accepts a Bearer token from the Authorization header", async () => {
    userFindFirst.mockResolvedValueOnce({ id: "u1" });
    const res = buildRes();
    await getCurrentUser(req({ cookies: {}, headers: { authorization: `Bearer ${token()}` } }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("returns 404 when the user no longer exists", async () => {
    userFindFirst.mockResolvedValueOnce(null);
    const res = buildRes();
    await getCurrentUser(req({ cookies: { accessToken: token() }, headers: {} }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 401 for a token signed with another secret", async () => {
    const forged = jwt.sign({ userId: "admin" }, "attacker-secret");
    const res = buildRes();
    await getCurrentUser(req({ cookies: { accessToken: forged }, headers: {} }), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(userFindFirst).not.toHaveBeenCalled();
  });

  it("returns 401 for an expired token", async () => {
    const expired = jwt.sign({ userId: "u1", exp: Math.floor(Date.now() / 1000) - 10 }, SECRET);
    const res = buildRes();
    await getCurrentUser(req({ cookies: { accessToken: expired }, headers: {} }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe("refreshAccessToken", () => {
  it("returns 401 without a refresh cookie", async () => {
    const res = buildRes();
    await refreshAccessToken(req({ cookies: {} }), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(userFindFirst).not.toHaveBeenCalled();
  });

  it("clears both cookies and returns 401 for an unknown refresh token", async () => {
    userFindFirst.mockResolvedValueOnce(null);
    const res = buildRes();
    await refreshAccessToken(req({ cookies: { refreshToken: "stolen" } }), res);
    expect(userFindFirst.mock.calls[0][0].where).toEqual({ refreshToken: sha256("stolen"), isActive: true });
    expect(res.clearCookie).toHaveBeenCalledWith("accessToken", expect.objectContaining({ maxAge: 0 }));
    expect(res.clearCookie).toHaveBeenCalledWith("refreshToken", expect.objectContaining({ maxAge: 0 }));
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("rotates the refresh token on success", async () => {
    userFindFirst.mockResolvedValueOnce({ id: "u1", name: "A", email: "a@b.co", role: "USER" });
    userUpdate.mockResolvedValueOnce({});
    const res = buildRes();
    await refreshAccessToken(req({ cookies: { refreshToken: "old-token" } }), res);

    const newRefresh = res.cookie.mock.calls.find((c) => c[0] === "refreshToken")![1];
    expect(newRefresh).not.toBe("old-token");
    expect(userUpdate.mock.calls[0][0].data.refreshToken).toBe(sha256(newRefresh));
    expect(res.json.mock.calls[0][0]).toMatchObject({ success: true, user: { id: "u1" } });
  });

  it("returns 500 when the DB fails", async () => {
    userFindFirst.mockRejectedValueOnce(new Error("db"));
    const res = buildRes();
    await refreshAccessToken(req({ cookies: { refreshToken: "t" } }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("heartbeat and markProfileComplete", () => {
  it.each([
    ["heartbeat", heartbeat],
    ["markProfileComplete", markProfileComplete],
  ])("%s returns 401 without an authenticated user", async (_name, handler) => {
    const res = buildRes();
    await handler(req({}) as never, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("heartbeat records lastLogin for the authenticated user only", async () => {
    userUpdate.mockResolvedValueOnce({});
    const res = buildRes();
    await heartbeat(req({ user: { userId: "u1", email: "a@b.co" } }) as never, res);
    expect(userUpdate.mock.calls[0][0].where).toEqual({ id: "u1" });
    expect(userUpdate.mock.calls[0][0].data.lastLogin).toBeInstanceOf(Date);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("markProfileComplete sets profileComplete", async () => {
    userUpdate.mockResolvedValueOnce({});
    const res = buildRes();
    await markProfileComplete(req({ user: { userId: "u1", email: "a@b.co" } }) as never, res);
    expect(userUpdate).toHaveBeenCalledWith({ where: { id: "u1" }, data: { profileComplete: true } });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("heartbeat returns 500 when the DB fails", async () => {
    userUpdate.mockRejectedValueOnce(new Error("db"));
    const res = buildRes();
    await heartbeat(req({ user: { userId: "u1", email: "a@b.co" } }) as never, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("logout", () => {
  it("revokes the stored refresh token and clears cookies", async () => {
    userUpdateMany.mockResolvedValueOnce({ count: 1 });
    const res = buildRes();
    await logout(req({ cookies: { refreshToken: "rt" } }), res);
    expect(userUpdateMany).toHaveBeenCalledWith({
      where: { refreshToken: sha256("rt") },
      data: { refreshToken: null },
    });
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("still clears cookies when no refresh token is present", async () => {
    const res = buildRes();
    await logout(req({ cookies: {} }), res);
    expect(userUpdateMany).not.toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
  });
});
