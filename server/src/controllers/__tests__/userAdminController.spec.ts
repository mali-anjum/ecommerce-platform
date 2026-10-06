import type { NextFunction, Response } from "express";

const userFindMany = jest.fn();
const userCount = jest.fn();
const userUpdate = jest.fn();

jest.mock("../../lib/prisma", () => ({
  prisma: {
    user: {
      findMany: (...a: unknown[]) => userFindMany(...a),
      count: (...a: unknown[]) => userCount(...a),
      update: (...a: unknown[]) => userUpdate(...a),
    },
  },
}));

import { getAdminUsers, setUserActiveState, setUserRole } from "../userAdminController";

type FakeRes = Response & { status: jest.Mock; json: jest.Mock };
function buildRes(): FakeRes {
  const res = {} as FakeRes;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}
async function run(handler: typeof getAdminUsers, req: Record<string, unknown>) {
  const res = buildRes();
  const next = jest.fn() as NextFunction & jest.Mock;
  handler({ params: {}, query: {}, body: {}, user: { userId: "admin-1", email: "a@b.co", role: "SUPER_ADMIN" }, ...req } as never, res, next);
  await new Promise((r) => setImmediate(r));
  return { res, next };
}

beforeEach(() => {
  jest.clearAllMocks();
  userFindMany.mockResolvedValue([]);
  userCount.mockResolvedValue(0);
});

describe("getAdminUsers", () => {
  it("uses default paging", async () => {
    const { res } = await run(getAdminUsers, {});
    expect(userFindMany.mock.calls[0][0]).toMatchObject({ skip: 0, take: 20, where: {} });
    expect(res.json.mock.calls[0][0].data.meta).toEqual({ page: 1, limit: 20, total: 0, totalPages: 1 });
  });

  it("clamps paging and computes total pages", async () => {
    userCount.mockResolvedValueOnce(250);
    const { res } = await run(getAdminUsers, { query: { page: "3", limit: "500" } });
    expect(userFindMany.mock.calls[0][0]).toMatchObject({ skip: 200, take: 100 });
    expect(res.json.mock.calls[0][0].data.meta).toEqual({ page: 3, limit: 100, total: 250, totalPages: 3 });
  });

  it("sanitises invalid paging values", async () => {
    await run(getAdminUsers, { query: { page: "-4", limit: "abc" } });
    expect(userFindMany.mock.calls[0][0]).toMatchObject({ skip: 0, take: 20 });
  });

  it("applies search, allow-listed role and active filters", async () => {
    await run(getAdminUsers, { query: { q: " ann ", role: "seller", active: "false" } });
    expect(userFindMany.mock.calls[0][0].where).toEqual({
      OR: [
        { name: { contains: "ann", mode: "insensitive" } },
        { email: { contains: "ann", mode: "insensitive" } },
      ],
      role: "SELLER",
      isActive: false,
    });
  });

  it("ignores unknown roles", async () => {
    await run(getAdminUsers, { query: { role: "GOD" } });
    expect(userFindMany.mock.calls[0][0].where).toEqual({});
  });

  it("never selects password or refresh tokens", async () => {
    await run(getAdminUsers, {});
    const select = userFindMany.mock.calls[0][0].select;
    expect(select).not.toHaveProperty("password");
    expect(select).not.toHaveProperty("refreshToken");
  });
});

describe("setUserActiveState", () => {
  it("requires a boolean isActive", async () => {
    const { next } = await run(setUserActiveState, { params: { userId: "u2" }, body: { isActive: "false" } });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400 });
  });

  it("prevents admins from deactivating themselves", async () => {
    const { next } = await run(setUserActiveState, { params: { userId: "admin-1" }, body: { isActive: false } });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400, message: "You cannot deactivate your own account" });
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("revokes the refresh token when deactivating", async () => {
    userUpdate.mockResolvedValueOnce({ id: "u2", isActive: false });
    const { res } = await run(setUserActiveState, { params: { userId: "u2" }, body: { isActive: false } });
    expect(userUpdate.mock.calls[0][0]).toMatchObject({ where: { id: "u2" }, data: { isActive: false, refreshToken: null } });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("only flips isActive when reactivating", async () => {
    userUpdate.mockResolvedValueOnce({ id: "u2", isActive: true });
    await run(setUserActiveState, { params: { userId: "u2" }, body: { isActive: true } });
    expect(userUpdate.mock.calls[0][0].data).toEqual({ isActive: true });
  });
});

describe("setUserRole", () => {
  it("rejects unknown roles", async () => {
    const { next } = await run(setUserRole, { params: { userId: "u2" }, body: { role: "ROOT" } });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400, message: "Invalid role value" });
  });

  it("prevents admins from demoting themselves", async () => {
    const { next } = await run(setUserRole, { params: { userId: "admin-1" }, body: { role: "USER" } });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400 });
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("normalises and applies a valid role", async () => {
    userUpdate.mockResolvedValueOnce({ id: "u2", role: "SELLER" });
    const { res } = await run(setUserRole, { params: { userId: "u2" }, body: { role: " seller " } });
    expect(userUpdate.mock.calls[0][0]).toMatchObject({ where: { id: "u2" }, data: { role: "SELLER" } });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
