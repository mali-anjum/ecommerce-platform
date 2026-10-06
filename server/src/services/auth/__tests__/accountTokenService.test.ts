import crypto from "crypto";

const deleteManyMock = jest.fn();
const createMock = jest.fn();
const findUniqueMock = jest.fn();
const updateManyMock = jest.fn();
const userUpdateMock = jest.fn();

const tx = {
  accountToken: {
    findUnique: (...args: unknown[]) => findUniqueMock(...args),
    updateMany: (...args: unknown[]) => updateManyMock(...args),
  },
  user: { update: (...args: unknown[]) => userUpdateMock(...args) },
};

jest.mock("../../../lib/prisma", () => ({
  prisma: {
    accountToken: {
      deleteMany: (...args: unknown[]) => deleteManyMock(...args),
      create: (...args: unknown[]) => createMock(...args),
    },
    $transaction: jest.fn(async (arg: unknown) =>
      Array.isArray(arg) ? Promise.all(arg) : (arg as (t: typeof tx) => unknown)(tx),
    ),
  },
}));

import {
  ACCOUNT_TOKEN_TTL_MS,
  consumeAccountToken,
  hashAccountToken,
  issueAccountToken,
} from "../accountTokenService";

const sha256 = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

describe("hashAccountToken", () => {
  it("returns the SHA-256 hex digest", () => {
    expect(hashAccountToken("abc")).toBe(sha256("abc"));
  });
});

describe("issueAccountToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    deleteManyMock.mockResolvedValue({ count: 0 });
    createMock.mockResolvedValue({});
  });

  it("stores only the hash and returns an unguessable raw token", async () => {
    const before = Date.now();
    const raw = await issueAccountToken("user-1", "PASSWORD_RESET");

    expect(raw).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const data = createMock.mock.calls[0][0].data;
    expect(data).toEqual({
      userId: "user-1",
      type: "PASSWORD_RESET",
      tokenHash: sha256(raw),
      expiresAt: expect.any(Date),
    });
    expect(JSON.stringify(createMock.mock.calls)).not.toContain(raw);

    const ttl = data.expiresAt.getTime() - before;
    expect(ttl).toBeGreaterThanOrEqual(ACCOUNT_TOKEN_TTL_MS.PASSWORD_RESET);
    expect(ttl).toBeLessThan(ACCOUNT_TOKEN_TTL_MS.PASSWORD_RESET + 5000);
  });

  it("invalidates earlier unused tokens of the same type for that user", async () => {
    await issueAccountToken("user-1", "EMAIL_VERIFICATION");

    expect(deleteManyMock).toHaveBeenCalledWith({
      where: { userId: "user-1", type: "EMAIL_VERIFICATION", usedAt: null },
    });
  });

  it("uses a 30 minute reset window and 24 hour verification window", () => {
    expect(ACCOUNT_TOKEN_TTL_MS.PASSWORD_RESET).toBe(30 * 60 * 1000);
    expect(ACCOUNT_TOKEN_TTL_MS.EMAIL_VERIFICATION).toBe(24 * 60 * 60 * 1000);
  });

  it("returns a different token every time", async () => {
    const a = await issueAccountToken("user-1", "PASSWORD_RESET");
    const b = await issueAccountToken("user-1", "PASSWORD_RESET");
    expect(a).not.toBe(b);
  });
});

describe("consumeAccountToken", () => {
  const validToken = {
    id: "tok-1",
    userId: "user-1",
    type: "PASSWORD_RESET",
    usedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
  };
  const onConsumed = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    updateManyMock.mockResolvedValue({ count: 1 });
    onConsumed.mockResolvedValue(undefined);
  });

  it("looks the token up by hash, claims it, and runs the callback inside the transaction", async () => {
    findUniqueMock.mockResolvedValue(validToken);

    const result = await consumeAccountToken("raw-token", "PASSWORD_RESET", onConsumed);

    expect(result).toBe("user-1");
    expect(findUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tokenHash: sha256("raw-token") } }),
    );
    expect(updateManyMock).toHaveBeenCalledWith({
      where: { id: "tok-1", usedAt: null },
      data: { usedAt: expect.any(Date) },
    });
    expect(onConsumed).toHaveBeenCalledWith(tx, "user-1");
  });

  it("allows enough time for a high-latency remote database", async () => {
    findUniqueMock.mockResolvedValue(validToken);
    const { prisma } = jest.requireMock("../../../lib/prisma");

    await consumeAccountToken("raw-token", "PASSWORD_RESET", onConsumed);

    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      maxWait: 10_000,
      timeout: 15_000,
    });
  });

  it.each([
    ["unknown", null],
    ["of another type", { ...validToken, type: "EMAIL_VERIFICATION" }],
    ["already used", { ...validToken, usedAt: new Date() }],
    ["expired", { ...validToken, expiresAt: new Date(Date.now() - 1000) }],
  ])("returns null and changes nothing when the token is %s", async (_label, row) => {
    findUniqueMock.mockResolvedValue(row);

    const result = await consumeAccountToken("raw-token", "PASSWORD_RESET", onConsumed);

    expect(result).toBeNull();
    expect(updateManyMock).not.toHaveBeenCalled();
    expect(onConsumed).not.toHaveBeenCalled();
  });

  it("returns null when a concurrent request claimed the token first", async () => {
    findUniqueMock.mockResolvedValue(validToken);
    updateManyMock.mockResolvedValue({ count: 0 });

    const result = await consumeAccountToken("raw-token", "PASSWORD_RESET", onConsumed);

    expect(result).toBeNull();
    expect(onConsumed).not.toHaveBeenCalled();
  });
});
