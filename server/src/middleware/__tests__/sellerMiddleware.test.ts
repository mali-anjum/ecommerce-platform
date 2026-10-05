import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../types/express";

const findUnique = jest.fn();
jest.mock("../../lib/prisma", () => ({
  prisma: { seller: { findUnique: (...args: unknown[]) => findUnique(...args) } },
}));

import {
  attachSellerProfile,
  requireSellerOrSuperAdmin,
} from "../sellerMiddleware";

function makeReq(role?: string): AuthenticatedRequest {
  return {
    user: role === undefined ? undefined : { userId: "user-1", email: "e", role },
  } as unknown as AuthenticatedRequest;
}

function makeRes() {
  const res = {} as Response & { status: jest.Mock; json: jest.Mock };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  findUnique.mockReset();
});

describe("requireSellerOrSuperAdmin", () => {
  it("returns 401 without a user", () => {
    const res = makeRes();
    const next = jest.fn();
    requireSellerOrSuperAdmin(makeReq(), res, next as unknown as NextFunction);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it.each(["SELLER", "SUPER_ADMIN"])("allows %s", (role) => {
    const res = makeRes();
    const next = jest.fn();
    requireSellerOrSuperAdmin(makeReq(role), res, next as unknown as NextFunction);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it.each(["USER", "ADMIN", "seller", ""])("returns 403 for role %p", (role) => {
    const res = makeRes();
    const next = jest.fn();
    requireSellerOrSuperAdmin(makeReq(role), res, next as unknown as NextFunction);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("attachSellerProfile", () => {
  async function run(req: AuthenticatedRequest) {
    const res = makeRes();
    const next = jest.fn();
    await attachSellerProfile(req, res, next as unknown as NextFunction);
    return { res, next };
  }

  it("returns 401 without a user and never queries the DB", async () => {
    const { res, next } = await run(makeReq());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("lets SUPER_ADMIN through without a seller lookup", async () => {
    const req = makeReq("SUPER_ADMIN");
    const { next } = await run(req);
    expect(next).toHaveBeenCalledTimes(1);
    expect(findUnique).not.toHaveBeenCalled();
    expect(req.sellerProfile).toBeUndefined();
  });

  it("attaches the seller profile scoped to the authenticated user", async () => {
    findUnique.mockResolvedValue({ id: "seller-9" });
    const req = makeReq("SELLER");
    const { next } = await run(req);

    expect(findUnique).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      select: { id: true },
    });
    expect(req.sellerProfile).toEqual({ id: "seller-9" });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("returns 403 for a SELLER without a seller row", async () => {
    findUnique.mockResolvedValue(null);
    const req = makeReq("SELLER");
    const { res, next } = await run(req);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
    expect(req.sellerProfile).toBeUndefined();
  });

  it("returns 403 for a regular USER", async () => {
    const { res, next } = await run(makeReq("USER"));
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
    expect(findUnique).not.toHaveBeenCalled();
  });
});
